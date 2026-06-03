import { PoolClient } from 'pg';
import { pool } from '../config/database';
import { Transfer, Transaction, TransactionType, TransactionStatus } from '../types/transaction';
import { getPagination, buildPaginationMeta } from '../utils/pagination';

export async function createTransferWithTransaction(
    data: {
        senderId: string;
        receiverId: string;
        amount: number;
        notes?: string;
    },
    client: PoolClient
): Promise<{ transaction: Transaction; transfer: Transfer }> {
    // Insert parent transaction
    const txResult = await client.query<Transaction>(
        `INSERT INTO transactions (type, status, amount, initiator_id, notes)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [TransactionType.TRANSFER, TransactionStatus.SUCCESS, data.amount, data.senderId, data.notes ?? null]
    );
    const transaction = txResult.rows[0];

    // Insert transfer detail
    const transferResult = await client.query<Transfer>(
        `INSERT INTO transfers (transaction_id, sender_id, receiver_id, amount)
     VALUES ($1, $2, $3, $4) RETURNING *`,
        [transaction.id, data.senderId, data.receiverId, data.amount]
    );

    return { transaction, transfer: transferResult.rows[0] };
}

export async function findTransferById(transferId: string): Promise<Transfer | null> {
    const result = await pool.query<Transfer>(
        `SELECT t.*, tx.status, tx.created_at as tx_created_at
     FROM transfers t
     JOIN transactions tx ON t.transaction_id = tx.id
     WHERE t.id = $1 LIMIT 1`,
        [transferId]
    );
    return result.rows[0] ?? null;
}

export async function getTransferHistory(
    userId: string,
    page: unknown,
    limit: unknown
) {
    const pagination = getPagination(page, limit);

    const countResult = await pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM transfers WHERE sender_id = $1 OR receiver_id = $1`,
        [userId]
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await pool.query(
        `SELECT t.*, tx.status, tx.created_at as created_at,
            u_sender.name as sender_name, u_receiver.name as receiver_name
     FROM transfers t
     JOIN transactions tx ON t.transaction_id = tx.id
     JOIN users u_sender ON t.sender_id = u_sender.id
     JOIN users u_receiver ON t.receiver_id = u_receiver.id
     WHERE t.sender_id = $1 OR t.receiver_id = $1
     ORDER BY tx.created_at DESC
     LIMIT $2 OFFSET $3`,
        [userId, pagination.limit, pagination.offset]
    );

    return {
        transfers: result.rows,
        pagination: buildPaginationMeta(total, pagination.page, pagination.limit),
    };
}
