import { Request, Response, NextFunction } from 'express';

/**
 * Custom application error dengan HTTP status code dan error code.
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly details: Record<string, unknown>;

    constructor(
        message: string,
        statusCode: number,
        code: string,
        details: Record<string, unknown> = {}
    ) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message: string, details?: Record<string, unknown>): AppError {
        return new AppError(message, 400, 'BAD_REQUEST', details);
    }

    static unauthorized(message = 'Autentikasi diperlukan.'): AppError {
        return new AppError(message, 401, 'UNAUTHORIZED');
    }

    static forbidden(message: string, code = 'FORBIDDEN'): AppError {
        return new AppError(message, 403, code);
    }

    static notFound(message: string): AppError {
        return new AppError(message, 404, 'NOT_FOUND');
    }

    static conflict(message: string, code = 'CONFLICT'): AppError {
        return new AppError(message, 409, code);
    }

    static gone(message: string): AppError {
        return new AppError(message, 410, 'GONE');
    }

    static unprocessable(message: string, code = 'UNPROCESSABLE_ENTITY'): AppError {
        return new AppError(message, 422, code);
    }

    static internal(message = 'Terjadi kesalahan internal.'): AppError {
        return new AppError(message, 500, 'INTERNAL_SERVER_ERROR');
    }
}

/**
 * Global error handler middleware.
 * Harus didaftarkan sebagai middleware terakhir di Express.
 * Requirement 15.4: HTTP 500 errors dicatat dengan stack trace.
 */
export function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction
): void {
    if (err instanceof AppError) {
        // Error yang sudah diketahui — kembalikan respons terstruktur
        res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
                details: err.details,
            },
        });
        return;
    }

    // Error tidak terduga — log dengan stack trace (Requirement 15.4)
    console.error('[ErrorHandler] Unexpected error:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
    });

    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Terjadi kesalahan internal. Silakan coba lagi.',
            details: {},
        },
    });
}
