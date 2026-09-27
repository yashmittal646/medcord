import { Response, NextFunction } from 'express';
import { PatientService } from '../services/patient.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export class PatientController {
  static async getMyProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const profile = await PatientService.getProfileByUserId(req.user!.userId);
      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }

  static async updateBasicProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const profile = await PatientService.updateBasicProfile(req.user!.userId, req.body);
      res.status(200).json({
        success: true,
        message: 'Patient profile updated successfully',
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  // --- Allergies ---
  static async addAllergy(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const allergies = await PatientService.addAllergy(req.user!.userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Allergy recorded successfully',
        data: allergies,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateAllergy(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const allergyId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const allergies = await PatientService.updateAllergy(
        req.user!.userId,
        allergyId,
        req.body
      );
      res.status(200).json({
        success: true,
        message: 'Allergy updated successfully',
        data: allergies,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAllergy(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const allergyId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const allergies = await PatientService.deleteAllergy(req.user!.userId, allergyId);
      res.status(200).json({
        success: true,
        message: 'Allergy removed successfully',
        data: allergies,
      });
    } catch (error) {
      next(error);
    }
  }

  // --- Chronic Conditions ---
  static async addChronicCondition(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const conditions = await PatientService.addChronicCondition(req.user!.userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Chronic condition recorded successfully',
        data: conditions,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateChronicCondition(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const conditionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const conditions = await PatientService.updateChronicCondition(
        req.user!.userId,
        conditionId,
        req.body
      );
      res.status(200).json({
        success: true,
        message: 'Chronic condition updated successfully',
        data: conditions,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteChronicCondition(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const conditionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const conditions = await PatientService.deleteChronicCondition(
        req.user!.userId,
        conditionId
      );
      res.status(200).json({
        success: true,
        message: 'Chronic condition removed successfully',
        data: conditions,
      });
    } catch (error) {
      next(error);
    }
  }

  // --- Current Medications ---
  static async addMedication(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const medications = await PatientService.addMedication(req.user!.userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Medication added successfully',
        data: medications,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateMedication(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const medicationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const medications = await PatientService.updateMedication(
        req.user!.userId,
        medicationId,
        req.body
      );
      res.status(200).json({
        success: true,
        message: 'Medication updated successfully',
        data: medications,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteMedication(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const medicationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const medications = await PatientService.deleteMedication(req.user!.userId, medicationId);
      res.status(200).json({
        success: true,
        message: 'Medication removed successfully',
        data: medications,
      });
    } catch (error) {
      next(error);
    }
  }
}
