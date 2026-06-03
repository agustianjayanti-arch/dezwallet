import { Pool, PoolClient } from 'pg';
import { env } from './env';

/**
 * PostgreSQL connection pool.
 * Pool digunakan untuk mengelola koneksi database secara efisien
 * dengan reuse koneksi yang sudah ada.
 */
export const pool = new Pool({
    connectionString: env.DATABASE_URL,
    // Jumlah maksimum koneksi dalam pool
    max: 20,
    // Waktu tunggu sebelum koneksi idle dilepas (ms)
    idleTimeoutMillis: 30_000,
    // Waktu tunggu maksimum untuk mendapatkan koneksi dari pool (ms)
    connectionTimeoutMillis: 5_000,
    // SSL hanya diaktifkan di production
    ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Log error koneksi pool agar tidak silent fail
pool.on('error', (err) => {
    console.error('[Database] Unexpected error on idle client:', err.message);
});

pool.on('connect', () => {
    if (env.NODE_ENV === 'development') {
        console.log('[Database] New client connected to PostgreSQL pool');
    }
});

/**
 * Mendapatkan PoolClient dari pool untuk digunakan dalam database transaction.
 *
 * Caller bertanggung jawab untuk memanggil `client.release()` setelah selesai,
 * baik dalam kondisi sukses maupun error.
 *
 * Contoh penggunaan:
 * ```typescript
 * const client = await getClient();
 * try {
 *   await client.query('BEGIN');
 *   // ... operasi database ...
 *   await client.query('COMMIT');
 * } catch (err) {
 *   await client.query('ROLLBACK');
 *   throw err;
 * } finally {
 *   client.release();
 * }
 * ```
 *
 * @returns Promise<PoolClient> — koneksi database yang siap digunakan
 */
export async function getClient(): Promise<PoolClient> {
    return pool.connect();
}

/**
 * Menjalankan query sederhana menggunakan pool (tanpa transaction).
 * Cocok untuk operasi SELECT atau operasi tunggal yang tidak memerlukan atomicity.
 *
 * @param text — SQL query string
 * @param params — parameter query (untuk parameterized query)
 */
export async function query<T = unknown>(
    text: string,
    params?: unknown[]
): Promise<import('pg').QueryResult<T extends Record<string, unknown> ? T : never>> {
    return pool.query(text, params) as Promise<import('pg').QueryResult<T extends Record<string, unknown> ? T : never>>;
}
