import { pool } from '../config/database';
import { Admin } from '../types/user';

export async function findAdminByEmail(email: string): Promise<Admin | null> {
    const result = await pool.query<Admin>(
        `SELECT * FROM admins WHERE email = $1 LIMIT 1`,
        [email]
    );
    return result.rows[0] ?? null;
}

export async function findAdminById(id: string): Promise<Admin | null> {
    const result = await pool.query<Admin>(
        `SELECT * FROM admins WHERE id = $1 LIMIT 1`,
        [id]
    );
    return result.rows[0] ?? null;
}
