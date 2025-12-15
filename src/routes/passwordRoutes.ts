import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import * as passwordController from '../controllers/passwordController';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// Categories
router.get('/categories', passwordController.getCategories);
router.post('/categories', passwordController.createCategory);
router.put('/categories/:id', passwordController.updateCategory);
router.delete('/categories/:id', passwordController.deleteCategory);

// Entries
router.get('/entries', passwordController.getEntries);
router.post('/entries', passwordController.createEntry);
router.put('/entries/:id', passwordController.updateEntry);
router.delete('/entries/:id', passwordController.deleteEntry);
router.get('/entries/:id/password', passwordController.getEntryPassword);

export default router;
