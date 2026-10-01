import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles, requireVerifiedDoctor } from '../middleware/authorize.js';
import { validateRequest } from '../middleware/validate.js';
import { requireAdmin } from '../utils/admin.js';
import { MedicineController } from '../controllers/medicine.controller.js';
import { createMedicineSchema, favouriteSchema } from '../validators/medicine.validator.js';

/** /api/medicines: catalogue search and doctor additions (verified doctors only) */
export const medicineRoutes = Router();
medicineRoutes.use(authenticateToken, authorizeRoles('DOCTOR'), requireVerifiedDoctor);
medicineRoutes.get('/search', MedicineController.search);
medicineRoutes.get('/recent', MedicineController.recent);
medicineRoutes.post('/', validateRequest(createMedicineSchema), MedicineController.create);
medicineRoutes.post('/:id/favourite', validateRequest(favouriteSchema), MedicineController.favourite);

/** /api/lab-tests: investigations catalogue */
export const labTestRoutes = Router();
labTestRoutes.use(authenticateToken, authorizeRoles('DOCTOR'), requireVerifiedDoctor);
labTestRoutes.get('/search', MedicineController.labTests);

/** /api/admin/medicines: review doctor-added medicines (ADMIN_EMAILS accounts only) */
export const adminMedicineRoutes = Router();
adminMedicineRoutes.use(authenticateToken, requireAdmin);
adminMedicineRoutes.get('/pending', MedicineController.pending);
adminMedicineRoutes.post('/:id/promote', MedicineController.promote);
adminMedicineRoutes.post('/:id/reject', MedicineController.reject);
