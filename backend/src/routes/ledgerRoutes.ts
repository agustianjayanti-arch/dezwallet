import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as ledgerController from '../controllers/ledgerController';

const router = Router();

router.get('/transactions/:txId', authenticate, ledgerController.getEntriesByTransaction);
router.get('/accounts/:accountId/balance', authenticate, ledgerController.getAccountBalance);

export default router;
