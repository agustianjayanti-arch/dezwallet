import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authLimiter } from '../middleware/rateLimiter';
import * as authController from '../controllers/authController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autentikasi dan manajemen akun
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Daftar akun baru
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: "Budi Santoso" }
 *               email: { type: string, format: email, example: "budi@example.com" }
 *               password: { type: string, minLength: 8, example: "password123" }
 *     responses:
 *       201: { description: Akun berhasil dibuat }
 *       400: { description: Input tidak valid }
 *       409: { description: Email sudah terdaftar }
 */
router.post('/register', authLimiter, authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login dan dapatkan JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login berhasil, token JWT dikembalikan }
 *       401: { description: Kredensial salah }
 *       403: { description: Akun dibekukan }
 */
router.post('/login', authLimiter, authController.login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout dan cabut sesi
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Logout berhasil }
 *       401: { description: Token tidak valid }
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @swagger
 * /api/auth/password:
 *   put:
 *     tags: [Auth]
 *     summary: Ubah password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200: { description: Password berhasil diubah }
 *       401: { description: Password lama salah }
 */
router.put('/password', authenticate, authController.changePassword);

/**
 * @swagger
 * /api/auth/pin:
 *   post:
 *     tags: [Auth]
 *     summary: Buat PIN transaksi
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pin]
 *             properties:
 *               pin: { type: string, pattern: "^\\d{6}$", example: "123456" }
 *     responses:
 *       201: { description: PIN berhasil dibuat }
 *       409: { description: PIN sudah ada }
 */
router.post('/pin', authenticate, authController.createPin);

/**
 * @swagger
 * /api/auth/pin:
 *   put:
 *     tags: [Auth]
 *     summary: Ubah PIN transaksi
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPin, newPin, password]
 *             properties:
 *               oldPin: { type: string, pattern: "^\\d{6}$" }
 *               newPin: { type: string, pattern: "^\\d{6}$" }
 *               password: { type: string }
 *     responses:
 *       200: { description: PIN berhasil diubah }
 *       401: { description: PIN lama atau password salah }
 */
router.put('/pin', authenticate, authController.changePin);

export default router;
