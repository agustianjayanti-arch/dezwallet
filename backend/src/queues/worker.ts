import { env } from '../config/env';

export async function startWorkers(): Promise<void> {
    try {
        const { Worker } = await import('bullmq');
        const { notificationProcessor } = await import('./processors/notificationProcessor');
        const { auditProcessor } = await import('./processors/auditProcessor');
        const { moneyRequestExpiryProcessor } = await import('./processors/moneyRequestExpiryProcessor');

        const connection = {
            host: new URL(env.REDIS_URL).hostname,
            port: parseInt(new URL(env.REDIS_URL).port || '6379', 10),
        };

        const notificationWorker = new Worker('notification', notificationProcessor, { connection });
        const auditWorker = new Worker('audit', auditProcessor, { connection });
        const expiryWorker = new Worker('money-request-expiry', moneyRequestExpiryProcessor, { connection });

        notificationWorker.on('error', (err) => console.warn('[NotificationWorker]', err.message));
        auditWorker.on('error', (err) => console.warn('[AuditWorker]', err.message));
        expiryWorker.on('error', (err) => console.warn('[ExpiryWorker]', err.message));

        console.log('[Workers] BullMQ workers started.');
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('[Workers] Redis tidak tersedia, workers dinonaktifkan:', msg);
    }
}
