import { PoolClient } from 'pg';
import { getCache, setCache, deleteCache } from '../config/redis';
import { pool } from '../config/database';
import * as walletRepo from '../repositories/walletRepository';
import { AppError } from '../middleware/errorHandler';
import { getPagination, buildPaginationMeta } from '../utils/pagination';
import { WalletBalance } from '../types/wallet';

const BALANCE_CACHE_TTL = 60; // 60 detik (Requirement 14.2)

function balanceCacheKey(userId: string): string {
    return `balance:${userId}`;
}

/**
 * Mengambil saldo wallet.
 * Requirement 3.5: cek Redis cache dulu, fallback ke PostgreSQL.
 */
export async function getBalance(userId: string): Promise<WalletBalance> {
    // Coba dari cache
    const cached = await getCache<WalletBalance>(balanceCacheKey(userId));
    if (cached) return cached;

    // Fallback ke database
    const wallet = await walletRepo.findWalletByUserId(userId);
    if (!wallet) throw AppError.notFound('Wallet tidak ditemukan.');

    const result: WalletBalance = {
        balance: parseFloat(wallet.balance),
        currency: wallet.currency,
    };

    // Simpan ke cache
    await setCache(balanceCacheKey(userId), result, BALANCE_CACHE_TTL);
    return result;
}

/**
 * Invalidasi cache saldo setelah mutasi.
 */
export async function invalidateBalanceCache(userId: string): Promise<void> {
    await deleteCache(balanceCacheKey(userId));
}

/**
 * Mengambil riwayat transaksi dengan pagination.
 * Requirement 3.2: diurutkan berdasarkan waktu terbaru.
 */
export async function getTransactionHistory(
    userId: string,
    page: unknown,
    limit: unknown
) {
    const pagination = getPagination(page, limit);
    const { transactions, total } = await walletRepo.getTransactionHistory(
        userId,
        pagination.limit,
        pagination.offset
    );

    return {
        transactions,
        pagination: buildPaginationMeta(total, pagination.page, pagination.limit),
    };
}

/**
 * Mengambil ledger entries untuk user.
 * Requirement 3.6.
 */
export async function getLedgerEntries(userId: string, page: unknown, limit: unknown) {
    const pagination = getPagination(page, limit);

    const countResult = await pool.query<{ count: string }>(
        `SELECT COUNT(*) as count
     FROM ledger_entries le
     JOIN ledger_accounts la ON le.ledger_account_id = la.id
     WHERE la.user_id = $1`,
        [userId]
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await pool.query(
        `SELECT le.*, la.name as account_name, t.type as transaction_type
     FROM ledger_entries le
     JOIN ledger_accounts la ON le.ledger_account_id = la.id
     JOIN transactions t ON le.transaction_id = t.id
     WHERE la.user_id = $1
     ORDER BY le.created_at DESC
     LIMIT $2 OFFSET $3`,
        [userId, pagination.limit, pagination.offset]
    );

    return {
        entries: result.rows,
        pagination: buildPaginationMeta(total, pagination.page, pagination.limit),
    };
}

/**
 * Validasi saldo mencukupi.
 * Requirement 3.3: saldo tidak pernah negatif.
 */
export async function validateSufficientBalance(userId: string, amount: number): Promise<boolean> {
    const wallet = await walletRepo.findWalletByUserId(userId);
    if (!wallet) throw AppError.notFound('Wallet tidak ditemukan.');
    return parseFloat(wallet.balance) >= amount;
}

/**
 * Debit wallet dalam konteks database transaction.
 * Requirement 3.4: menggunakan pgClient untuk atomicity.
 */
export async function debitWallet(userId: string, amount: number, client: PoolClient): Promise<void> {
    try {
        await walletRepo.debitWallet(userId, amount, client);
    } catch (err) {
        if (err instanceof Error && err.message === 'INSUFFICIENT_BALANCE') {
            throw AppError.unprocessable('Saldo tidak mencukupi untuk melakukan transaksi ini.', 'INSUFFICIENT_BALANCE');
        }
        throw err;
    }
}

/**
 * Credit wallet dalam konteks database transaction.
 */
export async function creditWallet(userId: string, amount: number, client: PoolClient): Promise<void> {
    await walletRepo.creditWallet(userId, amount, client);
}
