import { auditQueue } from '../queues/queues';
import * as auditRepo from '../repositories/auditRepository';

/**
 * Audit_Service — mencatat aktivitas penting secara asinkron.
 * Requirement 10.5: log() hanya enqueue job, tidak memblokir operasi utama.
 */
export async function log(
    actorId: string | null,
    actorType: string,
    action: string,
    entityId: string | null,
    entityType: string | null,
    ipAddress: string | null,
    metadata: Record<string, unknown> = {}
): Promise<void> {
    try {
        await auditQueue.add('audit-log', {
            actorId,
            actorType,
            action,
            entityId,
            entityType,
            ipAddress,
            metadata,
        });
    } catch (err) {
        // Jika queue tidak tersedia, log warning dan lanjutkan (Requirement 10.5)
        const message = err instanceof Error ? err.message : String(err);
        console.warn('[AuditService] Failed to enqueue audit log:', message);
    }
}

/**
 * Mengambil audit logs dengan filter dan pagination.
 * Requirement 10.4.
 */
export async function getAuditLogs(filters: {
    action?: string;
    actorId?: string;
    startDate?: string;
    endDate?: string;
    page: unknown;
    limit: unknown;
}) {
    return auditRepo.getAuditLogs(filters);
}
