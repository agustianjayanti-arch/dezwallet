import { isRedisConnected, redisClient, deleteCacheByPattern } from '../config/redis';

const SESSION_TTL = 24 * 60 * 60; // 24 jam dalam detik

/**
 * Repository untuk manajemen sesi pengguna di Redis.
 * Requirement 2.3: sesi dicabut segera setelah logout/ganti password.
 */

/**
 * Membuat sesi baru di Redis.
 * @param userId - ID pengguna
 * @param sessionId - ID sesi unik (dari JWT payload)
 * @param ttl - Time-To-Live dalam detik (default 24 jam)
 */
export async function createSession(
    userId: string,
    sessionId: string,
    ttl: number = SESSION_TTL
): Promise<void> {
    if (!isRedisConnected()) return;

    const key = `session:${userId}:${sessionId}`;
    await redisClient.setex(key, ttl, '1');
}

/**
 * Mengecek apakah sesi masih aktif.
 * @returns true jika sesi ada dan aktif
 */
export async function sessionExists(userId: string, sessionId: string): Promise<boolean> {
    if (!isRedisConnected()) return true; // graceful degradation

    const key = `session:${userId}:${sessionId}`;
    const exists = await redisClient.exists(key);
    return exists === 1;
}

/**
 * Menghapus satu sesi (logout).
 */
export async function deleteSession(userId: string, sessionId: string): Promise<void> {
    if (!isRedisConnected()) return;

    const key = `session:${userId}:${sessionId}`;
    await redisClient.del(key);
}

/**
 * Menghapus semua sesi aktif milik seorang pengguna.
 * Digunakan saat ganti password (Requirement 2.5).
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
    if (!isRedisConnected()) return;

    await deleteCacheByPattern(`session:${userId}:*`);
}
