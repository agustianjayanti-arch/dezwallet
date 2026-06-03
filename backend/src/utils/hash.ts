import bcrypt from 'bcrypt';
import { env } from '../config/env';

/**
 * Hash plaintext menggunakan bcrypt.
 * Digunakan untuk password dan Transaction PIN.
 * Requirement 1.3, 13.4: kredensial selalu disimpan dalam bentuk hash.
 */
export async function hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, env.BCRYPT_ROUNDS);
}

/**
 * Membandingkan plaintext dengan hash bcrypt.
 * @returns true jika cocok, false jika tidak
 */
export async function compareHash(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
}
