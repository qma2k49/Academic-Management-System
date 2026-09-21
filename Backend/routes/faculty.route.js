import express from 'express';
import { getFaculties, getFacultyById, createFaculty, updateFaculty, deleteFaculty } from '../controllers/faculty.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', verifyToken, getFaculties);
router.get('/:id', verifyToken, getFacultyById);

// Cán bộ giáo vụ (OFFICER) và ADMIN được phép Thêm, Sửa, Xóa Khoa
router.post('/', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), createFaculty);
router.put('/:id', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), updateFaculty);
router.delete('/:id', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), deleteFaculty);

export default router;
