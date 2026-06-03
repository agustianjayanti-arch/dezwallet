export enum EntryType {
    DEBIT = 'debit',
    CREDIT = 'credit',
}

export enum AccountType {
    USER = 'user',
    SYSTEM = 'system',
}

export interface LedgerAccount {
    id: string;
    user_id: string | null;
    account_type: AccountType;
    name: string;
    created_at: Date;
}

export interface LedgerEntry {
    id: string;
    transaction_id: string;
    ledger_account_id: string;
    entry_type: EntryType;
    amount: string;
    created_at: Date;
}
