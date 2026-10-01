import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles, requireVerifiedDoctor } from '../middleware/authorize.js';
import { validateRequest } from '../middleware/validate.js';
import { PrescriptionController as C } from '../controllers/prescription.controller.js';
import {
  createDraftSchema,
  draftBodySchema,
  duplicateSchema,
  labTestStatusSchema,
  letterheadSchema,
  unlockLetterheadSchema,
} from '../validators/prescription.validator.js';

/**
 * /api/prescriptions
 * Writing is for verified doctors only; every query is scoped to the caller (doctors see their own
 * prescriptions and letterhead, never another doctor's). Patients read theirs through /api/patient-prescriptions.
 */
export const prescriptionRoutes = Router();
prescriptionRoutes.use(authenticateToken);

// Reading a single prescription works for its doctor and (once issued) its patient; the service checks which
prescriptionRoutes.get('/:id([a-fA-F0-9]{24})', authorizeRoles('DOCTOR', 'PATIENT'), C.get);

const doctor = [authorizeRoles('DOCTOR'), requireVerifiedDoctor];
prescriptionRoutes.get('/template', ...doctor, C.getTemplate);
prescriptionRoutes.put('/template', ...doctor, validateRequest(letterheadSchema), C.saveTemplate);
prescriptionRoutes.post('/template/lock', ...doctor, C.lockTemplate);
prescriptionRoutes.post('/template/unlock', ...doctor, validateRequest(unlockLetterheadSchema), C.unlockTemplate);

prescriptionRoutes.get('/patients', ...doctor, C.patients);
prescriptionRoutes.get('/', ...doctor, C.list);
prescriptionRoutes.post('/', ...doctor, validateRequest(createDraftSchema), C.create);
prescriptionRoutes.patch('/:id', ...doctor, validateRequest(draftBodySchema), C.update);
prescriptionRoutes.delete('/:id', ...doctor, C.remove);
prescriptionRoutes.post('/:id/issue', ...doctor, C.issue);
prescriptionRoutes.post('/:id/amend', ...doctor, C.amend);
prescriptionRoutes.post('/:id/duplicate', ...doctor, validateRequest(duplicateSchema), C.duplicate);

/** /api/patient-prescriptions: the signed-in patient's own prescriptions and tests */
export const patientPrescriptionRoutes = Router();
patientPrescriptionRoutes.use(authenticateToken, authorizeRoles('PATIENT'));
patientPrescriptionRoutes.get('/', C.patientList);
patientPrescriptionRoutes.get('/tests-to-do', C.testsToDo);
patientPrescriptionRoutes.patch('/:id/tests/:testId', validateRequest(labTestStatusSchema), C.setTestStatus);
