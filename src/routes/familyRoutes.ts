import { Router } from 'express';
import { familyController } from '../controllers/familyController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// 所有家庭接口都需要认证
router.use(authenticateToken);

router.get('/', familyController.getFamilyList);
router.post('/custom-call', familyController.updateCustomCall);
router.get('/search', familyController.searchUser);
router.post('/relation', familyController.addRelation);

export default router;
