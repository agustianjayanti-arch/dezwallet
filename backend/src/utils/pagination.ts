/**
 * Hasil kalkulasi pagination.
 */
export interface PaginationParams {
    limit: number;
    offset: number;
    page: number;
}

/**
 * Menghitung limit dan offset dari parameter page/limit.
 * @param page - halaman (1-indexed, default 1)
 * @param limit - jumlah item per halaman (default 20, max 100)
 */
export function getPagination(
    page: unknown,
    limit: unknown
): PaginationParams {
    const parsedPage = Math.max(1, parseInt(String(page ?? '1'), 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(String(limit ?? '20'), 10) || 20));
    const offset = (parsedPage - 1) * parsedLimit;

    return { limit: parsedLimit, offset, page: parsedPage };
}

/**
 * Membuat metadata pagination untuk respons API.
 */
export function buildPaginationMeta(
    total: number,
    page: number,
    limit: number
): { total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrev: boolean } {
    const totalPages = Math.ceil(total / limit);
    return {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
}
