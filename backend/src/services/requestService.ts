import { getClient } from '../config/database';
import * as requestRepo from '../repositories/requestRepository';
import * as walletRepo from '../repositories/walletRepository';
import * as walletService from './walletService';
import * as ledgerService from './ledgerService';
import * as authService from './authService';
import * as notificationService from './notificationService';
import * as userRepo from '../repositories/userRepository';
import { moneyRequestExpiryQueue } from '../queues/queues';
import { AppError } from '../middleware/errorHandler';
import { MoneyRequestStatus, TransactionType, TransactionStatus } from '../types/transaction';
import { NotificationType } from '../types/notification';

const EXPIRY_HOURS = 72;

export async function createMoneyRequest(
    requesterId: string,
    targetId: string,
    amount: number,
    notes?: string
) {
    if (!amount || amount <= 0) throw AppError.badRequest('Jumlah permintaan harus lebih dari 0.');

    const target = await userRepo.findUserById(targetId);
    if (!target) throw AppError.notFound('Pengguna target tidak ditemukan.');
    if (requesterId === targetId) throw AppError.badRequest('Tidak dapat meminta uang dari diri sendiri.');

    const expiresAt = new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000);
    const request = await requestRepo.createMoneyRequest({ requesterId, targetId, amount, notes, expiresAt });

    // Schedule expiry job (Requirement 7.6)
    try {
        await moneyRequestExpiryQueue.add(
            'expire-request',
            { requestId: request.id },
            { delay: EXPIRY_HOURS * 60 * 60 * 1000, jobId: `expire-${request.id}` }
        );
    } catch (err) {
        console.warn('[RequestService] Failed to schedule expiry job:', err);
    }

    // Notifikasi ke target
    const requester = await userRepo.findUserById(requesterId);
    await notificationService.createNotification(targetId, NotificationType.MONEY_REQUEST_RECEIVED, {
        requestId: request.id,
        requesterName: requester?.name ?? 'Unknown',
        amount,
        notes,
    });

    return request;
}

export async function approveMoneyRequest(targetId: string, requestId: string, pin: string) {
    const request = await requestRepo.findMoneyRequestById(requestId);
    if (!request) throw AppError.notFound('Permintaan uang tidak ditemukan.');
    if (request.target_id !== targetId) throw AppError.forbidden('Anda tidak berwenang untuk menyetujui permintaan ini.');
    if (request.status !== MoneyRequestStatus.PENDING) {
        throw AppError.conflict('Permintaan uang sudah diproses sebelumnya.');
    }

    const amount = parseFloat(request.amount);

    // Verifikasi PIN
    await authService.verifyTransactionPin(targetId, pin);

    const client = await getClient();
    try {
        await client.query('BEGIN');

        // Lock wallets
        const [firstId, secondId] = [targetId, request.requester_id].sort();
        await walletRepo.lockWalletForUpdate(firstId, client);
        await walletRepo.lockWalletForUpdate(secondId, client);

        // Validasi saldo target (Requirement 7.4)
        const targetWallet = await walletRepo.findWalletByUserId(targetId, client);
        if (!targetWallet || parseFloat(targetWallet.balance) < amount) {
            throw AppError.unprocessable('Saldo tidak mencukupi.', 'INSUFFICIENT_BALANCE');
        }

        // Debit target, credit requester
        await walletService.debitWallet(targetId, amount, client);
        await walletService.creditWallet(request.requester_id, amount, client);

        // Buat transaction record
        const txResult = await client.query(
            `INSERT INTO transactions (type, status, amount, initiator_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [TransactionType.MONEY_REQUEST, TransactionStatus.SUCCESS, amount, targetId]
        );
        const transaction = txResult.rows[0];

        // Catat ledger
        await ledgerService.recordTransferEntries(transaction.id, targetId, request.requester_id, amount, client);

        // Update status
        await requestRepo.updateMoneyRequestStatus(requestId, MoneyRequestStatus.ACCEPTED, transaction.id, client);

        await client.query('COMMIT');

        // Batalkan expiry job
        try {
            const job = await moneyRequestExpiryQueue.getJob(`expire-${requestId}`);
            if (job) await (job as any).remove();
        } catch { /* ignore */ }

        // Invalidasi cache
        await walletService.invalidateBalanceCache(targetId);
        await walletService.invalidateBalanceCache(request.requester_id);

        // Notifikasi ke requester
        await notificationService.createNotification(request.requester_id, NotificationType.MONEY_REQUEST_ACCEPTED, {
            requestId, amount, transactionId: transaction.id,
        });

        return { requestId, status: MoneyRequestStatus.ACCEPTED };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

export async function rejectMoneyRequest(targetId: string, requestId: string) {
    const request = await requestRepo.findMoneyRequestById(requestId);
    if (!request) throw AppError.notFound('Permintaan uang tidak ditemukan.');
    if (request.target_id !== targetId) throw AppError.forbidden('Anda tidak berwenang untuk menolak permintaan ini.');
    if (request.status !== MoneyRequestStatus.PENDING) {
        throw AppError.conflict('Permintaan uang sudah diproses sebelumnya.');
    }

    await requestRepo.updateMoneyRequestStatus(requestId, MoneyRequestStatus.REJECTED);

    // Batalkan expiry job
    try {
        const job = await moneyRequestExpiryQueue.getJob(`expire-${requestId}`);
        if (job) await (job as any).remove();
    } catch { /* ignore */ }

    await notificationService.createNotification(request.requester_id, NotificationType.MONEY_REQUEST_REJECTED, {
        requestId,
    });

    return { requestId, status: MoneyRequestStatus.REJECTED };
}

export async function getMoneyRequests(
    userId: string,
    type: 'sent' | 'received' | 'all' = 'all',
    page: unknown,
    limit: unknown
) {
    return requestRepo.getMoneyRequests(userId, type, page, limit);
}
