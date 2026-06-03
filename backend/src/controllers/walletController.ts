import { Request, Response, NextFunction } from 'express';
import * as walletService from '../services/walletService';

export async function getBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { userId } = req.user!;
        const balance = await walletService.getBalance(userId);
        res.json({ success: true, data: balance });
    } catch (err) {
        next(err);
    }
}

export async function getTransactionHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { userId } = req.user!;
        const { page, limit } = req.query;
        const result = await walletService.getTransactionHistory(userId, page, limit);
        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
}

export async function getLedgerEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { userId } = req.user!;
        const { page, limit } = req.query;
        const result = await walletService.getLedgerEntries(userId, page, limit);
        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
}
