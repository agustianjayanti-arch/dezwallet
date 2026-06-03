import { v4 as uuidv4 } from 'uuid';
import { getClient } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import * as userRepo from '../repositories/userRepository';
import * as sessionRepo from '../repositories/sessionRepository';
import { hashPassword, compareHash } from '../utils/hash';
import { signToken } from '../utils/jwt';
import { isValidEmail, isValidPassword, isValidPin } from '../utils/validators';
import { UserStatus } from '../types/user';



const PIN_MAX_ATTEMPTS = 5;
const PIN_LOCK_MINUTES = 30;

/**
 * Mendaftarkan pengguna baru.
 * Requirement 1.1–1.6: validasi input, hash password, buat user + wallet + ledger_account atomik.
 */
export async function register(
    name: string,
    email: string,
    password: string
): Promise<{ user: { id: string; name: string; email: string }; token: string }> {
    // Validasi input
    if (!name?.trim()) throw AppError.badRequest('Nama lengkap wajib diisi.');
    if (!isValidEmail(email)) throw AppError.badRequest('Format email tidak valid.');
    if (!isValidPassword(password)) throw AppError.badRequest('Password minimal 8 karakter.');

    // Cek duplikasi email
    const existing = await userRepo.findUserByEmail(email);
    if (existing) throw new AppError('Email sudah terdaftar.', 409, 'EMAIL_ALREADY_EXISTS');

    const passwordHash = await hashPassword(password);
    const client = await getClient();

    try {
        await client.query('BEGIN');

        // Buat user
        const user = await userRepo.createUser({ name: name.trim(), email: email.toLowerCase(), passwordHash }, client);

        // Buat wallet dengan saldo 0
        await client.query(
            `INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0, 'IDR')`,
            [user.id]
        );

        // Buat ledger account untuk user
        await client.query(
            `INSERT INTO ledger_accounts (user_id, account_type, name) VALUES ($1, 'user', $2)`,
            [user.id, `User Account: ${user.email}`]
        );

        await client.query('COMMIT');

        // Buat sesi dan JWT
        const sessionId = uuidv4();
        const token = signToken({ userId: user.id, sessionId, role: 'user' });
        await sessionRepo.createSession(user.id, sessionId);

        return {
            user: { id: user.id, name: user.name, email: user.email },
            token,
        };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Login pengguna.
 * Requirement 2.1–2.6: validasi kredensial, cek status frozen, buat JWT 24 jam.
 */
export async function login(
    email: string,
    password: string
): Promise<{ user: { id: string; name: string; email: string }; token: string }> {
    const user = await userRepo.findUserByEmail(email.toLowerCase());

    // Requirement 2.2: jangan ungkap field mana yang salah
    if (!user) throw AppError.unauthorized('Email atau password salah.');

    // Requirement 2.6: akun frozen → HTTP 403
    if (user.status === UserStatus.FROZEN) {
        throw AppError.forbidden('Akun Anda telah dibekukan. Hubungi admin untuk informasi lebih lanjut.', 'ACCOUNT_FROZEN');
    }

    const passwordMatch = await compareHash(password, user.password_hash);
    if (!passwordMatch) throw AppError.unauthorized('Email atau password salah.');

    const sessionId = uuidv4();
    const token = signToken({ userId: user.id, sessionId, role: 'user' });
    await sessionRepo.createSession(user.id, sessionId);

    return {
        user: { id: user.id, name: user.name, email: user.email },
        token,
    };
}

/**
 * Logout — cabut sesi aktif.
 * Requirement 2.4: JWT tidak dapat digunakan kembali setelah logout.
 */
export async function logout(userId: string, sessionId: string): Promise<void> {
    await sessionRepo.deleteSession(userId, sessionId);
}

/**
 * Ganti password.
 * Requirement 2.5: verifikasi password lama, hash baru, revoke semua sesi.
 */
export async function changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
): Promise<void> {
    if (!isValidPassword(newPassword)) throw AppError.badRequest('Password baru minimal 8 karakter.');

    const user = await userRepo.findUserById(userId);
    if (!user) throw AppError.notFound('Pengguna tidak ditemukan.');

    const match = await compareHash(oldPassword, user.password_hash);
    if (!match) throw AppError.unauthorized('Password lama tidak sesuai.');

    const newHash = await hashPassword(newPassword);
    await userRepo.updatePasswordHash(userId, newHash);

    // Revoke semua sesi aktif
    await sessionRepo.deleteAllUserSessions(userId);
}

/**
 * Membuat Transaction PIN baru.
 * Requirement 13.1: PIN 6 digit, di-hash dengan bcrypt.
 */
export async function createTransactionPin(userId: string, pin: string): Promise<void> {
    if (!isValidPin(pin)) throw AppError.badRequest('PIN harus berupa 6 digit angka.');

    const user = await userRepo.findUserById(userId);
    if (!user) throw AppError.notFound('Pengguna tidak ditemukan.');

    if (user.transaction_pin_hash) {
        throw new AppError('PIN transaksi sudah dibuat. Gunakan endpoint ubah PIN.', 409, 'PIN_ALREADY_EXISTS');
    }

    const pinHash = await hashPassword(pin);
    await userRepo.updatePinHash(userId, pinHash);
}

/**
 * Memverifikasi Transaction PIN.
 * Requirement 13.2: blokir 30 menit setelah 5 kali salah.
 * @returns true jika PIN benar
 * @throws AppError jika PIN salah atau akun terkunci
 */
export async function verifyTransactionPin(userId: string, pin: string): Promise<boolean> {
    const user = await userRepo.findUserById(userId);
    if (!user) throw AppError.notFound('Pengguna tidak ditemukan.');

    // Requirement 13.5: user belum buat PIN
    if (!user.transaction_pin_hash) {
        throw AppError.forbidden('Anda belum membuat PIN transaksi. Buat PIN terlebih dahulu.', 'PIN_NOT_SET');
    }

    // Cek apakah PIN sedang terkunci
    if (user.pin_locked_until && new Date() < new Date(user.pin_locked_until)) {
        const unlockAt = new Date(user.pin_locked_until).toISOString();
        throw AppError.forbidden(
            `PIN transaksi terkunci hingga ${unlockAt}. Silakan coba lagi nanti.`,
            'PIN_LOCKED'
        );
    }

    const match = await compareHash(pin, user.transaction_pin_hash);

    if (!match) {
        const attempts = await userRepo.incrementPinAttempts(userId);

        if (attempts >= PIN_MAX_ATTEMPTS) {
            const lockedUntil = new Date(Date.now() + PIN_LOCK_MINUTES * 60 * 1000);
            await userRepo.setPinLock(userId, lockedUntil);
            // Log ke audit (akan diimplementasikan di auditService)
            throw AppError.forbidden(
                `PIN salah ${PIN_MAX_ATTEMPTS} kali. Transaksi diblokir selama ${PIN_LOCK_MINUTES} menit.`,
                'PIN_LOCKED'
            );
        }

        throw AppError.unauthorized(`PIN transaksi salah. Sisa percobaan: ${PIN_MAX_ATTEMPTS - attempts}.`);
    }

    // PIN benar — reset counter
    await userRepo.resetPinAttempts(userId);
    return true;
}

/**
 * Mengubah Transaction PIN.
 * Requirement 13.3: verifikasi PIN lama dan password akun.
 */
export async function changeTransactionPin(
    userId: string,
    oldPin: string,
    newPin: string,
    password: string
): Promise<void> {
    if (!isValidPin(newPin)) throw AppError.badRequest('PIN baru harus berupa 6 digit angka.');

    const user = await userRepo.findUserById(userId);
    if (!user) throw AppError.notFound('Pengguna tidak ditemukan.');

    // Verifikasi password akun
    const passwordMatch = await compareHash(password, user.password_hash);
    if (!passwordMatch) throw AppError.unauthorized('Password akun tidak sesuai.');

    // Verifikasi PIN lama
    if (!user.transaction_pin_hash) throw AppError.forbidden('PIN transaksi belum dibuat.', 'PIN_NOT_SET');
    const pinMatch = await compareHash(oldPin, user.transaction_pin_hash);
    if (!pinMatch) throw AppError.unauthorized('PIN lama tidak sesuai.');

    const newPinHash = await hashPassword(newPin);
    await userRepo.updatePinHash(userId, newPinHash);
}

/**
 * Revoke semua sesi aktif pengguna.
 */
export async function revokeAllSessions(userId: string): Promise<void> {
    await sessionRepo.deleteAllUserSessions(userId);
}
