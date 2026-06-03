import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware structured JSON request logger.
 * Mencatat setiap request masuk dengan requestId unik untuk tracing.
 */
export function requestLogger(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const requestId = uuidv4();
    const startTime = Date.now();

    // Attach requestId ke request untuk digunakan di handler lain
    (req as Request & { requestId: string }).requestId = requestId;

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const log = {
            timestamp: new Date().toISOString(),
            level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
            requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            durationMs: duration,
            userId: req.user?.userId ?? null,
            ip: req.ip,
            userAgent: req.get('user-agent') ?? null,
        };

        console.log(JSON.stringify(log));
    });

    next();
}
