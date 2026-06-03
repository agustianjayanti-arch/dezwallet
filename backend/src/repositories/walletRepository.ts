import { PoolClient } from 'pg';
import { pool } from '../config/database';
import { Wallet } from '../types/wallet';
import { Transaction } from '../types/transaction';

export async function findWalletByUserId(userId: string, client?: PoolClient): Promise<Wallet | null> {
    const db = client ?? pool;
    const result = await db.query<Wallet>(
        `SELECT * FROM wallets WHERE user_id = $1 LIMIT 1`,
        [userId]
    );
    return result.rows[0] ?? null;
}

/**
 * Debit wallet — kurangi saldo.
 * Menggunakan SELECT FOR UPDATE untuk mencegah race condition.
 * Requirement 3.3: saldo tidak pernah negatif.
 */
export async function debitWallet(
    userId: string,
    amount: number,
    client: PoolClient
): Promise<Wallet> {
    const result = await client.query<Wallet>(
        `UPDATE wallets
     SET balance = balance - $1, updated_at = NOW()
     WHERE user_id = $2 AND balance >= $1
     RETURNING *`,
        [amount, userId]
    );

    if (result.rowCount === 0) {
        throw new Error('INSUFFICIENT_BALANCE');
    }

    return result.rows[0];
}

/**
 * Credit wallet — tambah saldo.
 */
export async function creditWallet(
    userId: string,
    amount: number,
    client: PoolClient
): Promise<Wallet> {
    const result = await client.query<Wallet>(
        `UPDATE wallets
     SET balance = balance + $1, updated_at = NOW()
     WHERE user_id = $2
     RETURNING *`,
        [amount, userId]
    );
    return result.rows[0];
}

/**
 * Lock wallet row untuk transaksi (SELECT FOR UPDATE).
 */
export async function lockWalletForUpdate(userId: string, client: PoolClient): Promise<Wallet | null> {
    const result = await client.query<Wallet>(
        `SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE`,
        [userId]
    );
    return result.rows[0] ?? null;
}

export async function getTransactionHistory(
    userId: string,
    limit: number,
    offset: number
): Promise<{ transactions: Transaction[]; total: number }> {
    const countResult = await pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM transactions WHERE initiator_id = $1`,
        [userId]
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await pool.query<Transaction>(
        `SELECT * FROM transactions WHERE initiator_id = $1
     ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
    );

    return { transactions: result.rows, total };
}
