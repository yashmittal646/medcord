import crypto from 'crypto';

// Use unambiguous character set (no 0/O, no 1/I/l)
const CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function generatePublicId(prefix: 'PAT' | 'DOC', length = 8): string {
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARSET[bytes[i] % CHARSET.length];
  }
  return `${prefix}-${result}`;
}

export function generatePatientId(): string {
  return generatePublicId('PAT', 8);
}

export function generateDoctorId(): string {
  return generatePublicId('DOC', 8);
}
