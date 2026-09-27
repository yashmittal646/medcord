import { Router } from 'express';
import { PatientController } from '../controllers/patient.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/authorize.js';
import { validateRequest } from '../middleware/validate.js';
import {
  updateBasicProfileSchema,
  allergySchema,
  chronicConditionSchema,
  medicationSchema,
} from '../validators/patient.validator.js';

const router = Router();

// Protect all patient routes to authenticated PATIENT role
router.use(authenticateToken);
router.use(authorizeRoles('PATIENT'));

// Basic Demographic Profile
router.get('/profile', PatientController.getMyProfile);
router.patch('/profile', validateRequest(updateBasicProfileSchema), PatientController.updateBasicProfile);

// Allergies
router.post('/allergies', validateRequest(allergySchema), PatientController.addAllergy);
router.put('/allergies/:id', validateRequest(allergySchema.partial()), PatientController.updateAllergy);
router.delete('/allergies/:id', PatientController.deleteAllergy);

// Chronic Conditions
router.post('/conditions', validateRequest(chronicConditionSchema), PatientController.addChronicCondition);
router.put('/conditions/:id', validateRequest(chronicConditionSchema.partial()), PatientController.updateChronicCondition);
router.delete('/conditions/:id', PatientController.deleteChronicCondition);

// Current Medications
router.post('/medications', validateRequest(medicationSchema), PatientController.addMedication);
router.put('/medications/:id', validateRequest(medicationSchema.partial()), PatientController.updateMedication);
router.delete('/medications/:id', PatientController.deleteMedication);

export default router;
