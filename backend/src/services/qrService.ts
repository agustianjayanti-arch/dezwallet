import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { getClient } from '../config/database';
import { isRedisConnected, redisClient } from '../config/redis';
import * as qrRepo from '../repositories/qrRepository';
import * as walletRepo from '../repositories/walletRepository';
import * as walletService from './walletService';
import * as ledgerService from './ledgerService';
import * as authService from './authService';
import * as notificationService from './notificationService';
import * as userRepo from '../repositories/userRepository';
import { AppError } from '../middleware/errorHandler';
import { TransactionType, TransactionStatus, QRStatus } from '../types/transaction';
import { NotificationType } from '../types/notification';

const QR_TTL_SECONDS = 15 * 60; // 15 menit
const QR_CACHE_PREFIX = 'qr:';

/**
 * Generate QR Code untuk pembayaran.
 * Requirement 6.1: token unik, berlaku 15 menit, disimpan di Redis.
 */
export async function generateQRCode(userId: string, amount: number) {
    if (!amount || amount <= 0) throw AppError.badRequest('Jumlah pembayaran harus lebih dari 0.');

    const qrToken = uuidv4();
    const expiresAt = new Date(Date.now() + QR_TTL_SECONDS * 1000);

    // Simpan ke database
    await qrRepo.createQRPayment({ creatorId: userId, qrToken, amount, expiresAt });

    // Simpan token ke Redis untuk validasi cepat (Requirement 6.7)
    if (isRedisConnected()) {
        await redisClient.setex(`${QR_CACHE_PREFIX}${qrToken}`, QR_TTL_SECONDS, JSON.stringify({ creatorId: userId, amount }));
    }

    // Generate QR image sebagai data URL
    const qrData = JSON.stringify({ token: qrToken, amount });
    const qrImageUrl = await QRCode.toDataURL(qrData);

    return { qrToken, qrImageUrl, expiresAt, amount };
}

/**
 * Proses pembayaran QR Code.
 * Requirement 6.2–6.6: validasi expired, used, saldo, PIN, atomik.
 */
export async function processQRPayment(scannerId: string, qrToken: string, pin: string) {
    // Cek token di Redis (Requirement 6.3: expired → HTTP 410)
    if (isRedisConnected()) {
        const cached = await redisClient.get(`${QR_CACHE_PREFIX}${qrToken}`);
        if (!cached) {
            // Token tidak ada di Redis — bisa expired atau tidak pernah ada
            // Cek database untuk membedakan "used" vs "expired/not found"
            const qrInDb = await qrRepo.findQRByToken(qrToken);
            if (!qrInDb) throw AppError.notFound('QR Code tidak ditemukan.');
            if (qrInDb.status === QRStatus.USED) throw new AppError('QR Code sudah digunakan.', 409, 'QR_ALREADY_USED');
            // Jika ada di DB tapi tidak di Redis → expired
            throw new AppError('QR Code sudah kedaluwarsa.', 410, 'QR_EXPIRED');
        }
    }

    // Cek database
    const qrPayment = await qrRepo.findQRByToken(qrToken);
    if (!qrPayment) throw AppError.notFound('QR Code tidak ditemukan.');
    if (qrPayment.status === QRStatus.USED) throw new AppError('QR Code sudah digunakan.', 409, 'QR_ALREADY_USED');
    if (qrPayment.status === QRStatus.EXPIRED || new Date() > new Date(qrPayment.expires_at)) {
        throw new AppError('QR Code sudah kedaluwarsa.', 410, 'QR_EXPIRED');
    }

    // Tidak bisa bayar QR milik sendiri
    if (qrPayment.creator_id === scannerId) throw AppError.badRequest('Tidak dapat membayar QR Code milik sendiri.');

    const amount = parseFloat(qrPayment.amount);

    // Verifikasi PIN
    await authService.verifyTransactionPin(scannerId, pin);

    const client = await getClient();
    try {
        await client.query('BEGIN');

        // Lock wallets
        const [firstId, secondId] = [scannerId, qrPayment.creator_id].sort();
        await walletRepo.lockWalletForUpdate(firstId, client);
        await walletRepo.lockWalletForUpdate(secondId, client);

        // Validasi saldo (Requirement 6.6)
        const scannerWallet = await walletRepo.findWalletByUserId(scannerId, client);
        if (!scannerWallet || parseFloat(scannerWallet.balance) < amount) {
            throw AppError.unprocessable('Saldo tidak mencukupi.', 'INSUFFICIENT_BALANCE');
        }

        // Debit scanner, credit creator
        await walletService.debitWallet(scannerId, amount, client);
        await walletService.creditWallet(qrPayment.creator_id, amount, client);

        // Buat transaction record
        const txResult = await client.query(
            `INSERT INTO transactions (type, status, amount, initiator_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [TransactionType.QR_PAYMENT, TransactionStatus.SUCCESS, amount, scannerId]
        );
        const transaction = txResult.rows[0];

        // Catat ledger
        await ledgerService.recordQRPaymentEntries(transaction.id, scannerId, qrPayment.creator_id, amount, client);

        // Mark QR sebagai used
        await qrRepo.markQRAsUsed(qrPayment.id, scannerId, transaction.id, client);

        await client.query('COMMIT');

        // Hapus dari Redis
        if (isRedisConnected()) {
            await redisClient.del(`${QR_CACHE_PREFIX}${qrToken}`);
        }

        // Invalidasi cache saldo
        await walletService.invalidateBalanceCache(scannerId);
        await walletService.invalidateBalanceCache(qrPayment.creator_id);

        // Notifikasi
        const scanner = await userRepo.findUserById(scannerId);
        await notificationService.createNotification(scannerId, NotificationType.QR_PAYMENT_SENT, {
            amount, transactionId: transaction.id,
        });
        await notificationService.createNotification(qrPayment.creator_id, NotificationType.QR_PAYMENT_RECEIVED, {
            amount, scannerName: scanner?.name ?? 'Unknown', transactionId: transaction.id,
        });

        return { transactionId: transaction.id, amount };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

export async function getQRStatus(qrToken: string) {
    const qr = await qrRepo.findQRByToken(qrToken);
    if (!qr) throw AppError.notFound('QR Code tidak ditemukan.');
    return qr;
}
