import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/authorize.js';
import { validateRequest } from '../middleware/validate.js';
import { MedicationController } from '../controllers/medication.controller.js';
import {
  createMedicationSchema,
  updateMedicationSchema,
  logDoseSchema,
} from '../validators/medication.validator.js';

const router = Router();

// All medication routes require authentication
router.use(authenticateToken);

// ── Patient-only routes (read + write) ───────────────────────────────────────
// SECURITY: authorizeRoles('PATIENT') ensures only patients can modify their own data.
// Inside the service, ownership is verified a second time via JWT userId → patientId lookup,
// so changing the :id param never grants cross-patient access (IDOR protection).

router.use(authorizeRoles('PATIENT'));

// List medications (filterable by status)
router.get('/', MedicationController.list);

// Today's dose schedule (all active meds)
router.get('/schedule/today', MedicationController.getTodaySchedule);

// Get a single medication
router.get('/:id', MedicationController.getById);

// Dose logs for a medication
router.get('/:id/dose-logs', MedicationController.getDoseLogs);

// Adherence statistics for a medication
router.get('/:id/adherence', MedicationController.getAdherence);

// Create a new medication
router.post(
  '/',
  validateRequest(createMedicationSchema),
  MedicationController.create
);

// Update a medication
router.patch(
  '/:id',
  validateRequest(updateMedicationSchema),
  MedicationController.update
);

// Soft-discontinue (sets status = DISCONTINUED, preserves history)
router.delete('/:id', MedicationController.discontinue);

// Log a dose event
router.post(
  '/:id/dose',
  validateRequest(logDoseSchema),
  MedicationController.logDose
);

export default router;
