import express from 'express';
import authRoutes from './auth.route.js';
import facultyRoutes from './faculty.route.js';
import majorRoutes from './major.route.js';
import courseRoutes from './course.route.js';
import prerequisiteRoutes from './prerequisite.route.js';
import curriculumCourseRoutes from './curriculum-course.route.js';
import lecturerRoutes from './lecturer.route.js';
import studentRoutes from './student.route.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/faculties', facultyRoutes);
router.use('/majors', majorRoutes);
router.use('/courses', courseRoutes);
router.use('/prerequisites', prerequisiteRoutes);
router.use('/curriculum-courses', curriculumCourseRoutes);
router.use('/lecturers', lecturerRoutes);
router.use('/students', studentRoutes);

export default router;
