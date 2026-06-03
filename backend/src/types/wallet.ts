export interface Wallet {
    id: string;
    user_id: string;
    balance: string; // NUMERIC from PostgreSQL comes as string
    currency: string;
    created_at: Date;
    updated_at: Date;
}

export interface WalletBalance {
    balance: number;
    currency: string;
}
