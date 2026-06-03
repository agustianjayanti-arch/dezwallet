import { Request, Response, NextFunction } from 'express';
import * as requestService from '../services/requestService';

export async function createMoneyRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { userId } = req.user!;
        const { targetId, amount, notes } = req.body;
        const result = await requestService.createMoneyRequest(userId, targetId, Number(amount), notes);
        res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
}

export async function approveMoneyRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { userId } = req.user!;
        const { id } = req.params;
        const { pin } = req.body;
        const result = await requestService.approveMoneyRequest(userId, id, pin);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
}

export async function rejectMoneyRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { userId } = req.user!;
        const { id } = req.params;
        const result = await requestService.rejectMoneyRequest(userId, id);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
}

export async function getMoneyRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { userId } = req.user!;
        const { page, limit, type } = req.query;
        const result = await requestService.getMoneyRequests(userId, (type as 'sent' | 'received' | 'all') ?? 'all', page, limit);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
}
