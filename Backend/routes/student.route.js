import express from 'express';
import multer from 'multer';
import {
    getStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
    importStudentsFromExcel
} from '../controllers/student.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = express.Router();

router.get('/', verifyToken, getStudents);
router.get('/:id', verifyToken, getStudentById);

// AC 1 & AC 2: Cán bộ giáo vụ (OFFICER) và ADMIN tải tệp Excel nhập danh sách 1.000 sinh viên < 5s & nhận báo lỗi từng dòng
router.post('/import-excel', upload.single('file'), verifyToken, authorizeRoles('ADMIN', 'OFFICER'), importStudentsFromExcel);

router.post('/', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), createStudent);
router.put('/:id', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), updateStudent);
router.delete('/:id', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), deleteStudent);

export default router;
