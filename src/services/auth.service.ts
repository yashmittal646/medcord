import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { PatientProfile } from '../models/PatientProfile.js';
import { DoctorProfile } from '../models/DoctorProfile.js';
import { generatePatientId, generateDoctorId } from '../utils/idGenerator.js';
import { AppError } from '../utils/appError.js';
import { ENV } from '../config/environment.js';
import {
  RegisterPatientInput,
  RegisterDoctorInput,
  LoginInput,
} from '../validators/auth.validator.js';
import { IJwtPayload } from '../types/index.js';
import { isDoctorVerified } from './doctorVerification.service.js';

const doctorVerified = (profile: any) => (profile ? isDoctorVerified(profile.verificationStatus) : false);

export class AuthService {
  private static generateToken(payload: IJwtPayload): string {
    return jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: ENV.JWT_EXPIRES_IN as any,
    });
  }

  static async registerPatient(data: RegisterPatientInput) {
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      throw new AppError('An account with this email address already exists.', 409);
    }

    // Generate unique Patient ID
    let patientId = generatePatientId();
    let collisionCheck = await User.findOne({ publicId: patientId });
    while (collisionCheck) {
      patientId = generatePatientId();
      collisionCheck = await User.findOne({ publicId: patientId });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      passwordHash,
      role: 'PATIENT',
      publicId: patientId,
      status: 'ACTIVE',
    });

    const patientProfile = await PatientProfile.create({
      user: user._id,
      patientId: patientId,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      gender: data.gender,
      bloodGroup: data.bloodGroup || 'UNKNOWN',
      emergencyContact: data.emergencyContact,
      allergies: [],
      chronicConditions: [],
      currentMedications: [],
    });

    const token = this.generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: 'PATIENT',
      publicId: patientId,
    });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        publicId: user.publicId,
      },
      profile: patientProfile,
      token,
    };
  }

  static async registerDoctor(data: RegisterDoctorInput) {
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      throw new AppError('An account with this email address already exists.', 409);
    }

    // Generate unique Doctor ID
    let doctorId = generateDoctorId();
    let collisionCheck = await User.findOne({ publicId: doctorId });
    while (collisionCheck) {
      doctorId = generateDoctorId();
      collisionCheck = await User.findOne({ publicId: doctorId });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      passwordHash,
      role: 'DOCTOR',
      publicId: doctorId,
      status: 'ACTIVE',
    });

    const doctorProfile = await DoctorProfile.create({
      user: user._id,
      doctorId: doctorId,
      specialization: data.specialization,
      licenseNumber: data.licenseNumber,
      hospitalAffiliation: data.hospitalAffiliation,
      verificationStatus: ENV.AUTO_VERIFY_DOCTORS ? 'VERIFIED' : 'PENDING',
    });

    const token = this.generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: 'DOCTOR',
      publicId: doctorId,
    });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        publicId: user.publicId,
        verified: doctorVerified(doctorProfile),
      },
      profile: doctorProfile,
      token,
    };
  }

  static async login(data: LoginInput) {
    const user = await User.findOne({ email: data.email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    const isMatch = await user.comparePassword(data.password);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError('Your account has been suspended or deactivated. Contact support.', 403);
    }

    let profile: any = null;
    if (user.role === 'PATIENT') {
      profile = await PatientProfile.findOne({ user: user._id });
    } else if (user.role === 'DOCTOR') {
      profile = await DoctorProfile.findOne({ user: user._id });
    }

    const token = this.generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      publicId: user.publicId,
    });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        publicId: user.publicId,
        ...(user.role === 'DOCTOR' && { verified: doctorVerified(profile) }),
      },
      profile,
      token,
    };
  }

  static async getCurrentUser(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    let profile: any = null;
    if (user.role === 'PATIENT') {
      profile = await PatientProfile.findOne({ user: user._id });
    } else if (user.role === 'DOCTOR') {
      profile = await DoctorProfile.findOne({ user: user._id });
    }

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        publicId: user.publicId,
        status: user.status,
        ...(user.role === 'DOCTOR' && { verified: doctorVerified(profile) }),
      },
      profile,
    };
  }
}
