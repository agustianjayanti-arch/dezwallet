import { pool } from '../config/database';
import { Notification } from '../types/notification';
import { getPagination, buildPaginationMeta } from '../utils/pagination';

export async function insertNotification(data: {
    userId: string;
    type: string;
    payload: Record<string, unknown>;
}): Promise<void> {
    await pool.query(
        `INSERT INTO notifications (user_id, type, payload) VALUES ($1, $2, $3)`,
        [data.userId, data.type, JSON.stringify(data.payload)]
    );
}

export async function getNotifications(userId: string, page: unknown, limit: unknown) {
    const pagination = getPagination(page, limit);

    const countResult = await pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1`,
        [userId]
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await pool.query<Notification>(
        `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [userId, pagination.limit, pagination.offset]
    );

    return {
        notifications: result.rows,
        pagination: buildPaginationMeta(total, pagination.page, pagination.limit),
    };
}

export async function markAsRead(userId: string, notificationId: string): Promise<void> {
    await pool.query(
        `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
        [notificationId, userId]
    );
}

export async function markAllAsRead(userId: string): Promise<void> {
    await pool.query(
        `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`,
        [userId]
    );
}
