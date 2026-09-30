import { Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';
import { DoctorProfile } from '../models/DoctorProfile.js';
import { isDoctorVerified } from '../services/doctorVerification.service.js';
import { AuthenticatedRequest, UserRole } from '../types/index.js';

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Unauthorized: User context missing.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden: Role '${req.user.role}' is not authorized to access this resource.`,
          403
        )
      );
    }

    next();
  };
};

// Doctors must be VERIFIED (checked against the DB on every call, so a rejection takes effect immediately)
export const requireVerifiedDoctor = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user?.role !== 'DOCTOR') {
      return next(new AppError('Forbidden: Doctor account required.', 403));
    }
    const profile = await DoctorProfile.findOne({ user: req.user.userId }).select('verificationStatus').lean();
    if (!profile || !isDoctorVerified(profile.verificationStatus)) {
      return next(new AppError('Forbidden: Your doctor account is pending verification.', 403));
    }
    next();
  } catch (error) {
    next(error);
  }
};
