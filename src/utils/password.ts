import bcrypt from 'bcryptjs';

/**
 * bcrypt work factor. 10 is the OWASP minimum and about 4x faster than 12; on a small shared CPU
 * (Render's free plan) 12 made every sign-in wait roughly two seconds on the hash alone.
 */
export const BCRYPT_COST = 10;

export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_COST);

/** Hashes made with a higher (slower) cost are upgraded the next time their owner signs in */
export const needsRehash = (hash: string) => {
  try {
    return bcrypt.getRounds(hash) !== BCRYPT_COST;
  } catch {
    return false;
  }
};
