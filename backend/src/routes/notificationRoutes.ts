import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as notificationController from '../controllers/notificationController';

const router = Router();

router.get('/', authenticate, notificationController.getNotifications);
router.put('/read-all', authenticate, notificationController.markAllAsRead);
router.put('/:id/read', authenticate, notificationController.markAsRead);

export default router;
