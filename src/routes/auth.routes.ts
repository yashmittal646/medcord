import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validateRequest } from '../middleware/validate.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  registerPatientSchema,
  registerDoctorSchema,
  loginSchema,
} from '../validators/auth.validator.js';

const router = Router();

// Public Auth Endpoints
router.post('/patient/register', validateRequest(registerPatientSchema), AuthController.registerPatient);
router.post('/doctor/register', validateRequest(registerDoctorSchema), AuthController.registerDoctor);
router.post('/login', validateRequest(loginSchema), AuthController.login);

// Protected Auth Endpoints
router.get('/me', authenticateToken, AuthController.getMe);

export default router;
