import { Request, Response, NextFunction } from 'express';
import * as adminService from '../services/adminService';
import * as auditService from '../services/auditService';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { email, password } = req.body;
        const result = await adminService.loginAdmin(email, password);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
}

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { search, page, limit } = req.query;
        const result = await adminService.listUsers(search as string ?? null, page, limit);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
}

export async function getUserDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { id } = req.params;
        const result = await adminService.getUserDetail(id);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
}

export async function freezeAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { userId } = req.user!;
        const { id } = req.params;
        await adminService.freezeAccount(userId, id, req.ip ?? null);
        res.json({ success: true, data: { message: 'Akun berhasil dibekukan.' } });
    } catch (err) { next(err); }
}

export async function unfreezeAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { userId } = req.user!;
        const { id } = req.params;
        await adminService.unfreezeAccount(userId, id, req.ip ?? null);
        res.json({ success: true, data: { message: 'Akun berhasil diaktifkan kembali.' } });
    } catch (err) { next(err); }
}

export async function listAllTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { type, status, startDate, endDate, userId, page, limit } = req.query;
        const result = await adminService.listAllTransactions({
            type: type as string, status: status as string,
            startDate: startDate as string, endDate: endDate as string,
            userId: userId as string, page, limit,
        });
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
}

export async function getTransactionDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { id } = req.params;
        const result = await adminService.getTransactionDetail(id);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
}

export async function getPlatformStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const result = await adminService.getPlatformStats();
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
}

export async function getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { action, actorId, startDate, endDate, page, limit } = req.query;
        const result = await auditService.getAuditLogs({
            action: action as string, actorId: actorId as string,
            startDate: startDate as string, endDate: endDate as string,
            page, limit,
        });
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
}

/**
 * Kirim notifikasi manual dari admin ke satu user atau semua user aktif.
 * Body: { userId?, title, message, broadcast? }
 */
export async function sendNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { userId, title, message, broadcast } = req.body;

        if (!title?.trim() || !message?.trim()) {
            res.status(400).json({
                success: false,
                error: { code: 'BAD_REQUEST', message: 'title dan message wajib diisi.', details: {} },
            });
            return;
        }

        const payload = { title, message, sentByAdmin: true };
        const { pool } = await import('../config/database');
        const notifService = await import('../services/notificationService');

        if (broadcast) {
            // Broadcast ke semua user aktif
            const { rows } = await pool.query(`SELECT id FROM users WHERE status = 'active'`);
            for (const row of rows) {
                await notifService.createNotification(row.id, 'admin_broadcast', payload);
            }
            res.json({
                success: true,
                data: { sent: rows.length, message: `Notifikasi dikirim ke ${rows.length} pengguna.` },
            });
        } else {
            if (!userId) {
                res.status(400).json({
                    success: false,
                    error: { code: 'BAD_REQUEST', message: 'userId wajib diisi jika bukan broadcast.', details: {} },
                });
                return;
            }
            await notifService.createNotification(userId, 'admin_message', payload);
            res.json({ success: true, data: { message: 'Notifikasi berhasil dikirim.' } });
        }
    } catch (err) {
        next(err);
    }
}
