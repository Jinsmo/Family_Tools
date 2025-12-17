import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import {
  getWishlist,
  getWishlistItem,
  createWishlist,
  updateWishlist,
  deleteWishlist
} from '../controllers/wishlistController';

const router = express.Router();

// 所有接口都需要登录
router.use(authenticateToken);

router.get('/', getWishlist);
router.get('/:id', getWishlistItem);
router.post('/', createWishlist);
router.put('/:id', updateWishlist);
router.delete('/:id', deleteWishlist);

export default router;
