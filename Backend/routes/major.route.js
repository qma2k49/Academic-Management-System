import express from 'express';
import { getMajors, getMajorById, createMajor, updateMajor, deleteMajor } from '../controllers/major.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', verifyToken, getMajors);
router.get('/:id', verifyToken, getMajorById);

// Cán bộ giáo vụ (OFFICER) và ADMIN được phép Thêm, Sửa, Xóa Ngành
router.post('/', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), createMajor);
router.put('/:id', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), updateMajor);
router.delete('/:id', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), deleteMajor);

export default router;
