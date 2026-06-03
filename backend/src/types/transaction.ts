export enum TransactionType {
    TRANSFER = 'transfer',
    TOPUP = 'topup',
    QR_PAYMENT = 'qr_payment',
    MONEY_REQUEST = 'money_request',
}

export enum TransactionStatus {
    PENDING = 'pending',
    SUCCESS = 'success',
    FAILED = 'failed',
}

export enum TopUpStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

export enum QRStatus {
    ACTIVE = 'active',
    USED = 'used',
    EXPIRED = 'expired',
}

export enum MoneyRequestStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
    EXPIRED = 'expired',
}

export interface Transaction {
    id: string;
    type: TransactionType;
    status: TransactionStatus;
    amount: string;
    initiator_id: string | null;
    notes: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface Transfer {
    id: string;
    transaction_id: string;
    sender_id: string;
    receiver_id: string;
    amount: string;
    created_at: Date;
}

export interface TopUp {
    id: string;
    transaction_id: string | null;
    user_id: string;
    amount: string;
    proof_url: string | null;
    status: TopUpStatus;
    reviewed_by: string | null;
    rejection_reason: string | null;
    reviewed_at: Date | null;
    created_at: Date;
}

export interface QRPayment {
    id: string;
    transaction_id: string | null;
    creator_id: string;
    scanner_id: string | null;
    qr_token: string;
    amount: string;
    status: QRStatus;
    expires_at: Date;
    created_at: Date;
}

export interface MoneyRequest {
    id: string;
    transaction_id: string | null;
    requester_id: string;
    target_id: string;
    amount: string;
    notes: string | null;
    status: MoneyRequestStatus;
    expires_at: Date;
    created_at: Date;
    updated_at: Date;
}
