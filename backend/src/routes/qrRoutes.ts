import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as qrController from '../controllers/qrController';

const router = Router();

router.post('/generate', authenticate, qrController.generateQRCode);
router.post('/pay', authenticate, qrController.processQRPayment);
router.get('/:token/status', authenticate, qrController.getQRStatus);

export default router;
