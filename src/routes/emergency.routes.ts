import { Router } from 'express';
import { EmergencyController } from '../controllers/emergency.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/authorize.js';

const router = Router();

// Protect emergency route: Doctor only
router.use(authenticateToken);
router.use(authorizeRoles('DOCTOR'));

// Instant Emergency Snapshot
router.get('/:patientId', EmergencyController.getEmergencySnapshot);
router.post('/:patientId', EmergencyController.getEmergencySnapshot);

export default router;
