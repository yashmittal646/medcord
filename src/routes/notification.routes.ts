import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { NotificationController } from '../controllers/notification.controller.js';

const router = Router();
router.use(authenticateToken);

router.get('/', NotificationController.list);
router.get('/stream', NotificationController.stream);
router.post('/read-all', NotificationController.markAllRead);
router.post('/:id/read', NotificationController.markRead);

export default router;
