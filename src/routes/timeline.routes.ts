import { Router } from 'express';
import { TimelineController } from '../controllers/timeline.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/authorize.js';

const router = Router();

// Protect all timeline routes to authenticated PATIENT role
router.use(authenticateToken);
router.use(authorizeRoles('PATIENT'));

// Get full chronological medical timeline
router.get('/', TimelineController.getMyTimeline);

// Get high-level patient medical summary snapshot
router.get('/summary', TimelineController.getMySummary);

export default router;
