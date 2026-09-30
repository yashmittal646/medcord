/**
 * Verify (or reject) a doctor account after checking their medical license.
 *
 *   npm run doctor:verify -- DOC-AB12CD34            verify by Doctor ID
 *   npm run doctor:verify -- dr.rao@hospital.org     verify by email
 *   npm run doctor:verify -- DOC-AB12CD34 --reject   reject
 *   npm run doctor:verify -- --list                  list doctors awaiting verification
 *
 * Uses MONGODB_URI from .env, so point it at the production database to verify live accounts.
 */
import mongoose from 'mongoose';
import { ENV } from '../config/environment.js';
import { User } from '../models/User.js';
import { DoctorProfile } from '../models/DoctorProfile.js';

async function main() {
  const args = process.argv.slice(2);
  await mongoose.connect(ENV.MONGODB_URI);

  if (args.includes('--list') || args.length === 0) {
    const pending = await DoctorProfile.find({ verificationStatus: { $ne: 'VERIFIED' } }).populate('user', 'name email').lean();
    if (!pending.length) console.log('No doctors are awaiting verification.');
    for (const p of pending as any[]) {
      console.log(`${p.doctorId}  ${p.verificationStatus.padEnd(8)}  ${p.user?.name ?? '?'} <${p.user?.email ?? '?'}>  license=${p.licenseNumber}  ${p.specialization}`);
    }
    await mongoose.disconnect();
    return;
  }

  const target = args.find((a) => !a.startsWith('--'))!;
  const reject = args.includes('--reject');
  const user = target.includes('@')
    ? await User.findOne({ email: target.toLowerCase(), role: 'DOCTOR' })
    : await User.findOne({ publicId: target.toUpperCase(), role: 'DOCTOR' });
  if (!user) throw new Error(`No doctor found for "${target}"`);

  const profile = await DoctorProfile.findOneAndUpdate(
    { user: user._id },
    { verificationStatus: reject ? 'REJECTED' : 'VERIFIED' },
    { new: true }
  );
  if (!profile) throw new Error(`${user.publicId} has no doctor profile. Start the server once to create it, then retry.`);
  console.log(`${user.publicId} (${user.name}) is now ${profile.verificationStatus}.`);
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(e.message ?? e);
  await mongoose.disconnect();
  process.exit(1);
});
