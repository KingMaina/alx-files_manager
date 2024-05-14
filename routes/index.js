import { Router } from 'express';
import AppController from '../controllers/AppController';
import AuthController from '../controllers/AuthController';
import UsersController from '../controllers/UsersController';

const router = Router();

// Admininstration
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

// Auth
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);

// Users
router.post('/users', UsersController.postNew);
router.get('/users/me', UsersController.getMe);
export default router;
