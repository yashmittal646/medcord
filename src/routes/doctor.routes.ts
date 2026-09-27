import { Router } from 'express';
import { DoctorController } from '../controllers/doctor.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/authorize.js';
import { upload } from '../utils/fileUpload.js';

const router = Router();

// Protect all doctor routes to authenticated DOCTOR role
router.use(authenticateToken);
router.use(authorizeRoles('DOCTOR'));

// Search & Lookup Patient by PAT-XXXXXXXX
router.get('/patient/:patientId', DoctorController.lookupPatient);

// Get Patient's Timeline
router.get('/patient/:patientId/timeline', DoctorController.getPatientTimeline);

// Get Patient's Medical Records
router.get('/patient/:patientId/records', DoctorController.getPatientRecords);

// Create a Consultation Record for a Patient
router.post(
  '/patient/:patientId/consultation',
  upload.single('file'),
  DoctorController.recordConsultation
);

export default router;
