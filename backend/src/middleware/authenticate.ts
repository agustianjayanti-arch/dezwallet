import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { isRedisConnected, redisClient } from '../config/redis';
import { AppError } from './errorHandler';

export interface JwtPayload {
    userId: string;
    sessionId: string;
    role: 'user' | 'admin';
    iat?: number;
    exp?: number;
}

// Extend Express Request to carry authenticated user info
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

/**
 * Middleware autentikasi JWT.
 * Memvalidasi token dan mengecek apakah sesi masih aktif di Redis.
 * Requirement 2.3: akses diblokir segera setelah sesi dicabut.
 */
export async function authenticate(
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw AppError.unauthorized('Token autentikasi tidak ditemukan.');
        }

        const token = authHeader.slice(7);

        let payload: JwtPayload;
        try {
            payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
        } catch {
            throw AppError.unauthorized('Token tidak valid atau sudah kedaluwarsa.');
        }

        // Cek apakah sesi masih aktif di Redis (revocation check)
        if (isRedisConnected()) {
            const sessionKey = `session:${payload.userId}:${payload.sessionId}`;
            const sessionExists = await redisClient.exists(sessionKey);
            if (sessionExists === 0) {
                throw AppError.unauthorized('Sesi sudah tidak aktif. Silakan login kembali.');
            }
        }
        // Jika Redis tidak tersedia, izinkan akses berdasarkan JWT saja (graceful degradation)

        req.user = payload;
        next();
    } catch (err) {
        next(err);
    }
}
