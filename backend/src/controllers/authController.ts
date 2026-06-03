import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { name, email, password } = req.body;
        const result = await authService.register(name, email, password);
        res.status(201).json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { userId, sessionId } = req.user!;
        await authService.logout(userId, sessionId);
        res.json({ success: true, data: { message: 'Logout berhasil.' } });
    } catch (err) {
        next(err);
    }
}

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { userId } = req.user!;
        const { oldPassword, newPassword } = req.body;
        await authService.changePassword(userId, oldPassword, newPassword);
        res.json({ success: true, data: { message: 'Password berhasil diubah. Silakan login kembali.' } });
    } catch (err) {
        next(err);
    }
}

export async function createPin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { userId } = req.user!;
        const { pin } = req.body;
        await authService.createTransactionPin(userId, pin);
        res.status(201).json({ success: true, data: { message: 'PIN transaksi berhasil dibuat.' } });
    } catch (err) {
        next(err);
    }
}

export async function changePin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { userId } = req.user!;
        const { oldPin, newPin, password } = req.body;
        await authService.changeTransactionPin(userId, oldPin, newPin, password);
        res.json({ success: true, data: { message: 'PIN transaksi berhasil diubah.' } });
    } catch (err) {
        next(err);
    }
}
