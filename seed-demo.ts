/**
 * seed-demo.ts  —  AsyncHealth Demo Data Seeder
 * ------------------------------------------------
 * Creates:
 *   • 1 demo patient  (email: demo.patient@asynchealth.dev / password: Demo@1234)
 *   • 1 demo doctor   (email: demo.doctor@asynchealth.dev  / password: Demo@1234)
 *   • Full patient profile: DOB, gender, blood group, emergency contact,
 *     3 allergies, 3 chronic conditions, 3 current medications
 *   • 6 medical records (prescription, lab report x2, consultation, checkup, other)
 *   • 2 health paths (one ACTIVE, one COMPLETED) each with medications & progress notes
 *   • 1 approved access grant (doctor -> patient)
 *   • 8 realistic audit log entries
 *
 * Run:  npx tsx seed-demo.ts
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

import { User }           from './src/models/User.js';
import { PatientProfile } from './src/models/PatientProfile.js';
import { DoctorProfile }  from './src/models/DoctorProfile.js';
import { MedicalRecord }  from './src/models/MedicalRecord.js';
import { HealthPath }     from './src/models/HealthPath.js';
import { AccessGrant }    from './src/models/AccessGrant.js';
import { AuditLog }       from './src/models/AuditLog.js';

const MONGO_URI = process.env.MONGODB_URI!;

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function seed() {
  console.log('🌱  Connecting to MongoDB…');
  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected.\n');

  // ── 1. Clean up any pre-existing demo data ───────────────────────────────
  const existingPatient = await User.findOne({ email: 'demo.patient@asynchealth.dev' });
  const existingDoctor  = await User.findOne({ email: 'demo.doctor@asynchealth.dev' });

  if (existingPatient) {
    console.log('♻️   Removing existing demo patient data…');
    await PatientProfile.deleteOne({ user: existingPatient._id });
    await MedicalRecord.deleteMany({ patient: existingPatient._id });
    await HealthPath.deleteMany({ patient: existingPatient._id });
    await AccessGrant.deleteMany({ patientUser: existingPatient._id });
    await AuditLog.deleteMany({ targetPatient: existingPatient._id });
    await User.deleteOne({ _id: existingPatient._id });
  }
  if (existingDoctor) {
    console.log('♻️   Removing existing demo doctor data…');
    await AccessGrant.deleteMany({ doctorUser: existingDoctor._id });
    await HealthPath.deleteMany({ doctor: existingDoctor._id });
    await User.deleteOne({ _id: existingDoctor._id });
  }

  // ── 2. Create demo doctor ─────────────────────────────────────────────────
  console.log('👨‍⚕️  Creating demo doctor…');
  const doctorHash = await bcrypt.hash('Demo@1234', 12);
  const doctor = await User.create({
    name:         'Dr. Priya Sharma',
    email:        'demo.doctor@asynchealth.dev',
    phone:        '+91-98765-43210',
    passwordHash: doctorHash,
    role:         'DOCTOR',
    publicId:     'DOC-DEMO01',
    status:       'ACTIVE',
  });
  await DoctorProfile.deleteMany({ doctorId: doctor.publicId });
  await DoctorProfile.create({
    user:               doctor._id,
    doctorId:           doctor.publicId,
    specialization:     'General Medicine',
    licenseNumber:      'DEMO-LIC-0001',
    hospitalAffiliation:'Demo General Hospital',
    verificationStatus: 'VERIFIED',
  });
  console.log(`   DOC publicId : ${doctor.publicId}`);

  // ── 3. Create demo patient ────────────────────────────────────────────────
  console.log('🧑‍💼  Creating demo patient user…');
  const patientHash = await bcrypt.hash('Demo@1234', 12);
  const patient = await User.create({
    name:         'Arjun Mehta',
    email:        'demo.patient@asynchealth.dev',
    phone:        '+91-99887-76655',
    passwordHash: patientHash,
    role:         'PATIENT',
    publicId:     'PAT-DEMO01',
    status:       'ACTIVE',
  });
  console.log(`   PAT publicId : ${patient.publicId}`);

  // ── 4. Patient profile ────────────────────────────────────────────────────
  console.log('📋  Creating patient profile…');
  await PatientProfile.create({
    user:        patient._id,
    patientId:   'PAT-DEMO01',
    dateOfBirth: new Date('1992-07-14'),
    gender:      'MALE',
    bloodGroup:  'B+',
    emergencyContact: {
      name:         'Sunita Mehta',
      relationship: 'Mother',
      phone:        '+91-98001-12345',
    },
    allergies: [
      {
        substance: 'Penicillin',
        severity:  'SEVERE',
        notes:     'Causes hives and throat swelling within 20 minutes of exposure.',
        addedAt:   daysAgo(400),
      },
      {
        substance: 'Sulfonamides (Sulfa drugs)',
        severity:  'MODERATE',
        notes:     'Rash and fever. Confirmed by allergist on 2023-03-10.',
        addedAt:   daysAgo(300),
      },
      {
        substance: 'Peanuts',
        severity:  'LIFE_THREATENING',
        notes:     'Anaphylactic reaction. Carries EpiPen at all times.',
        addedAt:   daysAgo(1200),
      },
    ],
    chronicConditions: [
      {
        condition:     'Type 2 Diabetes Mellitus',
        status:        'MANAGED',
        notes:         'HbA1c target < 7.0%. Currently managed with Metformin and lifestyle changes.',
        diagnosedDate: new Date('2019-05-20'),
      },
      {
        condition:     'Essential Hypertension (Stage 1)',
        status:        'MANAGED',
        notes:         'BP target < 130/80 mmHg. On Amlodipine 5mg once daily.',
        diagnosedDate: new Date('2020-11-08'),
      },
      {
        condition:     'Chronic Lower Back Pain (L4-L5 disc herniation)',
        status:        'ACTIVE',
        notes:         'MRI confirmed L4-L5 bulge. Physiotherapy ongoing. Avoid heavy lifting.',
        diagnosedDate: new Date('2022-03-15'),
      },
    ],
    currentMedications: [
      {
        medicine:  'Metformin',
        dosage:    '500 mg',
        frequency: 'Twice daily with meals',
        startDate: new Date('2019-06-01'),
        status:    'ACTIVE',
      },
      {
        medicine:  'Amlodipine',
        dosage:    '5 mg',
        frequency: 'Once daily in the morning',
        startDate: new Date('2020-11-15'),
        status:    'ACTIVE',
      },
      {
        medicine:  'Pantoprazole',
        dosage:    '40 mg',
        frequency: 'Once daily before breakfast',
        startDate: daysAgo(60),
        status:    'ACTIVE',
      },
    ],
  });

  // ── 5. Medical records ────────────────────────────────────────────────────
  console.log('📁  Creating medical records…');
  await MedicalRecord.insertMany([
    {
      patient:      patient._id,
      patientId:    'PAT-DEMO01',
      uploadedBy:   patient._id,
      uploaderRole: 'PATIENT',
      recordType:   'CHECKUP',
      title:        'Annual Physical Examination — 2024',
      recordDate:   daysAgo(30),
      doctorName:   'Dr. Priya Sharma',
      facilityName: 'Apollo Clinic, Bangalore',
      description:  'Routine annual check-up. Weight 78 kg, Height 175 cm, BMI 25.5. Blood pressure 128/82 mmHg. Fasting glucose 118 mg/dL. ECG: normal sinus rhythm.',
      diagnosis:    'Stable type 2 diabetes. Mild hypertension. Dietary modifications recommended.',
      tags:         ['annual', 'checkup', 'diabetes', 'hypertension'],
    },
    {
      patient:      patient._id,
      patientId:    'PAT-DEMO01',
      uploadedBy:   patient._id,
      uploaderRole: 'PATIENT',
      recordType:   'LAB_REPORT',
      title:        'HbA1c & Lipid Panel — July 2024',
      recordDate:   daysAgo(45),
      doctorName:   'Dr. Priya Sharma',
      facilityName: 'Thyrocare Labs, Bangalore',
      description:  'HbA1c: 6.8% (target met). Total Cholesterol: 195 mg/dL. LDL: 118 mg/dL. HDL: 52 mg/dL. Triglycerides: 148 mg/dL. eGFR: 88 mL/min.',
      diagnosis:    'Glycemic control within target. Borderline LDL — lifestyle intervention before statin therapy.',
      tags:         ['hba1c', 'lipid', 'labs', 'diabetes'],
    },
    {
      patient:      patient._id,
      patientId:    'PAT-DEMO01',
      uploadedBy:   doctor._id,
      uploaderRole: 'DOCTOR',
      recordType:   'PRESCRIPTION',
      title:        'Prescription — Diabetes & BP Review',
      recordDate:   daysAgo(30),
      doctorName:   'Dr. Priya Sharma',
      facilityName: 'Apollo Clinic, Bangalore',
      description:  'Continue Metformin 500mg BD. Continue Amlodipine 5mg OD. Add Pantoprazole 40mg OD for GI protection. Recheck in 3 months.',
      tags:         ['prescription', 'diabetes', 'hypertension'],
    },
    {
      patient:      patient._id,
      patientId:    'PAT-DEMO01',
      uploadedBy:   patient._id,
      uploaderRole: 'PATIENT',
      recordType:   'LAB_REPORT',
      title:        'Lumbar Spine MRI Report',
      recordDate:   daysAgo(180),
      doctorName:   'Dr. Kewal Verma (Radiologist)',
      facilityName: 'Manipal Imaging Centre',
      description:  'MRI Lumbar Spine (without contrast). L4-L5: Posterior disc bulge with mild indentation on the thecal sac. No significant spinal canal stenosis. L5-S1: Mild degenerative changes.',
      diagnosis:    'L4-L5 disc herniation — conservative management recommended. Physiotherapy and core strengthening.',
      tags:         ['mri', 'spine', 'back-pain', 'radiology'],
    },
    {
      patient:      patient._id,
      patientId:    'PAT-DEMO01',
      uploadedBy:   doctor._id,
      uploaderRole: 'DOCTOR',
      recordType:   'CONSULTATION',
      title:        'Physiotherapy Referral & Consultation Notes',
      recordDate:   daysAgo(170),
      doctorName:   'Dr. Priya Sharma',
      facilityName: 'Apollo Clinic, Bangalore',
      description:  '6-month history of lower back pain radiating to left leg. MRI confirms L4-L5 disc herniation. Referred to physiotherapy — 12-session program. Prescribed Ibuprofen 400mg TDS x 5 days.',
      diagnosis:    'L4-L5 disc herniation with radiculopathy. Conservative management plan initiated.',
      tags:         ['consultation', 'back-pain', 'physiotherapy', 'referral'],
    },
    {
      patient:      patient._id,
      patientId:    'PAT-DEMO01',
      uploadedBy:   patient._id,
      uploaderRole: 'PATIENT',
      recordType:   'OTHER',
      title:        'Allergy Test Report — Immunology',
      recordDate:   daysAgo(365),
      doctorName:   'Dr. Ananya Kapoor (Allergist)',
      facilityName: 'Fortis Immunology Clinic',
      description:  'Skin prick test & IgE RAST panel. Positive: Penicillin (Class 4 — Severe), Sulfonamides (Class 2 — Moderate), Peanuts (Class 5 — Very High). Negative: Shellfish, Latex, NSAIDs.',
      diagnosis:    'Confirmed drug allergies to Penicillin and Sulfonamides. Confirmed peanut anaphylaxis. EpiPen prescribed.',
      tags:         ['allergy', 'immunology', 'penicillin', 'peanuts'],
    },
  ]);

  // ── 6. Health paths ───────────────────────────────────────────────────────
  console.log('🛤️   Creating health paths…');
  const hp1 = await HealthPath.create({
    patient:         patient._id,
    patientId:       'PAT-DEMO01',
    doctor:          doctor._id,
    doctorId:        'DOC-DEMO01',
    doctorName:      'Dr. Priya Sharma',
    condition:       'Type 2 Diabetes — 90-Day Management Plan',
    description:     'Structured 3-month treatment course to improve glycemic control, optimise HbA1c below 7%, and establish healthy lifestyle habits. Includes medication protocol, dietary goals, and weekly monitoring.',
    startDate:       daysAgo(60),
    expectedEndDate: daysAgo(-30),
    status:          'ACTIVE',
    medications: [
      {
        medicine:     'Metformin',
        dosage:       '500 mg',
        frequency:    'Twice daily with meals (morning and evening)',
        instructions: 'Take with food to reduce GI side effects. Do not crush or chew.',
        durationDays: 90,
      },
      {
        medicine:     'Pantoprazole',
        dosage:       '40 mg',
        frequency:    'Once daily, 30 minutes before breakfast',
        instructions: 'Gastroprotection while on long-term Metformin.',
        durationDays: 90,
      },
    ],
    progressNotes: [
      {
        note:       'Health path initiated. Patient counselled on dietary modifications. Baseline HbA1c: 6.8%. Target: <7.0% at 3-month review.',
        authorRole: 'DOCTOR',
        authorName: 'Dr. Priya Sharma',
        createdAt:  daysAgo(60),
      },
      {
        note:       'Started medications. Mild nausea after Metformin — taking with food helps. Home blood sugar averaging 140-155 mg/dL fasting.',
        authorRole: 'PATIENT',
        authorName: 'Arjun Mehta',
        createdAt:  daysAgo(45),
      },
      {
        note:       '4-week check-in: Fasting glucose improving — now averaging 122 mg/dL. Patient adherent. GI symptoms resolved. Continue current plan.',
        authorRole: 'DOCTOR',
        authorName: 'Dr. Priya Sharma',
        createdAt:  daysAgo(25),
      },
      {
        note:       'Feeling much better. Energy levels improved. Started walking 30 min daily. Glucose readings now consistently below 130 mg/dL mornings.',
        authorRole: 'PATIENT',
        authorName: 'Arjun Mehta',
        createdAt:  daysAgo(10),
      },
    ],
  });

  const hp2 = await HealthPath.create({
    patient:         patient._id,
    patientId:       'PAT-DEMO01',
    doctor:          doctor._id,
    doctorId:        'DOC-DEMO01',
    doctorName:      'Dr. Priya Sharma',
    condition:       'Lower Back Pain — Physiotherapy & Recovery Protocol',
    description:     'Post-MRI conservative management plan for L4-L5 disc herniation. 12-session physiotherapy programme combined with short-course anti-inflammatory therapy and core strengthening.',
    startDate:       daysAgo(170),
    expectedEndDate: daysAgo(80),
    actualEndDate:   daysAgo(85),
    status:          'COMPLETED',
    medications: [
      {
        medicine:     'Ibuprofen',
        dosage:       '400 mg',
        frequency:    'Three times daily after meals',
        instructions: 'For 5 days only during acute pain flare. Stop if gastric discomfort.',
        durationDays: 5,
      },
      {
        medicine:     'Thiocolchicoside',
        dosage:       '4 mg',
        frequency:    'Twice daily for 7 days',
        instructions: 'Muscle relaxant. May cause drowsiness — avoid driving.',
        durationDays: 7,
      },
    ],
    progressNotes: [
      {
        note:       'Programme initiated. 12 sessions over 6 weeks. Core stability exercises, McKenzie method for lumbar decompression, heat therapy.',
        authorRole: 'DOCTOR',
        authorName: 'Dr. Priya Sharma',
        createdAt:  daysAgo(170),
      },
      {
        note:       'Completed first 4 sessions. Back pain reducing from 7/10 to 5/10. Leg tingling less frequent. Exercises challenging but manageable.',
        authorRole: 'PATIENT',
        authorName: 'Arjun Mehta',
        createdAt:  daysAgo(140),
      },
      {
        note:       'Mid-programme review: Significant improvement. Pain 3/10. Radiculopathy resolved. Good form with core exercises. Continue remaining 6 sessions.',
        authorRole: 'DOCTOR',
        authorName: 'Dr. Priya Sharma',
        createdAt:  daysAgo(115),
      },
      {
        note:       'Completed all 12 sessions! Back pain now 1/10 most days. No more leg tingling. Continuing home exercise routine independently.',
        authorRole: 'PATIENT',
        authorName: 'Arjun Mehta',
        createdAt:  daysAgo(87),
      },
      {
        note:       'Discharge from programme. Full recovery achieved. Pain 0-1/10. Continue home exercises. Avoid lifting >15 kg permanently.',
        authorRole: 'DOCTOR',
        authorName: 'Dr. Priya Sharma',
        createdAt:  daysAgo(85),
      },
    ],
  });
  console.log(`   Health Path 1 (ACTIVE):    ${hp1._id}`);
  console.log(`   Health Path 2 (COMPLETED): ${hp2._id}`);

  // ── 7. Access grant ───────────────────────────────────────────────────────
  console.log('🔐  Creating approved access grant…');
  await AccessGrant.create({
    patientUser:          patient._id,
    patientId:            'PAT-DEMO01',
    doctorUser:           doctor._id,
    doctorId:             'DOC-DEMO01',
    doctorName:           'Dr. Priya Sharma',
    doctorSpecialization: 'Internal Medicine & Diabetology',
    doctorHospital:       'Apollo Clinic, Bangalore',
    reason:               'Ongoing management of Type 2 Diabetes and Hypertension. Need access to longitudinal records for continuity of care.',
    status:               'APPROVED',
    requestedAt:          daysAgo(200),
    respondedAt:          daysAgo(199),
    expiresAt:            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  });

  // ── 8. Audit log entries ──────────────────────────────────────────────────
  console.log('📝  Creating audit logs…');
  await AuditLog.insertMany([
    {
      actor:           { userId: patient._id, publicId: 'PAT-DEMO01', name: 'Arjun Mehta', role: 'PATIENT' },
      targetPatient:   patient._id,
      targetPatientId: 'PAT-DEMO01',
      action:          'LOGIN',
      details:         'Patient logged in successfully.',
      createdAt:       daysAgo(1),
    },
    {
      actor:           { userId: patient._id, publicId: 'PAT-DEMO01', name: 'Arjun Mehta', role: 'PATIENT' },
      targetPatient:   patient._id,
      targetPatientId: 'PAT-DEMO01',
      action:          'RECORD_UPLOAD',
      details:         'Uploaded: Annual Physical Examination — 2024',
      createdAt:       daysAgo(30),
    },
    {
      actor:           { userId: patient._id, publicId: 'PAT-DEMO01', name: 'Arjun Mehta', role: 'PATIENT' },
      targetPatient:   patient._id,
      targetPatientId: 'PAT-DEMO01',
      action:          'RECORD_UPLOAD',
      details:         'Uploaded: HbA1c & Lipid Panel — July 2024',
      createdAt:       daysAgo(45),
    },
    {
      actor:           { userId: doctor._id, publicId: 'DOC-DEMO01', name: 'Dr. Priya Sharma', role: 'DOCTOR' },
      targetPatient:   patient._id,
      targetPatientId: 'PAT-DEMO01',
      action:          'DOCTOR_LOOKUP',
      details:         'Dr. Priya Sharma looked up patient PAT-DEMO01.',
      createdAt:       daysAgo(200),
    },
    {
      actor:           { userId: doctor._id, publicId: 'DOC-DEMO01', name: 'Dr. Priya Sharma', role: 'DOCTOR' },
      targetPatient:   patient._id,
      targetPatientId: 'PAT-DEMO01',
      action:          'RECORD_VIEW',
      details:         'Dr. Priya Sharma viewed: Annual Physical Examination — 2024',
      createdAt:       daysAgo(30),
    },
    {
      actor:           { userId: doctor._id, publicId: 'DOC-DEMO01', name: 'Dr. Priya Sharma', role: 'DOCTOR' },
      targetPatient:   patient._id,
      targetPatientId: 'PAT-DEMO01',
      action:          'HEALTH_PATH_CREATED',
      details:         'Created Health Path: Type 2 Diabetes — 90-Day Management Plan',
      createdAt:       daysAgo(60),
    },
    {
      actor:           { userId: doctor._id, publicId: 'DOC-DEMO01', name: 'Dr. Priya Sharma', role: 'DOCTOR' },
      targetPatient:   patient._id,
      targetPatientId: 'PAT-DEMO01',
      action:          'HEALTH_PATH_CREATED',
      details:         'Created Health Path: Lower Back Pain — Physiotherapy & Recovery Protocol',
      createdAt:       daysAgo(170),
    },
    {
      actor:           { userId: doctor._id, publicId: 'DOC-DEMO01', name: 'Dr. Priya Sharma', role: 'DOCTOR' },
      targetPatient:   patient._id,
      targetPatientId: 'PAT-DEMO01',
      action:          'HEALTH_PATH_COMPLETED',
      details:         'Marked COMPLETED: Lower Back Pain — Physiotherapy & Recovery Protocol',
      createdAt:       daysAgo(85),
    },
  ]);

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log('\n✅  Demo data seeded successfully!\n');
  console.log('┌─────────────────────────────────────────────────────┐');
  console.log('│              DEMO CREDENTIALS                       │');
  console.log('├─────────────────────────────────────────────────────┤');
  console.log('│  PATIENT                                            │');
  console.log('│    Name    : Arjun Mehta                            │');
  console.log('│    ID      : PAT-DEMO01                             │');
  console.log('│    Email   : demo.patient@asynchealth.dev           │');
  console.log('│    Password: Demo@1234                              │');
  console.log('├─────────────────────────────────────────────────────┤');
  console.log('│  DOCTOR                                             │');
  console.log('│    Name    : Dr. Priya Sharma                       │');
  console.log('│    ID      : DOC-DEMO01                             │');
  console.log('│    Email   : demo.doctor@asynchealth.dev            │');
  console.log('│    Password: Demo@1234                              │');
  console.log('└─────────────────────────────────────────────────────┘\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
