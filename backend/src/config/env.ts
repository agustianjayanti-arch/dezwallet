import { z } from 'zod';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env file dari root backend directory
config({ path: resolve(__dirname, '../../.env') });

/**
 * Schema validasi environment variables menggunakan Zod.
 * Semua variabel wajib ada kecuali yang memiliki nilai default.
 */
const envSchema = z.object({
    // Server
    PORT: z
        .string()
        .default('3000')
        .transform((val) => parseInt(val, 10))
        .refine((val) => !isNaN(val) && val > 0 && val < 65536, {
            message: 'PORT harus berupa angka antara 1 dan 65535',
        }),

    NODE_ENV: z
        .enum(['development', 'production', 'test'])
        .default('development'),

    // Database
    DATABASE_URL: z
        .string()
        .min(1, 'DATABASE_URL wajib diisi')
        .url('DATABASE_URL harus berupa URL yang valid'),

    // Redis
    REDIS_URL: z
        .string()
        .min(1, 'REDIS_URL wajib diisi')
        .default('redis://localhost:6379'),

    // JWT
    JWT_SECRET: z
        .string()
        .min(32, 'JWT_SECRET harus minimal 32 karakter untuk keamanan'),

    JWT_EXPIRES_IN: z
        .string()
        .default('24h')
        .refine(
            (val) => /^\d+[smhd]$/.test(val) || /^\d+$/.test(val),
            { message: 'JWT_EXPIRES_IN harus berformat seperti "24h", "7d", "3600s", atau angka detik' }
        ),

    // Bcrypt
    BCRYPT_ROUNDS: z
        .string()
        .default('10')
        .transform((val) => parseInt(val, 10))
        .refine((val) => !isNaN(val) && val >= 8 && val <= 14, {
            message: 'BCRYPT_ROUNDS harus antara 8 dan 14',
        }),
});

/**
 * Tipe yang diinfer dari schema validasi.
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validasi dan parse environment variables.
 * Akan melempar error dengan pesan yang jelas jika ada variabel yang tidak valid.
 */
function validateEnv(): Env {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        const errors = result.error.errors
            .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
            .join('\n');

        throw new Error(
            `Konfigurasi environment tidak valid:\n${errors}\n\nPastikan file .env sudah dikonfigurasi dengan benar.`
        );
    }

    return result.data;
}

/**
 * Environment variables yang sudah divalidasi.
 * Diekspos sebagai singleton agar validasi hanya berjalan sekali.
 */
export const env = validateEnv();
