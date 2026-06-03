import { Request, Response, NextFunction } from 'express';
import * as ledgerService from '../services/ledgerService';

export async function getEntriesByTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { txId } = req.params;
        const entries = await ledgerService.getLedgerEntriesByTransaction(txId);
        res.json({ success: true, data: { entries } });
    } catch (err) {
        next(err);
    }
}

export async function getAccountBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { accountId } = req.params;
        const balance = await ledgerService.getAccountBalance(accountId);
        res.json({ success: true, data: { balance } });
    } catch (err) {
        next(err);
    }
}
