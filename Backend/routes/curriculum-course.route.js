import express from 'express';
import {
    getCurriculumCourses,
    getCurriculumCourseById,
    createCurriculumCourse,
    updateCurriculumCourse,
    deleteCurriculumCourse
} from '../controllers/curriculum-course.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', verifyToken, getCurriculumCourses);
router.get('/:id', verifyToken, getCurriculumCourseById);

// AC 1 & AC 2: Cán bộ giáo vụ (OFFICER) và ADMIN được phép phân bổ, sửa, xóa môn học trong khung CTĐT
router.post('/', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), createCurriculumCourse);
router.put('/:id', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), updateCurriculumCourse);
router.delete('/:id', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), deleteCurriculumCourse);

export default router;
