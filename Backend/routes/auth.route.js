import express from 'express';
import { login, refreshToken, logout, getMe } from '../controllers/auth.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

// AC 1: Endpoint Đăng nhập
router.post('/login', login);
router.post('/refresh', refreshToken);

// Protected Authentication Endpoints
router.post('/logout', verifyToken, logout);
router.get('/me', verifyToken, getMe);

// AC 2: API dành riêng cho Giáo vụ (OFFICER) và ADMIN - Sinh viên (STUDENT) truy cập sẽ bị chặn 403 Forbidden
router.get('/officer-only', verifyToken, authorizeRoles('ADMIN', 'OFFICER'), (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Access granted to Academic Officer portal',
        user: req.user
    });
});

export default router;
