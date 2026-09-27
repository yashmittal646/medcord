import { Router } from 'express';
import { AccessGrantController } from '../controllers/accessGrant.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/authorize.js';

const router = Router();

// Doctor endpoints
router.post(
  '/request',
  authenticateToken,
  authorizeRoles('DOCTOR'),
  AccessGrantController.requestAccess
);

router.get(
  '/status/:patientId',
  authenticateToken,
  authorizeRoles('DOCTOR'),
  AccessGrantController.getAccessStatus
);

// Patient endpoints
router.get(
  '/my-grants',
  authenticateToken,
  authorizeRoles('PATIENT'),
  AccessGrantController.getPatientGrants
);

router.post(
  '/:id/respond',
  authenticateToken,
  authorizeRoles('PATIENT'),
  AccessGrantController.respondToGrant
);

export const accessGrantRoutes = router;
