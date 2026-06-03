import request from 'supertest';
import { createApp } from '../../app';
import * as walletService from '../../services/walletService';
import * as redis from '../../config/redis';

// Mock the wallet service
jest.mock('../../services/walletService');

// Mock redis and database
jest.mock('../../config/redis');
jest.mock('../../config/database');

describe('Wallet Controller - Integration Tests', () => {
    const app = createApp();

    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';

    const mockBalance = {
        userId: 'user-123',
        balance: 500000,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockTransactionHistory = {
        data: [
            {
                id: 'txn-1',
                type: 'transfer',
                amount: 100000,
                status: 'completed',
                createdAt: new Date(),
            },
            {
                id: 'txn-2',
                type: 'topup',
                amount: 200000,
                status: 'completed',
                createdAt: new Date(),
            },
        ],
        pagination: {
            page: 1,
            limit: 10,
            total: 2,
        },
    };

    describe('GET /api/wallet/balance', () => {
        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should require authentication', async () => {
            const res = await request(app).get('/api/wallet/balance');

            expect(res.status).toBe(401);
        });

        it('should return user balance when authenticated', async () => {
            (walletService.getBalance as jest.Mock).mockResolvedValueOnce(
                mockBalance
            );

            const res = await request(app)
                .get('/api/wallet/balance')
                .set('Authorization', `Bearer ${mockToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual(mockBalance);
            expect(walletService.getBalance).toHaveBeenCalledWith('user-123');
        });

        it('should handle wallet not found error', async () => {
            (walletService.getBalance as jest.Mock).mockRejectedValueOnce(
                new Error('Wallet tidak ditemukan')
            );

            const res = await request(app)
                .get('/api/wallet/balance')
                .set('Authorization', `Bearer ${mockToken}`);

            expect(res.status).toBe(404);
        });
    });

    describe('GET /api/wallet/transactions', () => {
        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should require authentication', async () => {
            const res = await request(app).get('/api/wallet/transactions');

            expect(res.status).toBe(401);
        });

        it('should return transaction history when authenticated', async () => {
            (walletService.getTransactionHistory as jest.Mock).mockResolvedValueOnce(
                mockTransactionHistory
            );

            const res = await request(app)
                .get('/api/wallet/transactions?page=1&limit=10')
                .set('Authorization', `Bearer ${mockToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual(mockTransactionHistory);
            expect(walletService.getTransactionHistory).toHaveBeenCalledWith(
                'user-123',
                '1',
                '10'
            );
        });

        it('should use default pagination if not provided', async () => {
            (walletService.getTransactionHistory as jest.Mock).mockResolvedValueOnce(
                mockTransactionHistory
            );

            const res = await request(app)
                .get('/api/wallet/transactions')
                .set('Authorization', `Bearer ${mockToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(walletService.getTransactionHistory).toHaveBeenCalled();
        });

        it('should handle invalid page number', async () => {
            (walletService.getTransactionHistory as jest.Mock).mockRejectedValueOnce(
                new Error('Page harus berupa angka positif')
            );

            const res = await request(app)
                .get('/api/wallet/transactions?page=-1')
                .set('Authorization', `Bearer ${mockToken}`);

            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/wallet/ledger', () => {
        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should require authentication', async () => {
            const res = await request(app).get('/api/wallet/ledger');

            expect(res.status).toBe(401);
        });

        it('should return ledger entries when authenticated', async () => {
            const mockLedger = {
                data: [
                    {
                        id: 'ledger-1',
                        debit: 0,
                        credit: 100000,
                        balance: 500000,
                        description: 'Topup via transfer bank',
                        createdAt: new Date(),
                    },
                ],
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 1,
                },
            };

            (walletService.getLedgerEntries as jest.Mock).mockResolvedValueOnce(
                mockLedger
            );

            const res = await request(app)
                .get('/api/wallet/ledger?page=1&limit=10')
                .set('Authorization', `Bearer ${mockToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual(mockLedger);
        });
    });
});
