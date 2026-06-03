import { getClient } from '../config/database';
import * as transferRepo from '../repositories/transferRepository';
import * as walletRepo from '../repositories/walletRepository';
import * as userRepo from '../repositories/userRepository';
import * as walletService from './walletService';
import * as ledgerService from './ledgerService';
import * as authService from './authService';
import * as notificationService from './notificationService';
import * as auditService from './auditService';
import { AppError } from '../middleware/errorHandler';
import { NotificationType } from '../types/notification';
import { AuditAction, ActorType } from '../types/audit';

/**
 * Transfer_Service — transfer saldo antar pengguna.
 * Requirement 4: atomik, validasi PIN, double-entry ledger.
 */
export async function initiateTransfer(
    senderId: string,
    receiverId: string,
    amount: number,
    pin: string,
    ipAddress: string | null = null
) {
    // Validasi amount
    if (!amount || amount <= 0) throw AppError.badRequest('Jumlah transfer harus lebih dari 0.');

    // Cek penerima ada (Requirement 4.4)
    const receiver = await userRepo.findUserById(receiverId);
    if (!receiver) throw AppError.notFound('Pengguna penerima tidak ditemukan.');

    // Tidak bisa transfer ke diri sendiri
    if (senderId === receiverId) throw AppError.badRequest('Tidak dapat mentransfer ke diri sendiri.');

    // Verifikasi PIN (Requirement 4.3) — juga cek PIN sudah dibuat
    await authService.verifyTransactionPin(senderId, pin);

    const client = await getClient();
    try {
        await client.query('BEGIN');

        // Lock kedua wallet untuk mencegah race condition (Requirement 14.5)
        // Lock dalam urutan yang konsisten (by userId) untuk mencegah deadlock
        const [firstId, secondId] = [senderId, receiverId].sort();
        await walletRepo.lockWalletForUpdate(firstId, client);
        await walletRepo.lockWalletForUpdate(secondId, client);

        // Validasi saldo (Requirement 4.2)
        const senderWallet = await walletRepo.findWalletByUserId(senderId, client);
        if (!senderWallet || parseFloat(senderWallet.balance) < amount) {
            throw AppError.unprocessable('Saldo tidak mencukupi untuk melakukan transfer.', 'INSUFFICIENT_BALANCE');
        }

        // Debit pengirim
        await walletService.debitWallet(senderId, amount, client);
        // Credit penerima
        await walletService.creditWallet(receiverId, amount, client);

        // Buat transaction + transfer record
        const { transaction, transfer } = await transferRepo.createTransferWithTransaction(
            { senderId, receiverId, amount },
            client
        );

        // Catat double-entry ledger (Requirement 4.5)
        await ledgerService.recordTransferEntries(transaction.id, senderId, receiverId, amount, client);

        await client.query('COMMIT');

        // Invalidasi cache saldo kedua pihak
        await walletService.invalidateBalanceCache(senderId);
        await walletService.invalidateBalanceCache(receiverId);

        // Kirim notifikasi (Requirement 4.6)
        const sender = await userRepo.findUserById(senderId);
        await notificationService.createNotification(senderId, NotificationType.TRANSFER_SENT, {
            amount,
            receiverName: receiver.name,
            transactionId: transaction.id,
        });
        await notificationService.createNotification(receiverId, NotificationType.TRANSFER_RECEIVED, {
            amount,
            senderName: sender?.name ?? 'Unknown',
            transactionId: transaction.id,
        });

        // Audit log
        await auditService.log(senderId, ActorType.USER, AuditAction.TRANSACTION_CREATED, transaction.id, 'transaction', ipAddress, {
            type: 'transfer',
            amount,
            receiverId,
        });

        return { transfer, transactionId: transaction.id };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

export async function getTransferStatus(transferId: string) {
    const transfer = await transferRepo.findTransferById(transferId);
    if (!transfer) throw AppError.notFound('Transfer tidak ditemukan.');
    return transfer;
}

export async function getTransferHistory(userId: string, page: unknown, limit: unknown) {
    return transferRepo.getTransferHistory(userId, page, limit);
}
