/**
 * One-off migration for the granular access-control rollout. Safe to re-run.
 *   - Legacy medical records get an explicit UNCLASSIFIED classification (patient + uploader only until reviewed)
 *   - Doctor specializations are normalized onto the Specialization enum
 *
 *   - With --cloudinary: existing public uploads are moved to authenticated (private) delivery
 *
 * Run:  npx tsx src/scripts/migrate-access-control.ts [--cloudinary]
 */
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import { ENV } from '../config/environment.js';
import { MedicalRecord } from '../models/MedicalRecord.js';
import { DoctorProfile } from '../models/DoctorProfile.js';
import { RECORD_TYPE_TO_CATEGORY, normalizeSpecialization } from '../config/taxonomy.js';

async function main() {
  await mongoose.connect(ENV.MONGODB_URI);

  let records = 0;
  for (const [recordType, category] of Object.entries(RECORD_TYPE_TO_CATEGORY)) {
    const res = await MedicalRecord.collection.updateMany(
      { recordType, 'classification.source': { $exists: false } },
      {
        $set: {
          classification: {
            category,
            associatedConditions: [],
            targetSpecializations: [],
            sensitivityLevel: 'STANDARD',
            source: 'UNCLASSIFIED',
            patientReviewed: false,
          },
        },
      }
    );
    records += res.modifiedCount;
  }
  console.log(`Records marked UNCLASSIFIED: ${records}`);

  let doctors = 0;
  const unmapped: string[] = [];
  for (const profile of await DoctorProfile.find()) {
    const normalized = normalizeSpecialization(profile.specialization);
    if (!normalized) {
      unmapped.push(`${profile.doctorId} ("${profile.specialization}")`);
      continue;
    }
    if (normalized !== profile.specialization) {
      profile.specialization = normalized;
      await profile.save();
      doctors++;
    }
  }
  console.log(`Doctor specializations normalized: ${doctors}`);
  if (unmapped.length) console.warn(`Needs manual mapping: ${unmapped.join(', ')}`);

  if (process.argv.includes('--cloudinary')) {
    await lockDownCloudinaryAssets();
  } else {
    console.log('Skipped Cloudinary lock-down (pass --cloudinary to make existing uploads private).');
  }

  await mongoose.disconnect();
}

/**
 * Existing uploads were stored with public delivery URLs. This moves each asset to Cloudinary's
 * "authenticated" delivery type (no public URL) and updates the record. Idempotent: records already
 * marked authenticated are skipped, and a failure on one asset does not stop the rest.
 */
async function lockDownCloudinaryAssets() {
  if (!ENV.CLOUDINARY_CLOUD_NAME || !ENV.CLOUDINARY_API_KEY || !ENV.CLOUDINARY_API_SECRET) {
    console.warn('Cloudinary is not configured; nothing to lock down.');
    return;
  }
  cloudinary.config({
    cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
    api_key: ENV.CLOUDINARY_API_KEY,
    api_secret: ENV.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const records = await MedicalRecord.find({
    'file.storageType': 'cloudinary',
    'file.deliveryType': { $ne: 'authenticated' },
    'file.publicCloudId': { $exists: true },
  });

  let moved = 0;
  const failed: string[] = [];
  for (const record of records) {
    const file = record.file!;
    try {
      await cloudinary.uploader.rename(file.publicCloudId!, file.publicCloudId!, {
        resource_type: file.mimeType === 'application/pdf' ? 'raw' : 'image',
        type: 'upload',
        to_type: 'authenticated',
        overwrite: true,
        invalidate: true,
      });
      await MedicalRecord.updateOne(
        { _id: record._id },
        { $set: { 'file.deliveryType': 'authenticated' }, $unset: { 'file.url': '' } }
      );
      moved++;
    } catch (e: any) {
      failed.push(`${record._id} (${e?.message ?? e})`);
    }
  }
  console.log(`Cloudinary assets made private: ${moved}`);
  if (failed.length) console.warn(`Failed (rerun to retry): ${failed.join('; ')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
