import { Request, Response, NextFunction } from 'express';
import * as notificationService from '../services/notificationService';

export async function getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { userId } = req.user!;
        const { page, limit } = req.query;
        const result = await notificationService.getNotifications(userId, page, limit);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { userId } = req.user!;
        const { id } = req.params;
        await notificationService.markAsRead(userId, id);
        res.json({ success: true, data: { message: 'Notifikasi ditandai sebagai dibaca.' } });
    } catch (err) { next(err); }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { userId } = req.user!;
        await notificationService.markAllAsRead(userId);
        res.json({ success: true, data: { message: 'Semua notifikasi ditandai sebagai dibaca.' } });
    } catch (err) { next(err); }
}
