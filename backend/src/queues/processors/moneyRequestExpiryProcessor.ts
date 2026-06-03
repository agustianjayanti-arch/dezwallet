import { Job } from 'bullmq';
import { pool } from '../../config/database';

export interface MoneyRequestExpiryJobData {
    requestId: string;
}

/**
 * Processor untuk money request expiry queue.
 * Requirement 7.6: Money_Request expired otomatis setelah 72 jam.
 */
export async function moneyRequestExpiryProcessor(job: Job<MoneyRequestExpiryJobData>): Promise<void> {
    const { requestId } = job.data;

    await pool.query(
        `UPDATE money_requests
     SET status = 'expired', updated_at = NOW()
     WHERE id = $1 AND status = 'pending'`,
        [requestId]
    );

    console.log(`[MoneyRequestExpiryProcessor] Request ${requestId} marked as expired.`);
}
