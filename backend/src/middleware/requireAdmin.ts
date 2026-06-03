import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

/**
 * Middleware otorisasi untuk endpoint admin.
 * Harus digunakan setelah middleware `authenticate`.
 */
export function requireAdmin(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    if (!req.user) {
        return next(AppError.unauthorized());
    }

    if (req.user.role !== 'admin') {
        return next(AppError.forbidden('Akses ditolak. Hanya admin yang dapat mengakses endpoint ini.', 'ADMIN_REQUIRED'));
    }

    next();
}
