export enum ActorType {
    USER = 'user',
    ADMIN = 'admin',
    SYSTEM = 'system',
}

export enum AuditAction {
    LOGIN_SUCCESS = 'login_success',
    LOGIN_FAILED = 'login_failed',
    LOGOUT = 'logout',
    PASSWORD_CHANGED = 'password_changed',
    PIN_CREATED = 'pin_created',
    PIN_CHANGED = 'pin_changed',
    PIN_LOCKED = 'pin_locked',
    TRANSACTION_CREATED = 'transaction_created',
    TOPUP_APPROVED = 'topup_approved',
    TOPUP_REJECTED = 'topup_rejected',
    ACCOUNT_FROZEN = 'account_frozen',
    ACCOUNT_UNFROZEN = 'account_unfrozen',
    USER_DATA_CHANGED = 'user_data_changed',
}

export interface AuditLog {
    id: string;
    actor_id: string | null;
    actor_type: ActorType;
    action: string;
    entity_id: string | null;
    entity_type: string | null;
    ip_address: string | null;
    metadata: Record<string, unknown>;
    created_at: Date;
}
