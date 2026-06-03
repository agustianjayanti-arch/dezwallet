import { notificationQueue } from '../queues/queues';
import * as notificationRepo from '../repositories/notificationRepository';

/**
 * Notification_Service — notifikasi berbasis queue dengan fallback langsung ke DB.
 * Jika Redis/BullMQ tidak tersedia, langsung insert ke database.
 */
export async function createNotification(
    userId: string,
    type: string,
    payload: Record<string, unknown>
): Promise<void> {
    try {
        // Coba via queue dulu
        await notificationQueue.add('create-notification', { userId, type, payload });
    } catch {
        // Queue tidak tersedia (Redis mati) — langsung insert ke DB
        try {
            await notificationRepo.insertNotification({ userId, type, payload });
        } catch (dbErr) {
            const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
            console.warn('[NotificationService] Fallback DB insert juga gagal:', msg);
        }
    }
}

export async function getNotifications(userId: string, page: unknown, limit: unknown) {
    return notificationRepo.getNotifications(userId, page, limit);
}

export async function markAsRead(userId: string, notificationId: string): Promise<void> {
    await notificationRepo.markAsRead(userId, notificationId);
}

export async function markAllAsRead(userId: string): Promise<void> {
    await notificationRepo.markAllAsRead(userId);
}
