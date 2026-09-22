import express from 'express';
import {
    getSemesters,
    getSemesterById,
    createSemester,
    updateSemester,
    deleteSemester
} from '../controllers/semester.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', verifyToken, getSemesters);
router.get('/:id', verifyToken, getSemesterById);

// AC 1: Cán bộ giáo vụ (OFFICER) và ADMIN được phép Tạo, Cập nhật, Xóa Học kỳ (kiểm tra end_date > start_date)
router.post('/', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), createSemester);
router.put('/:id', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), updateSemester);
router.delete('/:id', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), deleteSemester);

export default router;
