import { getClient } from '../config/database';
import * as topupRepo from '../repositories/topupRepository';
import * as walletService from './walletService';
import * as ledgerService from './ledgerService';
import * as notificationService from './notificationService';
import * as auditService from './auditService';
import { AppError } from '../middleware/errorHandler';
import { TopUpStatus, TransactionType, TransactionStatus } from '../types/transaction';
import { NotificationType } from '../types/notification';
import { AuditAction, ActorType } from '../types/audit';
import { isValidTopUpAmount } from '../utils/validators';

export async function submitTopUp(
    userId: string,
    amount: number,
    proofUrl?: string
) {
    // Requirement 5.6: validasi rentang amount
    if (!isValidTopUpAmount(amount)) {
        throw AppError.unprocessable('Jumlah top up harus antara Rp10.000 dan Rp10.000.000.', 'INVALID_TOPUP_AMOUNT');
    }

    const topup = await topupRepo.createTopUp({ userId, amount, proofUrl });
    return topup;
}

export async function approveTopUp(adminId: string, topUpId: string, ipAddress: string | null = null) {
    const topup = await topupRepo.findTopUpById(topUpId);
    if (!topup) throw AppError.notFound('Pengajuan top up tidak ditemukan.');
    if (topup.status !== TopUpStatus.PENDING) {
        throw AppError.conflict('Pengajuan top up sudah diproses sebelumnya.');
    }

    const client = await getClient();
    try {
        await client.query('BEGIN');

        // Credit wallet user
        await walletService.creditWallet(topup.user_id, parseFloat(topup.amount), client);

        // Buat transaction record
        const txResult = await client.query(
            `INSERT INTO transactions (type, status, amount, initiator_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [TransactionType.TOPUP, TransactionStatus.SUCCESS, topup.amount, topup.user_id]
        );
        const transaction = txResult.rows[0];

        // Update topup status
        await topupRepo.updateTopUpStatus(
            topUpId,
            TopUpStatus.APPROVED,
            { reviewedBy: adminId, transactionId: transaction.id },
            client
        );

        // Catat ledger (Requirement 5.5: lanjutkan meski ledger gagal)
        try {
            await ledgerService.recordTopUpEntries(transaction.id, topup.user_id, parseFloat(topup.amount), client);
        } catch (ledgerErr) {
            console.warn('[TopUpService] Ledger recording failed, continuing:', ledgerErr);
        }

        await client.query('COMMIT');

        // Invalidasi cache saldo
        await walletService.invalidateBalanceCache(topup.user_id);

        // Notifikasi
        await notificationService.createNotification(topup.user_id, NotificationType.TOPUP_APPROVED, {
            amount: topup.amount,
            topUpId,
        });

        // Audit log
        await auditService.log(adminId, ActorType.ADMIN, AuditAction.TOPUP_APPROVED, topUpId, 'topup', ipAddress, {
            userId: topup.user_id,
            amount: topup.amount,
        });

        return { topUpId, status: TopUpStatus.APPROVED };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

export async function rejectTopUp(
    adminId: string,
    topUpId: string,
    rejectionReason: string,
    ipAddress: string | null = null
) {
    const topup = await topupRepo.findTopUpById(topUpId);
    if (!topup) throw AppError.notFound('Pengajuan top up tidak ditemukan.');
    if (topup.status !== TopUpStatus.PENDING) {
        throw AppError.conflict('Pengajuan top up sudah diproses sebelumnya.');
    }

    await topupRepo.updateTopUpStatus(topUpId, TopUpStatus.REJECTED, { reviewedBy: adminId, rejectionReason });

    await notificationService.createNotification(topup.user_id, NotificationType.TOPUP_REJECTED, {
        amount: topup.amount,
        topUpId,
        reason: rejectionReason,
    });

    await auditService.log(adminId, ActorType.ADMIN, AuditAction.TOPUP_REJECTED, topUpId, 'topup', ipAddress, {
        userId: topup.user_id,
        reason: rejectionReason,
    });

    return { topUpId, status: TopUpStatus.REJECTED };
}

export async function getTopUpHistory(userId: string, page: unknown, limit: unknown) {
    return topupRepo.getTopUpHistory(userId, page, limit);
}

export async function getAllPendingTopUps(page: unknown, limit: unknown) {
    return topupRepo.getAllPendingTopUps(page, limit);
}
