import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as requestController from '../controllers/requestController';

const router = Router();

router.post('/', authenticate, requestController.createMoneyRequest);
router.get('/', authenticate, requestController.getMoneyRequests);
router.put('/:id/approve', authenticate, requestController.approveMoneyRequest);
router.put('/:id/reject', authenticate, requestController.rejectMoneyRequest);

export default router;
