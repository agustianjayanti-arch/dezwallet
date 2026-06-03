import { PoolClient } from 'pg';
import { pool } from '../config/database';
import { User, UserStatus } from '../types/user';

/**
 * Repository untuk operasi database tabel `users`.
 */

export async function createUser(
    data: { name: string; email: string; passwordHash: string },
    client?: PoolClient
): Promise<User> {
    const db = client ?? pool;
    const result = await db.query<User>(
        `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING *`,
        [data.name, data.email, data.passwordHash]
    );
    return result.rows[0];
}

export async function findUserByEmail(email: string): Promise<User | null> {
    const result = await pool.query<User>(
        `SELECT * FROM users WHERE email = $1 LIMIT 1`,
        [email]
    );
    return result.rows[0] ?? null;
}

export async function findUserById(id: string): Promise<User | null> {
    const result = await pool.query<User>(
        `SELECT * FROM users WHERE id = $1 LIMIT 1`,
        [id]
    );
    return result.rows[0] ?? null;
}

export async function updatePasswordHash(
    userId: string,
    passwordHash: string,
    client?: PoolClient
): Promise<void> {
    const db = client ?? pool;
    await db.query(
        `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
        [passwordHash, userId]
    );
}

export async function updatePinHash(
    userId: string,
    pinHash: string,
    client?: PoolClient
): Promise<void> {
    const db = client ?? pool;
    await db.query(
        `UPDATE users SET transaction_pin_hash = $1, pin_attempts = 0, pin_locked_until = NULL, updated_at = NOW() WHERE id = $2`,
        [pinHash, userId]
    );
}

export async function updateUserStatus(
    userId: string,
    status: UserStatus,
    client?: PoolClient
): Promise<void> {
    const db = client ?? pool;
    await db.query(
        `UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2`,
        [status, userId]
    );
}

export async function incrementPinAttempts(userId: string): Promise<number> {
    const result = await pool.query<{ pin_attempts: number }>(
        `UPDATE users SET pin_attempts = pin_attempts + 1, updated_at = NOW()
     WHERE id = $1
     RETURNING pin_attempts`,
        [userId]
    );
    return result.rows[0]?.pin_attempts ?? 0;
}

export async function resetPinAttempts(userId: string): Promise<void> {
    await pool.query(
        `UPDATE users SET pin_attempts = 0, pin_locked_until = NULL, updated_at = NOW() WHERE id = $1`,
        [userId]
    );
}

export async function setPinLock(userId: string, lockedUntil: Date): Promise<void> {
    await pool.query(
        `UPDATE users SET pin_locked_until = $1, updated_at = NOW() WHERE id = $2`,
        [lockedUntil, userId]
    );
}

export async function listUsers(
    search: string | null,
    limit: number,
    offset: number
): Promise<{ users: User[]; total: number }> {
    const params: unknown[] = [];
    let whereClause = '';

    if (search) {
        params.push(`%${search}%`);
        whereClause = `WHERE name ILIKE $1 OR email ILIKE $1`;
    }

    const countResult = await pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM users ${whereClause}`,
        params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    params.push(limit, offset);
    const limitIdx = params.length - 1;
    const offsetIdx = params.length;

    const result = await pool.query<User>(
        `SELECT * FROM users ${whereClause} ORDER BY created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        params
    );

    return { users: result.rows, total };
}
