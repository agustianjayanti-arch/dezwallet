/**
 * Memvalidasi format email.
 * Requirement 1.6: format email harus valid sebelum disimpan.
 */
export function isValidEmail(str: string): boolean {
    // RFC 5322 simplified — harus ada local part, @, dan domain dengan TLD
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(str.trim());
}

/**
 * Memvalidasi panjang password.
 * Requirement 1.5: password minimal 8 karakter.
 */
export function isValidPassword(str: string): boolean {
    return typeof str === 'string' && str.length >= 8;
}

/**
 * Memvalidasi format Transaction PIN.
 * Requirement 13.1: PIN harus berupa 6 digit angka.
 */
export function isValidPin(str: string): boolean {
    return /^\d{6}$/.test(str);
}

/**
 * Memvalidasi jumlah transaksi.
 * @param n - jumlah dalam IDR
 * @param min - minimum (default 1)
 * @param max - maksimum (default tidak terbatas)
 */
export function isValidAmount(n: number, min = 1, max = Infinity): boolean {
    return typeof n === 'number' && isFinite(n) && n >= min && n <= max;
}

/**
 * Memvalidasi jumlah top up.
 * Requirement 5.6: minimum Rp10.000, maksimum Rp10.000.000.
 */
export function isValidTopUpAmount(n: number): boolean {
    return isValidAmount(n, 10_000, 10_000_000);
}
