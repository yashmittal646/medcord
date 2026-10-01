import { Types } from 'mongoose';
import { LabTest, LAB_TEST_CATALOG } from '../models/LabTest.js';
import { IJwtPayload } from '../types/index.js';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

export class LabTestService {
  /** Insert any catalogue tests that are missing; safe to run on every start */
  static async ensureSeeded() {
    await LabTest.bulkWrite(
      LAB_TEST_CATALOG.map(([name, category]) => ({
        updateOne: {
          filter: { nameLower: norm(name), createdByDoctor: null },
          update: { $setOnInsert: { name, nameLower: norm(name), category } },
          upsert: true,
        },
      }))
    );
  }

  /** Catalogue + this doctor's custom tests; an empty query lists the catalogue */
  static async search(caller: IJwtPayload, rawQuery: string) {
    const q = norm(rawQuery ?? '').slice(0, 60);
    const vis = { $or: [{ createdByDoctor: null }, { createdByDoctor: new Types.ObjectId(caller.userId) }] };
    const filter = q ? { $and: [vis, { nameLower: new RegExp(escapeRegex(q)) }] } : vis;
    const rows = await LabTest.find(filter).limit(q ? 40 : 100).lean();
    return rows
      .sort((a, b) => Number(!a.nameLower.startsWith(q)) - Number(!b.nameLower.startsWith(q)) || a.nameLower.localeCompare(b.nameLower))
      .slice(0, q ? 15 : 100)
      .map((t) => ({ id: String(t._id), name: t.name, category: t.category, custom: Boolean(t.createdByDoctor) }));
  }

  /** A test the doctor typed that is not in the catalogue; reused next time they search */
  static async ensureCustom(caller: IJwtPayload, name: string) {
    const clean = name.replace(/\s+/g, ' ').trim();
    const nameLower = norm(clean);
    const existing = await LabTest.findOne({
      nameLower,
      $or: [{ createdByDoctor: null }, { createdByDoctor: new Types.ObjectId(caller.userId) }],
    }).lean();
    if (existing) return existing;
    return (
      await LabTest.create({ name: clean, nameLower, category: 'Custom', createdByDoctor: new Types.ObjectId(caller.userId) })
    ).toObject();
  }
}
