import { pool } from '../config/database';
import { AuditLog } from '../types/audit';
import { getPagination, buildPaginationMeta } from '../utils/pagination';

export async function insertAuditLog(data: {
    actorId: string | null;
    actorType: string;
    action: string;
    entityId: string | null;
    entityType: string | null;
    ipAddress: string | null;
    metadata: Record<string, unknown>;
}): Promise<void> {
    // INSERT only — audit_logs adalah append-only (Requirement 10.3)
    await pool.query(
        `INSERT INTO audit_logs (actor_id, actor_type, action, entity_id, entity_type, ip_address, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [data.actorId, data.actorType, data.action, data.entityId, data.entityType, data.ipAddress, JSON.stringify(data.metadata)]
    );
}

export async function getAuditLogs(filters: {
    action?: string;
    actorId?: string;
    startDate?: string;
    endDate?: string;
    page: unknown;
    limit: unknown;
}) {
    const pagination = getPagination(filters.page, filters.limit);
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (filters.action) {
        params.push(filters.action);
        conditions.push(`action = $${params.length}`);
    }
    if (filters.actorId) {
        params.push(filters.actorId);
        conditions.push(`actor_id = $${params.length}`);
    }
    if (filters.startDate) {
        params.push(filters.startDate);
        conditions.push(`created_at >= $${params.length}`);
    }
    if (filters.endDate) {
        params.push(filters.endDate);
        conditions.push(`created_at <= $${params.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM audit_logs ${where}`,
        params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    params.push(pagination.limit, pagination.offset);
    const result = await pool.query<AuditLog>(
        `SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
    );

    return {
        logs: result.rows,
        pagination: buildPaginationMeta(total, pagination.page, pagination.limit),
    };
}
