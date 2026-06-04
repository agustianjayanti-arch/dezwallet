import helmet from 'helmet';
import cors from 'cors';
import { Application, Request, Response, NextFunction } from 'express';

/**
 * Configure security headers dan CORS
 * Requirement: API security best practices
 */
export function configureSecurityMiddleware(app: Application): void {
    // ── Helmet: Security headers ──────────────────────────────────────────────
    // Membantu melindungi aplikasi dari beberapa vulnerability terkenal
    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", 'data:', 'https:'],
                },
            },
            hsts: {
                maxAge: 31536000, // 1 tahun
                includeSubDomains: true,
                preload: true,
            },
            frameguard: { action: 'deny' },
            xssFilter: true,
            noSniff: true,
            referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        })
    );

    // ── CORS Configuration ────────────────────────────────────────────────────
    // Mengatur siapa saja yang bisa access API
    const allowedOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
        : ['http://localhost:5173', 'http://localhost:3000'];

    const corsOptions: cors.CorsOptions = {
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Page-Size'],
        maxAge: 86400, // 24 jam
    };

    app.use(cors(corsOptions));

    // ── Additional security headers ───────────────────────────────────────────
    app.use((_req: Request, res: Response, next: NextFunction) => {
        // Mencegah MIME sniffing
        res.setHeader('X-Content-Type-Options', 'nosniff');

        // Mencegah clickjacking
        res.setHeader('X-Frame-Options', 'DENY');

        // Mencegah XSS
        res.setHeader('X-XSS-Protection', '1; mode=block');

        // Strict transport security
        if (process.env.NODE_ENV === 'production') {
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        next();
    });
}
