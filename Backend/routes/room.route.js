import express from 'express';
import {
    getRooms,
    getRoomById,
    createRoom,
    updateRoom,
    deleteRoom
} from '../controllers/room.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', verifyToken, getRooms);
router.get('/:id', verifyToken, getRoomById);

// AC 2: Cán bộ giáo vụ (OFFICER) và ADMIN được phép Tạo, Cập nhật, Xóa Phòng học (kiểm tra capacity > 0)
router.post('/', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), createRoom);
router.put('/:id', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), updateRoom);
router.delete('/:id', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), deleteRoom);

export default router;
