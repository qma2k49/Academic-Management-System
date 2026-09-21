import express from 'express';
import { createPrerequisite, getPrerequisites, deletePrerequisite } from '../controllers/prerequisite.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', verifyToken, getPrerequisites);

// AC 1 & AC 2: Cán bộ giáo vụ (OFFICER) và ADMIN được phép Cấu hình & Xóa điều kiện môn tiên quyết
router.post('/', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), createPrerequisite);
router.delete('/:id', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), deletePrerequisite);

export default router;
