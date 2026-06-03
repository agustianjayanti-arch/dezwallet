import { PoolClient } from 'pg';
import { pool } from '../config/database';
import { QRPayment } from '../types/transaction';

export async function createQRPayment(
    data: { creatorId: string; qrToken: string; amount: number; expiresAt: Date },
    client?: PoolClient
): Promise<QRPayment> {
    const db = client ?? pool;
    const result = await db.query<QRPayment>(
        `INSERT INTO qr_payments (creator_id, qr_token, amount, status, expires_at)
     VALUES ($1, $2, $3, 'active', $4) RETURNING *`,
        [data.creatorId, data.qrToken, data.amount, data.expiresAt]
    );
    return result.rows[0];
}

export async function findQRByToken(token: string): Promise<QRPayment | null> {
    const result = await pool.query<QRPayment>(
        `SELECT * FROM qr_payments WHERE qr_token = $1 LIMIT 1`,
        [token]
    );
    return result.rows[0] ?? null;
}

export async function markQRAsUsed(
    qrId: string,
    scannerId: string,
    transactionId: string,
    client: PoolClient
): Promise<void> {
    await client.query(
        `UPDATE qr_payments SET status = 'used', scanner_id = $1, transaction_id = $2 WHERE id = $3`,
        [scannerId, transactionId, qrId]
    );
}
