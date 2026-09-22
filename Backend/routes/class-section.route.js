import express from 'express';
import {
    getClassSections,
    getClassSectionById,
    createClassSection,
    updateClassSection,
    deleteClassSection
} from '../controllers/class-section.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', verifyToken, getClassSections);
router.get('/:id', verifyToken, getClassSectionById);

// AC 1 & AC 2: Cán bộ giáo vụ (OFFICER) và ADMIN được phép Tạo, Cập nhật, Xóa Lớp học phần
router.post('/', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), createClassSection);
router.put('/:id', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), updateClassSection);
router.delete('/:id', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), deleteClassSection);

export default router;
