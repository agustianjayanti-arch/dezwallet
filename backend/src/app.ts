import express, { Application, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import { configureSecurityMiddleware } from './middleware/securityMiddleware';

import authRoutes from './routes/authRoutes';
import walletRoutes from './routes/walletRoutes';
import transferRoutes from './routes/transferRoutes';
import topupRoutes from './routes/topupRoutes';
import qrRoutes from './routes/qrRoutes';
import requestRoutes from './routes/requestRoutes';
import notificationRoutes from './routes/notificationRoutes';
import ledgerRoutes from './routes/ledgerRoutes';
import adminRoutes from './routes/adminRoutes';

/**
 * Swagger / OpenAPI 3.0 configuration.
 * Requirement 15.1–15.3.
 */
const swaggerOptions: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'DezPay E-Wallet API',
            version: '1.0.0',
            description: 'REST API untuk aplikasi e-wallet DezPay',
        },
        servers: [{ url: '/api', description: 'API Server' }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export function createApp(): Application {
    const app: Application = express();

    // ── Security middleware (CORS, Helmet, etc) ───────────────────────────────
    configureSecurityMiddleware(app);

    // ── Body parsers ──────────────────────────────────────────────────────────
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // ── Request logger ────────────────────────────────────────────────────────
    app.use(requestLogger);

    // ── Rate limiter ──────────────────────────────────────────────────────────
    app.use('/api', generalLimiter);

    // ── Swagger UI (Requirement 15.1) ─────────────────────────────────────────
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

    // ── Health check ──────────────────────────────────────────────────────────
    app.get('/health', (_req: Request, res: Response) => {
        res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
    });

    // ── API Routes ────────────────────────────────────────────────────────────
    app.use('/api/auth', authRoutes);
    app.use('/api/wallet', walletRoutes);
    app.use('/api/transfers', transferRoutes);
    app.use('/api/topups', topupRoutes);
    app.use('/api/qr', qrRoutes);
    app.use('/api/requests', requestRoutes);
    app.use('/api/notifications', notificationRoutes);
    app.use('/api/ledger', ledgerRoutes);
    app.use('/api/admin', adminRoutes);

    // ── 404 handler ───────────────────────────────────────────────────────────
    app.use((_req: Request, res: Response) => {
        res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Endpoint tidak ditemukan.', details: {} },
        });
    });

    // ── Global error handler ──────────────────────────────────────────────────
    app.use(errorHandler);

    return app;
}
