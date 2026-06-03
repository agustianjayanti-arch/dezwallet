import { Request, Response, NextFunction } from 'express';
import * as qrService from '../services/qrService';

export async function generateQRCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { userId } = req.user!;
        const { amount } = req.body;
        const result = await qrService.generateQRCode(userId, Number(amount));
        res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
}

export async function processQRPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { userId } = req.user!;
        const { qrToken, pin } = req.body;
        const result = await qrService.processQRPayment(userId, qrToken, pin);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
}

export async function getQRStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { token } = req.params;
        const result = await qrService.getQRStatus(token);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
}
