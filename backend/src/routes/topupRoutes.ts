import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';
import * as topupController from '../controllers/topupController';

const router = Router();

router.post('/', authenticate, topupController.submitTopUp);
router.get('/', authenticate, topupController.getTopUpHistory);
router.get('/pending', authenticate, requireAdmin, topupController.getAllPending);
router.put('/:id/approve', authenticate, requireAdmin, topupController.approveTopUp);
router.put('/:id/reject', authenticate, requireAdmin, topupController.rejectTopUp);

export default router;
