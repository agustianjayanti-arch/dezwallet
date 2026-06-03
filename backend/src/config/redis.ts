import Redis from 'ioredis';
import { env } from './env';

/**
 * Status koneksi Redis untuk tracking graceful fallback.
 */
let isRedisAvailable = false;

/**
 * ioredis client instance.
 * Dikonfigurasi dengan retry strategy yang terbatas agar tidak
 * terus-menerus mencoba reconnect jika Redis memang tidak tersedia.
 */
export const redisClient = new Redis(env.REDIS_URL, {
    // Jangan throw error saat koneksi gagal — tangani secara graceful
    lazyConnect: true,
    // Maksimum 3 kali retry dengan backoff eksponensial
    retryStrategy(times) {
        if (times > 3) {
            // Setelah 3 kali gagal, hentikan retry dan tandai Redis tidak tersedia
            console.warn('[Redis] Koneksi gagal setelah 3 percobaan. Fallback ke PostgreSQL akan digunakan.');
            isRedisAvailable = false;
            return null; // null = hentikan retry
        }
        // Backoff: 200ms, 400ms, 800ms
        return Math.min(times * 200, 800);
    },
    // Timeout koneksi
    connectTimeout: 5_000,
    // Jangan emit error yang tidak tertangani ke process
    enableOfflineQueue: false,
});

// Event handlers untuk tracking status koneksi
redisClient.on('connect', () => {
    isRedisAvailable = true;
    console.log('[Redis] Terhubung ke Redis');
});

redisClient.on('ready', () => {
    isRedisAvailable = true;
    if (env.NODE_ENV === 'development') {
        console.log('[Redis] Redis siap menerima perintah');
    }
});

redisClient.on('error', (err) => {
    isRedisAvailable = false;
    // Log sebagai warning, bukan error fatal — sistem tetap berjalan dengan fallback
    console.warn('[Redis] Error koneksi Redis:', err.message);
});

redisClient.on('close', () => {
    isRedisAvailable = false;
    if (env.NODE_ENV === 'development') {
        console.warn('[Redis] Koneksi Redis ditutup');
    }
});

redisClient.on('reconnecting', () => {
    if (env.NODE_ENV === 'development') {
        console.log('[Redis] Mencoba reconnect ke Redis...');
    }
});

// Inisialisasi koneksi secara non-blocking
redisClient.connect().catch((err) => {
    console.warn('[Redis] Gagal terhubung ke Redis saat startup:', err.message);
    console.warn('[Redis] Sistem akan berjalan tanpa cache Redis (fallback ke PostgreSQL).');
});

/**
 * Mengecek apakah Redis saat ini tersedia.
 */
export function isRedisConnected(): boolean {
    return isRedisAvailable && redisClient.status === 'ready';
}

/**
 * Mengambil nilai dari Redis cache.
 * Jika Redis tidak tersedia atau terjadi error, mengembalikan null
 * tanpa melempar error ke caller (graceful fallback).
 *
 * @param key — kunci cache
 * @returns nilai cache yang di-parse dari JSON, atau null jika tidak ada / Redis tidak tersedia
 */
export async function getCache<T = unknown>(key: string): Promise<T | null> {
    if (!isRedisConnected()) {
        return null;
    }

    try {
        const value = await redisClient.get(key);
        if (value === null) {
            return null;
        }
        return JSON.parse(value) as T;
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[Redis] Gagal mengambil cache untuk key "${key}":`, message);
        return null;
    }
}

/**
 * Menyimpan nilai ke Redis cache dengan TTL opsional.
 * Jika Redis tidak tersedia atau terjadi error, operasi diabaikan
 * tanpa melempar error ke caller (graceful fallback).
 *
 * @param key — kunci cache
 * @param value — nilai yang akan disimpan (akan di-serialize ke JSON)
 * @param ttlSeconds — Time-To-Live dalam detik (opsional)
 */
export async function setCache(
    key: string,
    value: unknown,
    ttlSeconds?: number
): Promise<void> {
    if (!isRedisConnected()) {
        return;
    }

    try {
        const serialized = JSON.stringify(value);
        if (ttlSeconds !== undefined && ttlSeconds > 0) {
            await redisClient.setex(key, ttlSeconds, serialized);
        } else {
            await redisClient.set(key, serialized);
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[Redis] Gagal menyimpan cache untuk key "${key}":`, message);
        // Tidak throw — caller tidak perlu tahu bahwa cache gagal
    }
}

/**
 * Menghapus nilai dari Redis cache.
 * Jika Redis tidak tersedia atau terjadi error, operasi diabaikan
 * tanpa melempar error ke caller (graceful fallback).
 *
 * @param key — kunci cache yang akan dihapus
 */
export async function deleteCache(key: string): Promise<void> {
    if (!isRedisConnected()) {
        return;
    }

    try {
        await redisClient.del(key);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[Redis] Gagal menghapus cache untuk key "${key}":`, message);
        // Tidak throw — caller tidak perlu tahu bahwa cache gagal
    }
}

/**
 * Menghapus beberapa kunci cache sekaligus menggunakan pattern.
 * Berguna untuk invalidasi cache yang terkait (misalnya semua sesi user).
 * Jika Redis tidak tersedia, operasi diabaikan secara graceful.
 *
 * @param pattern — pola kunci Redis (contoh: "session:userId:*")
 */
export async function deleteCacheByPattern(pattern: string): Promise<void> {
    if (!isRedisConnected()) {
        return;
    }

    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(...keys);
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[Redis] Gagal menghapus cache dengan pattern "${pattern}":`, message);
    }
}
