import { Job } from 'bullmq';
import { pool } from '../../config/database';

export interface AuditJobData {
    actorId: string | null;
    actorType: string;
    action: string;
    entityId: string | null;
    entityType: string | null;
    ipAddress: string | null;
    metadata: Record<string, unknown>;
}

/**
 * Processor untuk audit queue.
 * Requirement 10.5: audit log dicatat secara asinkron.
 */
export async function auditProcessor(job: Job<AuditJobData>): Promise<void> {
    const { actorId, actorType, action, entityId, entityType, ipAddress, metadata } = job.data;

    await pool.query(
        `INSERT INTO audit_logs (actor_id, actor_type, action, entity_id, entity_type, ip_address, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [actorId, actorType, action, entityId, entityType, ipAddress, JSON.stringify(metadata)]
    );
}
