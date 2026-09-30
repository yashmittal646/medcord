import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles, requireVerifiedDoctor } from '../middleware/authorize.js';
import { validateRequest } from '../middleware/validate.js';
import { ConsentController } from '../controllers/consent.controller.js';
import {
  createAccessRequestSchema,
  respondAccessRequestSchema,
  revokeConsentSchema,
} from '../validators/accessRequest.validator.js';

export const accessRequestRoutes = Router();
accessRequestRoutes.use(authenticateToken);

accessRequestRoutes.post(
  '/create',
  authorizeRoles('DOCTOR'),
  requireVerifiedDoctor,
  validateRequest(createAccessRequestSchema),
  ConsentController.createRequest
);
// Patients see requests addressed to them, doctors see the ones they made
accessRequestRoutes.get('/', authorizeRoles('PATIENT', 'DOCTOR'), ConsentController.listRequests);
accessRequestRoutes.patch(
  '/:id/respond',
  authorizeRoles('PATIENT'),
  validateRequest(respondAccessRequestSchema),
  ConsentController.respond
);
accessRequestRoutes.delete('/:id', authorizeRoles('DOCTOR'), ConsentController.cancelRequest);

export const consentRoutes = Router();
consentRoutes.use(authenticateToken);

consentRoutes.get('/', authorizeRoles('PATIENT'), ConsentController.listConsents);
consentRoutes.get('/mine', authorizeRoles('DOCTOR'), ConsentController.listMine);
consentRoutes.delete(
  '/:grantId/revoke',
  authorizeRoles('PATIENT'),
  validateRequest(revokeConsentSchema),
  ConsentController.revoke
);
