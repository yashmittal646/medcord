import { Response, NextFunction } from 'express';
import { AppError } from './appError.js';
import { AuthenticatedRequest } from '../types/index.js';

/**
 * Admins are the accounts listed in the ADMIN_EMAILS environment variable (comma-separated). There is no
 * admin role in the user model: access is granted and revoked by editing that variable on the server.
 */
export const adminEmails = () =>
  new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );

export const isAdminEmail = (email?: string | null) => Boolean(email && adminEmails().has(email.toLowerCase()));

export const requireAdmin = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  if (!req.user) return next(new AppError('Unauthorized: User context missing.', 401));
  if (!isAdminEmail(req.user.email)) return next(new AppError('Only administrators can do this.', 403));
  next();
};
