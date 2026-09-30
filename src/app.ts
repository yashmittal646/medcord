import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { ENV } from './config/environment.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { AppError } from './utils/appError.js';
import healthRouter from './routes/health.routes.js';
import authRouter from './routes/auth.routes.js';
import patientRouter from './routes/patient.routes.js';
import recordRouter from './routes/record.routes.js';
import timelineRouter from './routes/timeline.routes.js';
import doctorRouter from './routes/doctor.routes.js';
import healthPathRouter from './routes/healthPath.routes.js';
import emergencyRouter from './routes/emergency.routes.js';
import auditRouter from './routes/audit.routes.js';
import { accessGrantRoutes } from './routes/accessGrant.routes.js';
import aiAdviceRouter from './routes/aiAdvice.routes.js';
import metaRouter from './routes/meta.routes.js';
import notificationRouter from './routes/notification.routes.js';
import { accessRequestRoutes, consentRoutes } from './routes/consent.routes.js';
import medicationRouter from './routes/medication.routes.js';
import healthTrackerRouter from './routes/healthTracker.routes.js';

export const createApp = (): Application => {
  const app = express();

  // Ensure uploads directory exists
  if (!fs.existsSync(ENV.UPLOAD_DIR)) {
    fs.mkdirSync(ENV.UPLOAD_DIR, { recursive: true });
  }

  // Security Middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }));

  // CORS Middleware
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || ENV.NODE_ENV === 'development' || ENV.CORS_ORIGIN.includes('*') || ENV.CORS_ORIGIN.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Blocked by CORS policy'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Request Parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging
  app.use(requestLogger);

  // Routes
  app.use('/api', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/patient', patientRouter);
  app.use('/api/records', recordRouter);
  app.use('/api/timeline', timelineRouter);
  app.use('/api/doctor', doctorRouter);
  app.use('/api/health-paths', healthPathRouter);
  app.use('/api/emergency', emergencyRouter);
  app.use('/api/audit', auditRouter);
  app.use('/api/access-grants', accessGrantRoutes);
  app.use('/api/ai', aiAdviceRouter);
  app.use('/api/meta', metaRouter);
  app.use('/api/access-requests', accessRequestRoutes);
  app.use('/api/consent', consentRoutes);
  app.use('/api/notifications', notificationRouter);
  app.use('/api/medications', medicationRouter);
  app.use('/api/health-tracker', healthTrackerRouter);

  // ─── Serve client build in production ───────────────────────
  const clientDistPath = path.resolve(process.cwd(), 'client', 'dist');
  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));

    // Client-side routing: serve index.html for any non-API route
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  } else {
    // Catch-all 404 for undefined routes (dev mode, no client build)
    app.all('*', (req: Request, _res: Response, next: NextFunction) => {
      next(new AppError(`Cannot find ${req.method} ${req.originalUrl} on this server`, 404));
    });
  }

  // Central Error Handler
  app.use(errorHandler);

  return app;
};
