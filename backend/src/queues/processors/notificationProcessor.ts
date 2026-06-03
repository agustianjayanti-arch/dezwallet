import { Job } from 'bullmq';
import { pool } from '../../config/database';

export interface NotificationJobData {
    userId: string;
    type: string;
    payload: Record<string, unknown>;
}

/**
 * Processor untuk notification queue.
 * Requirement 8.7: jika gagal, hapus dari queue tanpa retry.
 */
export async function notificationProcessor(job: Job<NotificationJobData>): Promise<void> {
    const { userId, type, payload } = job.data;

    try {
        await pool.query(
            `INSERT INTO notifications (user_id, type, payload) VALUES ($1, $2, $3)`,
            [userId, type, JSON.stringify(payload)]
        );
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[NotificationProcessor] Failed to create notification for user ${userId}:`, message);
        // Tidak throw — job akan dihapus dari queue (no retry per Requirement 8.7)
    }
}
