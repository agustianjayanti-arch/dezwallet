import { PoolClient } from 'pg';
import { pool } from '../config/database';
import { MoneyRequest, MoneyRequestStatus } from '../types/transaction';
import { getPagination, buildPaginationMeta } from '../utils/pagination';

export async function createMoneyRequest(
    data: { requesterId: string; targetId: string; amount: number; notes?: string; expiresAt: Date }
): Promise<MoneyRequest> {
    const result = await pool.query<MoneyRequest>(
        `INSERT INTO money_requests (requester_id, target_id, amount, notes, status, expires_at)
     VALUES ($1, $2, $3, $4, 'pending', $5) RETURNING *`,
        [data.requesterId, data.targetId, data.amount, data.notes ?? null, data.expiresAt]
    );
    return result.rows[0];
}

export async function findMoneyRequestById(id: string): Promise<MoneyRequest | null> {
    const result = await pool.query<MoneyRequest>(
        `SELECT * FROM money_requests WHERE id = $1 LIMIT 1`,
        [id]
    );
    return result.rows[0] ?? null;
}

export async function updateMoneyRequestStatus(
    id: string,
    status: MoneyRequestStatus,
    transactionId?: string,
    client?: PoolClient
): Promise<MoneyRequest> {
    const db = client ?? pool;
    const result = await db.query<MoneyRequest>(
        `UPDATE money_requests
     SET status = $1, transaction_id = COALESCE($2, transaction_id), updated_at = NOW()
     WHERE id = $3 RETURNING *`,
        [status, transactionId ?? null, id]
    );
    return result.rows[0];
}

export async function getMoneyRequests(
    userId: string,
    type: 'sent' | 'received' | 'all',
    page: unknown,
    limit: unknown
) {
    const pagination = getPagination(page, limit);

    let whereClause = '';
    const params: unknown[] = [userId];

    if (type === 'sent') whereClause = 'WHERE mr.requester_id = $1';
    else if (type === 'received') whereClause = 'WHERE mr.target_id = $1';
    else whereClause = 'WHERE mr.requester_id = $1 OR mr.target_id = $1';

    const countResult = await pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM money_requests mr ${whereClause}`,
        params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    params.push(pagination.limit, pagination.offset);
    const result = await pool.query(
        `SELECT mr.*, u_req.name as requester_name, u_tgt.name as target_name
     FROM money_requests mr
     JOIN users u_req ON mr.requester_id = u_req.id
     JOIN users u_tgt ON mr.target_id = u_tgt.id
     ${whereClause}
     ORDER BY mr.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
    );

    return {
        requests: result.rows,
        pagination: buildPaginationMeta(total, pagination.page, pagination.limit),
    };
}
