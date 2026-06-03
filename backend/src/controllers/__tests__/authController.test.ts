import request from 'supertest';
import { createApp } from '../../app';
import * as authService from '../../services/authService';
import * as redis from '../../config/redis';

// Mock the auth service
jest.mock('../../services/authService');

// Mock redis and database
jest.mock('../../config/redis');
jest.mock('../../config/database');

describe('Auth Controller - Integration Tests', () => {
    const app = createApp();

    const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
    };

    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';

    describe('POST /api/auth/register', () => {
        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should register user successfully', async () => {
            const registerData = {
                name: 'New User',
                email: 'newuser@example.com',
                password: 'password123',
            };

            (authService.register as jest.Mock).mockResolvedValueOnce({
                user: mockUser,
                token: mockToken,
            });

            const res = await request(app)
                .post('/api/auth/register')
                .send(registerData);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user).toEqual(mockUser);
            expect(res.body.data.token).toBe(mockToken);
            expect(authService.register).toHaveBeenCalledWith(
                registerData.name,
                registerData.email,
                registerData.password
            );
        });

        it('should reject invalid email', async () => {
            const invalidData = {
                name: 'Test',
                email: 'invalid-email',
                password: 'password123',
            };

            (authService.register as jest.Mock).mockRejectedValueOnce(
                new Error('Email tidak valid')
            );

            const res = await request(app)
                .post('/api/auth/register')
                .send(invalidData);

            expect(res.status).toBe(400);
        });

        it('should reject short password', async () => {
            const invalidData = {
                name: 'Test',
                email: 'test@example.com',
                password: 'short',
            };

            (authService.register as jest.Mock).mockRejectedValueOnce(
                new Error('Password minimal 8 karakter')
            );

            const res = await request(app)
                .post('/api/auth/register')
                .send(invalidData);

            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/auth/login', () => {
        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should login user successfully', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'password123',
            };

            (authService.login as jest.Mock).mockResolvedValueOnce({
                user: mockUser,
                token: mockToken,
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user).toEqual(mockUser);
            expect(res.body.data.token).toBe(mockToken);
            expect(authService.login).toHaveBeenCalledWith(
                loginData.email,
                loginData.password
            );
        });

        it('should reject invalid credentials', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'wrongpassword',
            };

            (authService.login as jest.Mock).mockRejectedValueOnce(
                new Error('Email atau password salah')
            );

            const res = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(res.status).toBe(401);
        });

        it('should reject non-existent user', async () => {
            const loginData = {
                email: 'nonexistent@example.com',
                password: 'password123',
            };

            (authService.login as jest.Mock).mockRejectedValueOnce(
                new Error('User tidak ditemukan')
            );

            const res = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(res.status).toBe(401);
        });
    });

    describe('POST /api/auth/create-pin', () => {
        it('should require authentication', async () => {
            const res = await request(app)
                .post('/api/auth/create-pin')
                .send({ pin: '123456' });

            expect(res.status).toBe(401);
        });

        it('should validate PIN format', async () => {
            (authService.createTransactionPin as jest.Mock).mockRejectedValueOnce(
                new Error('PIN harus 6 digit angka')
            );

            const res = await request(app)
                .post('/api/auth/create-pin')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({ pin: 'invalid' });

            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/auth/logout', () => {
        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should require authentication', async () => {
            const res = await request(app).post('/api/auth/logout');

            expect(res.status).toBe(401);
        });

        it('should logout successfully when authenticated', async () => {
            (authService.logout as jest.Mock).mockResolvedValueOnce(undefined);

            const res = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${mockToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
