import { Router } from 'express';
import { RecordController } from '../controllers/record.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../utils/fileUpload.js';
import { validateRequest } from '../middleware/validate.js';
import { createMedicalRecordSchema, updateClassificationSchema } from '../validators/record.validator.js';
import { authorizeRoles } from '../middleware/authorize.js';

const router = Router();

// Protect all record endpoints with JWT authentication
router.use(authenticateToken);

// Upload a new medical record (with optional multipart document attachment)
router.post(
  '/upload',
  upload.single('file'),
  validateRequest(createMedicalRecordSchema),
  RecordController.uploadRecord
);

// Get medical records for a patient (with filtering and pagination)
router.get('/', RecordController.getRecords);

// Get a single medical record details
router.get('/:id', RecordController.getRecordById);

// Securely view/download the attached medical file
router.get('/:id/download', RecordController.downloadRecordFile);

// Patient edits or confirms the tags that decide which specialists can see a record
router.patch(
  '/:id/classification',
  authorizeRoles('PATIENT'),
  validateRequest(updateClassificationSchema),
  RecordController.updateClassification
);
router.post('/:id/classification/confirm', authorizeRoles('PATIENT'), RecordController.confirmClassification);

// Delete a medical record
router.delete('/:id', RecordController.deleteRecord);

export default router;
