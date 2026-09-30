import { z } from 'zod';

export const addReadingSchema = z
  .object({
    key: z.string().max(80).trim().optional(),
    name: z.string().max(120).trim().optional(),
    value: z.coerce.number().finite('Please enter a number').min(-1000000).max(1000000),
    unit: z.string().max(40).trim().optional(),
    takenAt: z.string().min(1, 'Date is required'),
  })
  .refine((d) => Boolean(d.key || d.name), { message: 'Please choose a test or enter its name', path: ['name'] });

export const extractSchema = z.object({
  recordId: z.string().optional(),
});

export const insightsSchema = z.object({
  langCode: z.enum(['en', 'hi', 'kn', 'ta', 'te']).default('en'),
  refresh: z.boolean().optional(),
});
