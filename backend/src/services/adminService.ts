import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database';
import * as adminRepo from '../repositories/adminRepository';
import * as userRepo from '../repositories/userRepository';
import * as auditService from './auditService';
import { compareHash } from '../utils/hash';
import { signToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { UserStatus } from '../types/user';
import { AuditAction, ActorType } from '../types/audit';
import { getCache, setCache } from '../config/redis';
import { getPagination, buildPaginationMeta } from '../utils/pagination';
import * as sessionRepo from '../repositories/sessionRepository';

const STATS_CACHE_TTL = 5 * 60; // 5 menit (Requirement 12.4)

export async function loginAdmin(email: string, password: string) {
    const admin = await adminRepo.findAdminByEmail(email.toLowerCase());
    if (!admin) throw AppError.unauthorized('Email atau password salah.');

    const match = await compareHash(password, admin.password_hash);
    if (!match) throw AppError.unauthorized('Email atau password salah.');

    const sessionId = uuidv4();
    const token = signToken({ userId: admin.id, sessionId, role: 'admin' });
    await sessionRepo.createSession(admin.id, sessionId);

    return {
        admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
        token,
    };
}

export async function listUsers(search: string | null, page: unknown, limit: unknown) {
    const pagination = getPagination(page, limit);
    const { users, total } = await userRepo.listUsers(search, pagination.limit, pagination.offset);

    // Ambil saldo untuk setiap user
    const usersWithBalance = await Promise.all(
        users.map(async (user) => {
            const walletResult = await pool.query<{ balance: string }>(
                `SELECT balance FROM wallets WHERE user_id = $1 LIMIT 1`,
                [user.id]
            );
            return {
                ...user,
                balance: walletResult.rows[0]?.balance ?? '0',
            };
        })
    );

    return {
        users: usersWithBalance,
        pagination: buildPaginationMeta(total, pagination.page, pagination.limit),
    };
}

export async function getUserDetail(userId: string) {
    const user = await userRepo.findUserById(userId);
    if (!user) throw AppError.notFound('Pengguna tidak ditemukan.');

    const [walletResult, transactionsResult, topupsResult] = await Promise.all([
        pool.query(`SELECT * FROM wallets WHERE user_id = $1 LIMIT 1`, [userId]),
        pool.query(`SELECT * FROM transactions WHERE initiator_id = $1 ORDER BY created_at DESC LIMIT 20`, [userId]),
        pool.query(`SELECT * FROM topups WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`, [userId]),
    ]);

    return {
        user: { id: user.id, name: user.name, email: user.email, status: user.status, created_at: user.created_at },
        wallet: walletResult.rows[0] ?? null,
        recentTransactions: transactionsResult.rows,
        recentTopUps: topupsResult.rows,
    };
}

export async function freezeAccount(adminId: string, userId: string, ipAddress: string | null = null) {
    const user = await userRepo.findUserById(userId);
    if (!user) throw AppError.notFound('Pengguna tidak ditemukan.');
    if (user.status === UserStatus.FROZEN) throw AppError.conflict('Akun sudah dalam status frozen.');

    await userRepo.updateUserStatus(userId, UserStatus.FROZEN);

    await auditService.log(adminId, ActorType.ADMIN, AuditAction.ACCOUNT_FROZEN, userId, 'user', ipAddress, {
        targetUserId: userId,
    });
}

export async function unfreezeAccount(adminId: string, userId: string, ipAddress: string | null = null) {
    const user = await userRepo.findUserById(userId);
    if (!user) throw AppError.notFound('Pengguna tidak ditemukan.');
    if (user.status === UserStatus.ACTIVE) throw AppError.conflict('Akun sudah dalam status aktif.');

    await userRepo.updateUserStatus(userId, UserStatus.ACTIVE);

    await auditService.log(adminId, ActorType.ADMIN, AuditAction.ACCOUNT_UNFROZEN, userId, 'user', ipAddress, {
        targetUserId: userId,
    });
}

export async function listAllTransactions(filters: {
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    userId?: string;
    page: unknown;
    limit: unknown;
}) {
    const pagination = getPagination(filters.page, filters.limit);
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (filters.type) { params.push(filters.type); conditions.push(`type = $${params.length}`); }
    if (filters.status) { params.push(filters.status); conditions.push(`status = $${params.length}`); }
    if (filters.startDate) { params.push(filters.startDate); conditions.push(`created_at >= $${params.length}`); }
    if (filters.endDate) { params.push(filters.endDate); conditions.push(`created_at <= $${params.length}`); }
    if (filters.userId) { params.push(filters.userId); conditions.push(`initiator_id = $${params.length}`); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM transactions ${where}`,
        params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    params.push(pagination.limit, pagination.offset);
    const result = await pool.query(
        `SELECT * FROM transactions ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
    );

    return {
        transactions: result.rows,
        pagination: buildPaginationMeta(total, pagination.page, pagination.limit),
    };
}

export async function getTransactionDetail(txId: string) {
    const txResult = await pool.query(`SELECT * FROM transactions WHERE id = $1 LIMIT 1`, [txId]);
    if (txResult.rowCount === 0) throw AppError.notFound('Transaksi tidak ditemukan.');

    const ledgerResult = await pool.query(
        `SELECT le.*, la.name as account_name, la.account_type
     FROM ledger_entries le
     JOIN ledger_accounts la ON le.ledger_account_id = la.id
     WHERE le.transaction_id = $1`,
        [txId]
    );

    return {
        transaction: txResult.rows[0],
        ledgerEntries: ledgerResult.rows,
    };
}

export async function getPlatformStats() {
    const cacheKey = 'stats:platform';
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const [txCount, volume, activeUsers, pendingTopUps] = await Promise.all([
        pool.query<{ count: string }>(`SELECT COUNT(*) as count FROM transactions WHERE status = 'success'`),
        pool.query<{ total: string }>(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'transfer' AND status = 'success'`),
        pool.query<{ count: string }>(`SELECT COUNT(*) as count FROM users WHERE status = 'active'`),
        pool.query<{ count: string }>(`SELECT COUNT(*) as count FROM topups WHERE status = 'pending'`),
    ]);

    const stats = {
        totalTransactions: parseInt(txCount.rows[0].count, 10),
        totalTransferVolume: parseFloat(volume.rows[0].total),
        activeUsers: parseInt(activeUsers.rows[0].count, 10),
        pendingTopUps: parseInt(pendingTopUps.rows[0].count, 10),
    };

    await setCache(cacheKey, stats, STATS_CACHE_TTL);
    return stats;
}
