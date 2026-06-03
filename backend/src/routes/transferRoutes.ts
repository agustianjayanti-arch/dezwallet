import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as transferController from '../controllers/transferController';

const router = Router();

router.post('/', authenticate, transferController.initiateTransfer);
router.get('/', authenticate, transferController.getTransferHistory);
router.get('/:id', authenticate, transferController.getTransferStatus);

export default router;
