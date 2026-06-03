import { Request, Response, NextFunction } from 'express';
import * as transferService from '../services/transferService';

export async function initiateTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { userId } = req.user!;
        const { receiverId, amount, pin } = req.body;
        const ipAddress = req.ip ?? null;

        if (!receiverId) { res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'receiverId wajib diisi.', details: {} } }); return; }
        if (!amount || isNaN(Number(amount))) { res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'amount harus berupa angka positif.', details: {} } }); return; }
        if (!pin) { res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'pin wajib diisi.', details: {} } }); return; }

        const result = await transferService.initiateTransfer(userId, receiverId, Number(amount), pin, ipAddress);
        res.status(201).json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
}

export async function getTransferStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { id } = req.params;
        const transfer = await transferService.getTransferStatus(id);
        res.json({ success: true, data: transfer });
    } catch (err) {
        next(err);
    }
}

export async function getTransferHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { userId } = req.user!;
        const { page, limit } = req.query;
        const result = await transferService.getTransferHistory(userId, page, limit);
        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
}
