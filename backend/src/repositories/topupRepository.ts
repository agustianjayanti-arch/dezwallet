import { PoolClient } from 'pg';
import { pool } from '../config/database';
import { TopUp, TopUpStatus } from '../types/transaction';
import { getPagination, buildPaginationMeta } from '../utils/pagination';

export async function createTopUp(
    data: { userId: string; amount: number; proofUrl?: string },
    client?: PoolClient
): Promise<TopUp> {
    const db = client ?? pool;
    const result = await db.query<TopUp>(
        `INSERT INTO topups (user_id, amount, proof_url, status)
     VALUES ($1, $2, $3, 'pending') RETURNING *`,
        [data.userId, data.amount, data.proofUrl ?? null]
    );
    return result.rows[0];
}

export async function findTopUpById(id: string): Promise<TopUp | null> {
    const result = await pool.query<TopUp>(
        `SELECT * FROM topups WHERE id = $1 LIMIT 1`,
        [id]
    );
    return result.rows[0] ?? null;
}

export async function updateTopUpStatus(
    id: string,
    status: TopUpStatus,
    data: { reviewedBy?: string; rejectionReason?: string; transactionId?: string },
    client?: PoolClient
): Promise<TopUp> {
    const db = client ?? pool;
    const result = await db.query<TopUp>(
        `UPDATE topups
     SET status = $1, reviewed_by = $2, rejection_reason = $3, reviewed_at = NOW(),
         transaction_id = COALESCE($4, transaction_id)
     WHERE id = $5 RETURNING *`,
        [status, data.reviewedBy ?? null, data.rejectionReason ?? null, data.transactionId ?? null, id]
    );
    return result.rows[0];
}

export async function getTopUpHistory(userId: string, page: unknown, limit: unknown) {
    const pagination = getPagination(page, limit);

    const countResult = await pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM topups WHERE user_id = $1`,
        [userId]
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await pool.query<TopUp>(
        `SELECT * FROM topups WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [userId, pagination.limit, pagination.offset]
    );

    return {
        topups: result.rows,
        pagination: buildPaginationMeta(total, pagination.page, pagination.limit),
    };
}

export async function getAllPendingTopUps(page: unknown, limit: unknown) {
    const pagination = getPagination(page, limit);

    const countResult = await pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM topups WHERE status = 'pending'`
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await pool.query(
        `SELECT t.*, u.name as user_name, u.email as user_email
     FROM topups t JOIN users u ON t.user_id = u.id
     WHERE t.status = 'pending'
     ORDER BY t.created_at ASC LIMIT $1 OFFSET $2`,
        [pagination.limit, pagination.offset]
    );

    return {
        topups: result.rows,
        pagination: buildPaginationMeta(total, pagination.page, pagination.limit),
    };
}
