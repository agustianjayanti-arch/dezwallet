import { PoolClient } from 'pg';
import { pool } from '../config/database';
import { LedgerAccount, LedgerEntry, EntryType, AccountType } from '../types/ledger';

export async function createLedgerAccount(
    data: { userId: string | null; accountType: AccountType; name: string },
    client?: PoolClient
): Promise<LedgerAccount> {
    const db = client ?? pool;
    const result = await db.query<LedgerAccount>(
        `INSERT INTO ledger_accounts (user_id, account_type, name) VALUES ($1, $2, $3) RETURNING *`,
        [data.userId, data.accountType, data.name]
    );
    return result.rows[0];
}

export async function findLedgerAccountByUserId(userId: string): Promise<LedgerAccount | null> {
    const result = await pool.query<LedgerAccount>(
        `SELECT * FROM ledger_accounts WHERE user_id = $1 AND account_type = 'user' LIMIT 1`,
        [userId]
    );
    return result.rows[0] ?? null;
}

export async function findSystemTransitAccount(): Promise<LedgerAccount | null> {
    const result = await pool.query<LedgerAccount>(
        `SELECT * FROM ledger_accounts WHERE account_type = 'system' AND name = 'System Transit Account' LIMIT 1`
    );
    return result.rows[0] ?? null;
}

export async function insertLedgerEntry(
    data: {
        transactionId: string;
        ledgerAccountId: string;
        entryType: EntryType;
        amount: number;
    },
    client: PoolClient
): Promise<LedgerEntry> {
    const result = await client.query<LedgerEntry>(
        `INSERT INTO ledger_entries (transaction_id, ledger_account_id, entry_type, amount)
     VALUES ($1, $2, $3, $4) RETURNING *`,
        [data.transactionId, data.ledgerAccountId, data.entryType, data.amount]
    );
    return result.rows[0];
}

export async function getEntriesByTransactionId(transactionId: string): Promise<LedgerEntry[]> {
    const result = await pool.query<LedgerEntry>(
        `SELECT * FROM ledger_entries WHERE transaction_id = $1 ORDER BY created_at ASC`,
        [transactionId]
    );
    return result.rows;
}

export async function getAccountBalance(ledgerAccountId: string): Promise<number> {
    const result = await pool.query<{ balance: string }>(
        `SELECT
       COALESCE(SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE 0 END), 0) -
       COALESCE(SUM(CASE WHEN entry_type = 'debit'  THEN amount ELSE 0 END), 0) AS balance
     FROM ledger_entries
     WHERE ledger_account_id = $1`,
        [ledgerAccountId]
    );
    return parseFloat(result.rows[0]?.balance ?? '0');
}
