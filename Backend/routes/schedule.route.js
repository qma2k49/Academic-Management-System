import express from 'express';
import {
    getSchedules,
    getScheduleMatrix,
    getScheduleById,
    createSchedule,
    updateSchedule,
    deleteSchedule
} from '../controllers/schedule.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', verifyToken, getSchedules);
router.get('/matrix', verifyToken, getScheduleMatrix);
router.get('/:id', verifyToken, getScheduleById);

// AC: Cán bộ giáo vụ (OFFICER) và ADMIN được phép Gán, Cập nhật, Xóa Thời khóa biểu
router.post('/', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), createSchedule);
router.put('/:id', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), updateSchedule);
router.delete('/:id', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), deleteSchedule);

export default router;
