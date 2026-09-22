import express from 'express';
import {
    getLecturers,
    getLecturerById,
    createLecturer,
    updateLecturer,
    deleteLecturer
} from '../controllers/lecturer.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', verifyToken, getLecturers);
router.get('/:id', verifyToken, getLecturerById);

// AC: Cán bộ giáo vụ (OFFICER) và ADMIN được phép Khởi tạo, Cập nhật, Xóa hồ sơ Giảng viên
router.post('/', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), createLecturer);
router.put('/:id', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), updateLecturer);
router.delete('/:id', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), deleteLecturer);

export default router;
