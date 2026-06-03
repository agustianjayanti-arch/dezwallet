import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as walletController from '../controllers/walletController';

const router = Router();

router.get('/balance', authenticate, walletController.getBalance);
router.get('/transactions', authenticate, walletController.getTransactionHistory);
router.get('/ledger', authenticate, walletController.getLedgerEntries);

export default router;
