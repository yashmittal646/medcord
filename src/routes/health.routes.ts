import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { aiProviderStatus } from '../controllers/aiAdvice.controller.js';
import { ENV } from '../config/environment.js';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStatusMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.status(200).json({
    success: true,
    message: 'Async Health Medical Platform API is running smoothly',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatusMap[dbStatus] || 'unknown',
      connected: dbStatus === 1,
    },
    // Which features are configured (booleans only; no secrets)
    config: {
      ai: aiProviderStatus(),
      autoVerifyDoctors: ENV.AUTO_VERIFY_DOCTORS,
    },
    uptime: process.uptime(),
  });
});

export default router;
