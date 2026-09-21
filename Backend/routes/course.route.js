import express from 'express';
import { getCourses, getCourseById, createCourse, updateCourse, deleteCourse } from '../controllers/course.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', verifyToken, getCourses);
router.get('/:id', verifyToken, getCourseById);

// Cán bộ giáo vụ (OFFICER) và ADMIN được phép Thêm, Sửa, Xóa Môn học (AC 1 & AC 2)
router.post('/', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), createCourse);
router.put('/:id', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), updateCourse);
router.delete('/:id', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), deleteCourse);

export default router;
