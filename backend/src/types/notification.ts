export interface Notification {
    id: string;
    user_id: string;
    type: string;
    payload: Record<string, unknown>;
    is_read: boolean;
    created_at: Date;
}

export enum NotificationType {
    TRANSFER_SENT = 'transfer_sent',
    TRANSFER_RECEIVED = 'transfer_received',
    TOPUP_APPROVED = 'topup_approved',
    TOPUP_REJECTED = 'topup_rejected',
    QR_PAYMENT_SENT = 'qr_payment_sent',
    QR_PAYMENT_RECEIVED = 'qr_payment_received',
    MONEY_REQUEST_RECEIVED = 'money_request_received',
    MONEY_REQUEST_ACCEPTED = 'money_request_accepted',
    MONEY_REQUEST_REJECTED = 'money_request_rejected',
    MONEY_REQUEST_EXPIRED = 'money_request_expired',
}
