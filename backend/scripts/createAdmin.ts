import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function createAdmin() {
    const email = 'admin@dezpay.com';
    const password = 'Admin123!';
    const name = 'System Administrator';
    const role = 'super_admin';

    try {
        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);
        console.log('Password hash:', passwordHash);

        // Insert admin
        const result = await pool.query(
            `INSERT INTO admins (id, email, password_hash, name, role, created_at)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
             ON CONFLICT (email) DO UPDATE 
             SET password_hash = $2, name = $3, role = $4
             RETURNING id, email, name, role`,
            [email, passwordHash, name, role]
        );

        console.log('✅ Admin created successfully:');
        console.log(result.rows[0]);
        console.log('\nLogin credentials:');
        console.log('Email:', email);
        console.log('Password:', password);

        await pool.end();
    } catch (error) {
        console.error('❌ Error creating admin:', error);
        await pool.end();
        process.exit(1);
    }
}

createAdmin();
