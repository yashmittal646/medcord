import { Router } from 'express';
import { HealthPathController } from '../controllers/healthPath.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/authorize.js';
import { validateRequest } from '../middleware/validate.js';
import {
  createHealthPathSchema,
  updateHealthPathStatusSchema,
  addProgressNoteSchema,
} from '../validators/healthPath.validator.js';

const router = Router();

// Protect all Health Path endpoints with JWT authentication
router.use(authenticateToken);

// Doctor creates Health Path
router.post(
  '/',
  authorizeRoles('DOCTOR'),
  validateRequest(createHealthPathSchema),
  HealthPathController.createHealthPath
);

// Get Health Paths (Patient gets own, Doctor gets target patient's)
router.get('/', HealthPathController.getHealthPaths);

// Get specific Health Path by ID
router.get('/:id', HealthPathController.getHealthPathById);

// Update Health Path Status (Complete / Archive)
router.patch(
  '/:id/status',
  validateRequest(updateHealthPathStatusSchema),
  HealthPathController.updateStatus
);

// Add Progress Note (Doctor or Patient)
router.post(
  '/:id/notes',
  validateRequest(addProgressNoteSchema),
  HealthPathController.addProgressNote
);

export default router;
