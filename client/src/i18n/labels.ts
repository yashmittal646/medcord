import { tx } from './index.js';

/**
 * Translatable labels that are produced dynamically (enumLabel(), prettify(), server-sent notification and audit
 * templates) and therefore never appear as t('...') literals. Listing them here with tx() lets
 * `npm run i18n:check` verify every language has a translation for each one.
 */
export const DYNAMIC_LABELS = [
  // Statuses (allergies, conditions, medications, health paths, access requests, connections, consents)
  tx('Active'), tx('Managed'), tx('Resolved'), tx('Paused'), tx('Completed'), tx('Archived'),
  tx('Pending'), tx('Approved'), tx('Rejected'), tx('Revoked'), tx('Expired'), tx('Cancelled'), tx('None'),
  // Allergy severity
  tx('Mild'), tx('Moderate'), tx('Severe'), tx('Life Threatening'),
  // Gender
  tx('Male'), tx('Female'), tx('Other'), tx('Prefer Not To Say'),
  // Roles
  tx('Patient'), tx('Doctor'), tx('System'),
  // Audit event names (enumLabel of the action)
  tx('Login'), tx('Profile Update'), tx('Record Upload'), tx('Record View'), tx('Record Download'), tx('Record Delete'),
  tx('Doctor Lookup'), tx('Health Path Created'), tx('Health Path Updated'), tx('Health Path Completed'),
  tx('Health Path Archived'), tx('Emergency Access'), tx('Record Access Denied'), tx('Access Request Created'),
  tx('Access Request Approved'), tx('Access Request Rejected'), tx('Access Request Cancelled'), tx('Consent Granted'),
  tx('Consent Revoked'), tx('Consent Expired'), tx('Classification Changed'), tx('Connection Requested'),
  tx('Connection Approved'), tx('Connection Rejected'), tx('Connection Revoked'), tx('Doctor Patient View'),
  tx('Doctor View'), tx('Consultation Recorded'), tx('Consultation Added'),
  // Record types and categories
  tx('Prescription'), tx('Lab Report'), tx('Consultation'), tx('Checkup'),
  tx('Blood Work'), tx('Imaging'), tx('Biopsy Pathology'), tx('Cardiac Test'), tx('Discharge Summary'), tx('Vaccination'),
  tx('prescription'), tx('lab report'), tx('consultation'), tx('checkup'), tx('other'),
  // Specializations
  tx('General Practice'), tx('Cardiology'), tx('Endocrinology'), tx('Nephrology'), tx('Neurology'), tx('Dermatology'),
  tx('Oncology'), tx('Orthopedics'), tx('Psychiatry'), tx('Gastroenterology'), tx('Pulmonology'), tx('Radiology'),
  tx('Obstetrics & Gynecology'), tx('ENT'), tx('Ophthalmology'), tx('Urology'), tx('Pediatrics'), tx('Emergency Medicine'),
  // Conditions in the tagging taxonomy (labels come from the server's taxonomy endpoint)
  tx('Arrhythmia'), tx('ECG'), tx('Hypertension'), tx('Heart failure'), tx('Coronary artery disease'),
  tx('High cholesterol / lipid profile'), tx('Type 1 diabetes'), tx('Type 2 diabetes'), tx('Thyroid disorder'), tx('Obesity'),
  tx('Kidney function'), tx('Chronic kidney disease'), tx('Kidney stones'), tx('Epilepsy'), tx('Migraine'), tx('Stroke'),
  tx('Skin biopsy'), tx('Eczema / dermatitis'), tx('Psoriasis'), tx('Cancer'), tx('Tumor biopsy'), tx('Fracture'),
  tx('Arthritis'), tx('Back / spine pain'), tx('Asthma'), tx('COPD'), tx('Tuberculosis'), tx('GERD / acid reflux'),
  tx('Liver disease'), tx('Irritable bowel syndrome'), tx('Vision disorder'), tx('Hearing loss'), tx('Sinusitis'),
  tx('Anemia'), tx('Infection'), tx('Allergy'), tx('Depression'), tx('Anxiety'), tx('Substance use'), tx('HIV'),
  tx('Sexually transmitted infection'), tx('Pregnancy / prenatal'), tx('Reproductive health'), tx('Genetic testing'),
  // Prescriptions: dosage forms (enumLabel of the medicine form)
  tx('Tablet'), tx('Capsule'), tx('Syrup'), tx('Suspension'), tx('Solution'), tx('Drops'), tx('Injection'), tx('Cream'),
  tx('Ointment'), tx('Gel'), tx('Lotion'), tx('Shampoo'), tx('Spray'), tx('Inhaler'), tx('Powder'), tx('Sachet'),
  tx('Soap'), tx('Serum'), tx('Kit'),
  // Lab test catalogue categories
  tx('Blood'), tx('Heart'), tx('Liver'), tx('Kidney'), tx('Iron'), tx('Minerals'), tx('Urine'), tx('Stool'),
  tx('Imaging'), tx('Women'), tx('Men'), tx('Hormones'), tx('Skin'),
  // Prescription audit events and notifications
  tx('Prescription Issued'), tx('Prescription Amended'), tx('Prescription updated'),
  tx('{doctor} updated your prescription.'), tx('{doctor} sent you a prescription.'),
];
