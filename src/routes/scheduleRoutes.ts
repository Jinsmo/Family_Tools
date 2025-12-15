import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';
import { 
  getSchedules, 
  createSchedule, 
  updateSchedule, 
  deleteSchedule 
} from '../controllers/scheduleController';

const router = express.Router();

// 所有路由都需要登录和管理员权限
router.use(authenticateToken);
router.use(requireAdmin);

// 获取日程列表
router.get('/', getSchedules);

// 创建日程
router.post('/', createSchedule);

// 更新日程
router.put('/:id', updateSchedule);

// 删除日程
router.delete('/:id', deleteSchedule);

export default router;
