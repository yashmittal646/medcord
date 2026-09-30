import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/authorize.js';
import { validateRequest } from '../middleware/validate.js';
import { HealthTrackerController } from '../controllers/healthTracker.controller.js';
import { addReadingSchema, extractSchema, insightsSchema } from '../validators/healthTracker.validator.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// The patient's own lab trends. Every query is scoped to the patientId behind the JWT, so ids in the
// URL or body can never reach another patient's data.
router.use(authenticateToken, authorizeRoles('PATIENT'));

// AI calls cost money and time: cap them per patient
const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  keyGenerator: (req) => (req as AuthenticatedRequest).user?.userId ?? 'anonymous',
  validate: false,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many AI requests. Please wait a few minutes and try again.' },
});

router.get('/', HealthTrackerController.get);
router.get('/catalog', HealthTrackerController.catalog);
router.get('/reports', HealthTrackerController.reports);
router.post('/extract', aiLimiter, validateRequest(extractSchema), HealthTrackerController.extract);
router.post('/insights', aiLimiter, validateRequest(insightsSchema), HealthTrackerController.insights);
router.post('/readings', validateRequest(addReadingSchema), HealthTrackerController.addReading);
router.delete('/readings/:id', HealthTrackerController.deleteReading);

export default router;
