import { ENV } from '../config/environment.js';
import { User } from '../models/User.js';
import { DoctorProfile } from '../models/DoctorProfile.js';
import { normalizeSpecialization } from '../config/taxonomy.js';

/**
 * A doctor may open patient data when their profile is VERIFIED. With AUTO_VERIFY_DOCTORS=true
 * (demo deployments) every doctor who has not been explicitly REJECTED counts as verified, so turning
 * the flag on takes effect immediately without touching the database.
 */
export function isDoctorVerified(status?: string | null): boolean {
  if (status === 'VERIFIED') return true;
  return ENV.AUTO_VERIFY_DOCTORS && status !== 'REJECTED';
}

/**
 * Startup repair for older databases: doctor accounts created before profiles were required (for example
 * the original demo seed) get a profile, and free-text specializations are mapped onto the supported list.
 * Idempotent; safe to run on every boot.
 */
export async function ensureDoctorProfiles(): Promise<void> {
  const doctors = await User.find({ role: 'DOCTOR' }).select('_id publicId').lean();
  if (!doctors.length) return;

  const profiles = await DoctorProfile.find({ user: { $in: doctors.map((d) => d._id) } });
  const withProfile = new Set(profiles.map((p) => p.user.toString()));

  let created = 0;
  for (const d of doctors) {
    if (withProfile.has(d._id.toString())) continue;
    await DoctorProfile.create({
      user: d._id,
      doctorId: d.publicId,
      specialization: 'GENERAL_PRACTICE',
      licenseNumber: 'NOT-PROVIDED',
      verificationStatus: ENV.AUTO_VERIFY_DOCTORS ? 'VERIFIED' : 'PENDING',
    });
    created++;
  }

  let normalized = 0;
  for (const p of profiles) {
    const spec = normalizeSpecialization(p.specialization);
    if (spec && spec !== p.specialization) {
      p.specialization = spec;
      await p.save();
      normalized++;
    }
  }
  if (created || normalized) {
    console.log(`🩺 Doctor profiles repaired: ${created} created, ${normalized} specializations normalized`);
  }
}
