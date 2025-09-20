import express from 'express';
import { AuthController } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/api/register',AuthController.register);
router.post('/api/login',AuthController.login);
router.post('/api/auth/verify-email',AuthController.verifyEmailToken);

router.get('/api/profile',authMiddleware.authenticateToken,AuthController.getProfile);
router.post('/api/logout',authMiddleware.authenticateToken,AuthController.logout);
router.post('/api/refresh',authMiddleware.authenticateToken,AuthController.refreshToken);

export default router;