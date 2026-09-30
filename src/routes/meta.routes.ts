import { Router, Request, Response } from 'express';
import { getPublicTaxonomy } from '../config/taxonomy.js';

const router = Router();

// Static, non-PHI reference data used by the upload form and doctor sign-up
router.get('/taxonomy', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, data: getPublicTaxonomy() });
});

export default router;
