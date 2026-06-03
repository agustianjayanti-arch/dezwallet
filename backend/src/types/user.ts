export enum UserStatus {
    ACTIVE = 'active',
    FROZEN = 'frozen',
}

export interface User {
    id: string;
    name: string;
    email: string;
    password_hash: string;
    transaction_pin_hash: string | null;
    status: UserStatus;
    pin_attempts: number;
    pin_locked_until: Date | null;
    created_at: Date;
    updated_at: Date;
}

export interface UserPublic {
    id: string;
    name: string;
    email: string;
    status: UserStatus;
    created_at: Date;
}

export interface Admin {
    id: string;
    name: string;
    email: string;
    password_hash: string;
    role: 'superadmin' | 'moderator';
    created_at: Date;
    updated_at: Date;
}
