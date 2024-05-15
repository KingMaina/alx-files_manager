import { Router } from 'express';
import AppController from '../controllers/AppController';
import AuthController from '../controllers/AuthController';
import UsersController from '../controllers/UsersController';
import FilesController from '../controllers/FilesController';

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

// Files
router.get('/files', FilesController.getIndex);
router.post('/files', FilesController.postUpload);
router.get('/files/:id', FilesController.getShow);
router.put('/files/:id/publish', FilesController.putPublish);
router.put('/files/:id/unpublish', FilesController.putUnpublish);

export default router;
