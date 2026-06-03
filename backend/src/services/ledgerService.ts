import { PoolClient } from 'pg';
import * as ledgerRepo from '../repositories/ledgerRepository';
import { EntryType } from '../types/ledger';
import { LedgerEntry } from '../types/ledger';

/**
 * Ledger_Service — Double-Entry Bookkeeping
 * Requirement 9: setiap transaksi keuangan dicatat sebagai pasangan debit/kredit.
 * Semua operasi menerima pgClient aktif untuk atomicity dengan mutasi saldo.
 */

/**
 * Mencatat 4 ledger entries untuk transfer antar pengguna.
 * Requirement 9.2: DEBIT pengirim → CREDIT sistem → DEBIT sistem → CREDIT penerima.
 */
export async function recordTransferEntries(
    transactionId: string,
    senderId: string,
    receiverId: string,
    amount: number,
    client: PoolClient
): Promise<void> {
    const [senderAccount, receiverAccount, systemAccount] = await Promise.all([
        ledgerRepo.findLedgerAccountByUserId(senderId),
        ledgerRepo.findLedgerAccountByUserId(receiverId),
        ledgerRepo.findSystemTransitAccount(),
    ]);

    if (!senderAccount) throw new Error(`Ledger account tidak ditemukan untuk pengirim: ${senderId}`);
    if (!receiverAccount) throw new Error(`Ledger account tidak ditemukan untuk penerima: ${receiverId}`);
    if (!systemAccount) throw new Error('System transit ledger account tidak ditemukan.');

    // 1. DEBIT pengirim
    await ledgerRepo.insertLedgerEntry(
        { transactionId, ledgerAccountId: senderAccount.id, entryType: EntryType.DEBIT, amount },
        client
    );
    // 2. CREDIT sistem transit
    await ledgerRepo.insertLedgerEntry(
        { transactionId, ledgerAccountId: systemAccount.id, entryType: EntryType.CREDIT, amount },
        client
    );
    // 3. DEBIT sistem transit
    await ledgerRepo.insertLedgerEntry(
        { transactionId, ledgerAccountId: systemAccount.id, entryType: EntryType.DEBIT, amount },
        client
    );
    // 4. CREDIT penerima
    await ledgerRepo.insertLedgerEntry(
        { transactionId, ledgerAccountId: receiverAccount.id, entryType: EntryType.CREDIT, amount },
        client
    );
}

/**
 * Mencatat ledger entries untuk top up saldo.
 * DEBIT sistem → CREDIT user (dana masuk dari luar sistem).
 */
export async function recordTopUpEntries(
    transactionId: string,
    userId: string,
    amount: number,
    client: PoolClient
): Promise<void> {
    const [userAccount, systemAccount] = await Promise.all([
        ledgerRepo.findLedgerAccountByUserId(userId),
        ledgerRepo.findSystemTransitAccount(),
    ]);

    if (!userAccount) throw new Error(`Ledger account tidak ditemukan untuk user: ${userId}`);
    if (!systemAccount) throw new Error('System transit ledger account tidak ditemukan.');

    // DEBIT sistem (dana keluar dari sistem ke user)
    await ledgerRepo.insertLedgerEntry(
        { transactionId, ledgerAccountId: systemAccount.id, entryType: EntryType.DEBIT, amount },
        client
    );
    // CREDIT user
    await ledgerRepo.insertLedgerEntry(
        { transactionId, ledgerAccountId: userAccount.id, entryType: EntryType.CREDIT, amount },
        client
    );
}

/**
 * Mencatat ledger entries untuk pembayaran QR Code.
 * Sama dengan transfer: DEBIT payer → CREDIT sistem → DEBIT sistem → CREDIT payee.
 */
export async function recordQRPaymentEntries(
    transactionId: string,
    payerId: string,
    payeeId: string,
    amount: number,
    client: PoolClient
): Promise<void> {
    return recordTransferEntries(transactionId, payerId, payeeId, amount, client);
}

/**
 * Mengambil semua ledger entries untuk sebuah transaksi.
 * Requirement 9.6.
 */
export async function getLedgerEntriesByTransaction(transactionId: string): Promise<LedgerEntry[]> {
    return ledgerRepo.getEntriesByTransactionId(transactionId);
}

/**
 * Menghitung saldo akun ledger.
 * Requirement 9.5: SUM(credit) - SUM(debit).
 */
export async function getAccountBalance(ledgerAccountId: string): Promise<number> {
    return ledgerRepo.getAccountBalance(ledgerAccountId);
}
