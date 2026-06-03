import { env } from '../config/env';

const connection = {
    host: new URL(env.REDIS_URL).hostname,
    port: parseInt(new URL(env.REDIS_URL).port || '6379', 10),
    // Jangan throw saat koneksi gagal
    enableOfflineQueue: false,
    lazyConnect: true,
    maxRetriesPerRequest: 0,
};

/**
 * Lazy-load queue — hanya dibuat saat Redis tersedia.
 * Jika Redis tidak ada, return null agar caller bisa skip.
 */
async function createQueue(name: string) {
    try {
        const { Queue } = await import('bullmq');
        return new Queue(name, {
            connection,
            defaultJobOptions: {
                attempts: 1,
                removeOnComplete: true,
                removeOnFail: true,
            },
        });
    } catch {
        return null;
    }
}

let _notificationQueue: Awaited<ReturnType<typeof createQueue>> = null;
let _auditQueue: Awaited<ReturnType<typeof createQueue>> = null;
let _moneyRequestExpiryQueue: Awaited<ReturnType<typeof createQueue>> = null;

export async function getNotificationQueue() {
    if (!_notificationQueue) _notificationQueue = await createQueue('notification');
    return _notificationQueue;
}

export async function getAuditQueue() {
    if (!_auditQueue) _auditQueue = await createQueue('audit');
    return _auditQueue;
}

export async function getMoneyRequestExpiryQueue() {
    if (!_moneyRequestExpiryQueue) _moneyRequestExpiryQueue = await createQueue('money-request-expiry');
    return _moneyRequestExpiryQueue;
}

// Stub exports untuk backward compatibility
export const notificationQueue = { add: async (..._args: unknown[]) => { const q = await getNotificationQueue(); return q?.add(...(_args as Parameters<NonNullable<typeof q>['add']>)); } };
export const auditQueue = { add: async (..._args: unknown[]) => { const q = await getAuditQueue(); return q?.add(...(_args as Parameters<NonNullable<typeof q>['add']>)); } };
export const moneyRequestExpiryQueue = { add: async (..._args: unknown[]) => { const q = await getMoneyRequestExpiryQueue(); return q?.add(...(_args as Parameters<NonNullable<typeof q>['add']>)); }, getJob: async (_id: string) => null };
