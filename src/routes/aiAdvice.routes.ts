import { Router } from 'express';
import { getAiAdvice } from '../controllers/aiAdvice.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// POST /api/ai/advice — requires authentication
router.post('/advice', authenticateToken, getAiAdvice);

export default router;
