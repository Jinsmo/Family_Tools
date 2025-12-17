import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import * as locationController from '../controllers/locationController';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// Reverse Geocoding
router.get('/regeo', locationController.regeo);

export default router;
