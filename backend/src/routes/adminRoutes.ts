import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';
import { authLimiter } from '../middleware/rateLimiter';
import * as adminController from '../controllers/adminController';

const router = Router();

router.post('/login', authLimiter, adminController.login);

// Semua endpoint di bawah memerlukan autentikasi admin
router.use(authenticate, requireAdmin);

router.get('/users', adminController.listUsers);
router.get('/users/:id', adminController.getUserDetail);
router.put('/users/:id/freeze', adminController.freezeAccount);
router.put('/users/:id/unfreeze', adminController.unfreezeAccount);
router.get('/transactions', adminController.listAllTransactions);
router.get('/transactions/:id', adminController.getTransactionDetail);
router.get('/stats', adminController.getPlatformStats);
router.get('/audit-logs', adminController.getAuditLogs);
router.post('/notifications', adminController.sendNotification);

export default router;
