import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { JwtPayload } from '../middleware/authenticate';

/**
 * Membuat JWT token dengan payload dan expiry yang diberikan.
 */
export function signToken(
    payload: Omit<JwtPayload, 'iat' | 'exp'>,
    expiresIn: string = env.JWT_EXPIRES_IN
): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

/**
 * Memverifikasi dan mendekode JWT token.
 * Melempar error jika token tidak valid atau sudah expired.
 */
export function verifyToken(token: string): JwtPayload {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
