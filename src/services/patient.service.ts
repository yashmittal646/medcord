import { Types } from 'mongoose';
import { PatientProfile } from '../models/PatientProfile.js';
import { AppError } from '../utils/appError.js';
import {
  UpdateBasicProfileInput,
  AllergyInput,
  ChronicConditionInput,
  MedicationInput,
} from '../validators/patient.validator.js';

export class PatientService {
  static async getProfileByUserId(userId: string) {
    const profile = await PatientProfile.findOne({ user: new Types.ObjectId(userId) }).populate(
      'user',
      'name email phone publicId'
    );
    if (!profile) {
      throw new AppError('Patient profile not found', 404);
    }
    return profile;
  }

  static async getProfileByPatientId(patientId: string) {
    const profile = await PatientProfile.findOne({ patientId }).populate(
      'user',
      'name email phone publicId'
    );
    if (!profile) {
      throw new AppError(`Patient with ID '${patientId}' not found`, 404);
    }
    return profile;
  }

  static async updateBasicProfile(userId: string, data: UpdateBasicProfileInput) {
    const profile = await PatientProfile.findOne({ user: new Types.ObjectId(userId) });
    if (!profile) {
      throw new AppError('Patient profile not found', 404);
    }

    if (data.dateOfBirth) profile.dateOfBirth = new Date(data.dateOfBirth);
    if (data.gender) profile.gender = data.gender;
    if (data.bloodGroup) profile.bloodGroup = data.bloodGroup;
    if (data.emergencyContact) profile.emergencyContact = data.emergencyContact;

    await profile.save();
    return profile;
  }

  // --- Allergies CRUD ---
  static async addAllergy(userId: string, data: AllergyInput) {
    const profile = await PatientProfile.findOne({ user: new Types.ObjectId(userId) });
    if (!profile) throw new AppError('Patient profile not found', 404);

    profile.allergies.push({
      substance: data.substance,
      severity: data.severity,
      notes: data.notes,
      addedAt: new Date(),
    });

    await profile.save();
    return profile.allergies;
  }

  static async updateAllergy(userId: string, allergyId: string, data: Partial<AllergyInput>) {
    const profile = await PatientProfile.findOne({ user: new Types.ObjectId(userId) });
    if (!profile) throw new AppError('Patient profile not found', 404);

    const allergy = profile.allergies.find((a) => a._id?.toString() === allergyId);
    if (!allergy) throw new AppError('Allergy entry not found', 404);

    if (data.substance) allergy.substance = data.substance;
    if (data.severity) allergy.severity = data.severity;
    if (data.notes !== undefined) allergy.notes = data.notes;

    await profile.save();
    return profile.allergies;
  }

  static async deleteAllergy(userId: string, allergyId: string) {
    const profile = await PatientProfile.findOne({ user: new Types.ObjectId(userId) });
    if (!profile) throw new AppError('Patient profile not found', 404);

    profile.allergies = profile.allergies.filter((a) => a._id?.toString() !== allergyId);
    await profile.save();
    return profile.allergies;
  }

  // --- Chronic Conditions CRUD ---
  static async addChronicCondition(userId: string, data: ChronicConditionInput) {
    const profile = await PatientProfile.findOne({ user: new Types.ObjectId(userId) });
    if (!profile) throw new AppError('Patient profile not found', 404);

    profile.chronicConditions.push({
      condition: data.condition,
      status: data.status,
      notes: data.notes,
      diagnosedDate: data.diagnosedDate ? new Date(data.diagnosedDate) : undefined,
    });

    await profile.save();
    return profile.chronicConditions;
  }

  static async updateChronicCondition(
    userId: string,
    conditionId: string,
    data: Partial<ChronicConditionInput>
  ) {
    const profile = await PatientProfile.findOne({ user: new Types.ObjectId(userId) });
    if (!profile) throw new AppError('Patient profile not found', 404);

    const item = profile.chronicConditions.find((c) => c._id?.toString() === conditionId);
    if (!item) throw new AppError('Chronic condition entry not found', 404);

    if (data.condition) item.condition = data.condition;
    if (data.status) item.status = data.status;
    if (data.notes !== undefined) item.notes = data.notes;
    if (data.diagnosedDate) item.diagnosedDate = new Date(data.diagnosedDate);

    await profile.save();
    return profile.chronicConditions;
  }

  static async deleteChronicCondition(userId: string, conditionId: string) {
    const profile = await PatientProfile.findOne({ user: new Types.ObjectId(userId) });
    if (!profile) throw new AppError('Patient profile not found', 404);

    profile.chronicConditions = profile.chronicConditions.filter(
      (c) => c._id?.toString() !== conditionId
    );
    await profile.save();
    return profile.chronicConditions;
  }

  // --- Current Medications CRUD ---
  static async addMedication(userId: string, data: MedicationInput) {
    const profile = await PatientProfile.findOne({ user: new Types.ObjectId(userId) });
    if (!profile) throw new AppError('Patient profile not found', 404);

    profile.currentMedications.push({
      medicine: data.medicine,
      dosage: data.dosage,
      frequency: data.frequency,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      status: data.status,
    });

    await profile.save();
    return profile.currentMedications;
  }

  static async updateMedication(
    userId: string,
    medicationId: string,
    data: Partial<MedicationInput>
  ) {
    const profile = await PatientProfile.findOne({ user: new Types.ObjectId(userId) });
    if (!profile) throw new AppError('Patient profile not found', 404);

    const item = profile.currentMedications.find((m) => m._id?.toString() === medicationId);
    if (!item) throw new AppError('Medication entry not found', 404);

    if (data.medicine) item.medicine = data.medicine;
    if (data.dosage) item.dosage = data.dosage;
    if (data.frequency) item.frequency = data.frequency;
    if (data.startDate) item.startDate = new Date(data.startDate);
    if (data.endDate) item.endDate = new Date(data.endDate);
    if (data.status) item.status = data.status;

    await profile.save();
    return profile.currentMedications;
  }

  static async deleteMedication(userId: string, medicationId: string) {
    const profile = await PatientProfile.findOne({ user: new Types.ObjectId(userId) });
    if (!profile) throw new AppError('Patient profile not found', 404);

    profile.currentMedications = profile.currentMedications.filter(
      (m) => m._id?.toString() !== medicationId
    );
    await profile.save();
    return profile.currentMedications;
  }
}
