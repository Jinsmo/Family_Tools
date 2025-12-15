import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/reset-password', authController.resetPassword);
router.get('/me', authenticateToken, authController.getProfile);
router.put('/me', authenticateToken, authController.updateProfile);

// Admin routes
router.get('/users', authenticateToken, requireAdmin, authController.getAllUsers);
router.put('/users/:id', authenticateToken, requireAdmin, authController.updateUserAdmin);

export default router;
