import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export class AuthController {
  static async registerPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.registerPatient(req.body);
      res.status(201).json({
        success: true,
        message: `Patient registered successfully with ID: ${result.user.publicId}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async registerDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.registerDoctor(req.body);
      res.status(201).json({
        success: true,
        message: `Doctor registered successfully with ID: ${result.user.publicId}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body);
      res.status(200).json({
        success: true,
        message: `Welcome back, ${result.user.name}!`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.getCurrentUser(req.user!.userId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
