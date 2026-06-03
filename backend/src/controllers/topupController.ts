import { Request, Response, NextFunction } from 'express';
import * as topupService from '../services/topupService';

export async function submitTopUp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { userId } = req.user!;
        const { amount, proofUrl } = req.body;
        const result = await topupService.submitTopUp(userId, Number(amount), proofUrl);
        res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
}

export async function approveTopUp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { userId } = req.user!;
        const { id } = req.params;
        const result = await topupService.approveTopUp(userId, id, req.ip ?? null);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
}

export async function rejectTopUp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { userId } = req.user!;
        const { id } = req.params;
        const { reason } = req.body;
        const result = await topupService.rejectTopUp(userId, id, reason ?? '', req.ip ?? null);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
}

export async function getTopUpHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { userId } = req.user!;
        const { page, limit } = req.query;
        const result = await topupService.getTopUpHistory(userId, page, limit);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
}

export async function getAllPending(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { page, limit } = req.query;
        const result = await topupService.getAllPendingTopUps(page, limit);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
}
