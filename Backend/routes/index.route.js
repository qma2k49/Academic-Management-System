import express from 'express';
import authRoutes from './auth.route.js';
import facultyRoutes from './faculty.route.js';
import majorRoutes from './major.route.js';
import courseRoutes from './course.route.js';
import prerequisiteRoutes from './prerequisite.route.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/faculties', facultyRoutes);
router.use('/majors', majorRoutes);
router.use('/courses', courseRoutes);
router.use('/prerequisites', prerequisiteRoutes);

export default router;
