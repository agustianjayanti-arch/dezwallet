import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../.env') });

import bcrypt from 'bcrypt';
import { pool } from '../config/database';

async function main(): Promise<void> {
    console.log('[seed] Starting database seed...');
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // ── 1. System ledger account (transit account for transfers) ─────────────
        const existingSystem = await client.query(
            `SELECT id FROM ledger_accounts WHERE account_type = 'system' AND name = 'System Transit Account' LIMIT 1`
        );

        if (existingSystem.rowCount === 0) {
            await client.query(
                `INSERT INTO ledger_accounts (account_type, name) VALUES ('system', 'System Transit Account')`
            );
            console.log('[seed] Created system transit ledger account.');
        } else {
            console.log('[seed] System transit ledger account already exists, skipping.');
        }

        // ── 2. Default superadmin ─────────────────────────────────────────────────
        const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@dezpay.id';
        const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@DezPay2024!';

        const existingAdmin = await client.query(
            `SELECT id FROM admins WHERE email = $1 LIMIT 1`,
            [adminEmail]
        );

        if (existingAdmin.rowCount === 0) {
            const rounds = parseInt(process.env.BCRYPT_ROUNDS ?? '10', 10);
            const passwordHash = await bcrypt.hash(adminPassword, rounds);

            await client.query(
                `INSERT INTO admins (name, email, password_hash, role)
         VALUES ($1, $2, $3, 'superadmin')`,
                ['Super Admin', adminEmail, passwordHash]
            );
            console.log(`[seed] Created default admin: ${adminEmail}`);
            console.log('[seed] IMPORTANT: Change the admin password after first login!');
        } else {
            console.log(`[seed] Admin ${adminEmail} already exists, skipping.`);
        }

        await client.query('COMMIT');
        console.log('[seed] Seed completed successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[seed] Seed failed, rolled back:', err);
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

main().catch((err) => {
    console.error('[seed] Fatal error:', err);
    process.exit(1);
});
