import { Router } from 'express';
import AppController from '../controllers/AppController';
import AuthController from '../controllers/AuthController';

const router = Router();

// Admininstration
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

// Auth
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);

export default router;
