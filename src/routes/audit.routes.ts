import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/authorize.js';

const router = Router();

// Protect all audit endpoints
router.use(authenticateToken);

// Patient's own Activity Feed (Who accessed my records?)
router.get('/my-activity', authorizeRoles('PATIENT'), AuditController.getMyActivity);

// Doctor's recent activity log
router.get('/doctor-activity', authorizeRoles('DOCTOR'), AuditController.getDoctorActivity);

// General query logs
router.get('/logs', authorizeRoles('SYSTEM'), AuditController.queryLogs);

export default router;
