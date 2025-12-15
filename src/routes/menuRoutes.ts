import express from 'express';
import { 
  getMenu, createOrder, getItemDetails, 
  getUserAddresses, addUserAddress, 
  getUserOrders, cancelOrder, getOrderDetails, updateOrderStatus,
  getCategories, createCategory, updateCategory, deleteCategory,
  getAdminItems, getAdminItemDetail, addMenuItem, updateMenuItem, deleteMenuItem, deleteMenuItemsBatch
} from '../controllers/menuController';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Public/User Routes
router.get('/list', authenticateToken, getMenu);
router.get('/item/:id/details', authenticateToken, getItemDetails);
router.post('/order', authenticateToken, createOrder);

// Order Management
router.get('/orders/list', authenticateToken, getUserOrders);
router.get('/orders/:id', authenticateToken, getOrderDetails);
router.post('/orders/cancel', authenticateToken, cancelOrder);
router.post('/orders/status', authenticateToken, updateOrderStatus);

// Address Routes
router.get('/address/list', authenticateToken, getUserAddresses);
router.post('/address/add', authenticateToken, addUserAddress);

// Admin - Category Management
router.get('/categories', authenticateToken, requireAdmin, getCategories);
router.post('/categories', authenticateToken, requireAdmin, createCategory);
router.put('/categories/:id', authenticateToken, requireAdmin, updateCategory);
router.delete('/categories/:id', authenticateToken, requireAdmin, deleteCategory);

// Admin - Menu Item Management
router.get('/admin/items', authenticateToken, requireAdmin, getAdminItems);
router.get('/admin/item/:id', authenticateToken, requireAdmin, getAdminItemDetail);
router.post('/items', authenticateToken, requireAdmin, addMenuItem);
router.post('/items/batch-delete', authenticateToken, requireAdmin, deleteMenuItemsBatch);
router.put('/items/:id', authenticateToken, requireAdmin, updateMenuItem);
router.delete('/items/:id', authenticateToken, requireAdmin, deleteMenuItem);

export default router;
