import { rateLimit } from 'express-rate-limit';

/**
 * Rate limiter umum untuk semua endpoint API.
 * 100 request per menit per IP.
 */
export const generalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 menit
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Terlalu banyak permintaan. Silakan coba lagi dalam beberapa saat.',
            details: {},
        },
    },
});

/**
 * Rate limiter ketat untuk endpoint autentikasi.
 * 10 request per menit per IP untuk mencegah brute force.
 */
export const authLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 menit
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 1 menit.',
            details: {},
        },
    },
});
