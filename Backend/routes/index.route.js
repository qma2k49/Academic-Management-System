import express from 'express';
import authRoutes from './auth.route.js';
import facultyRoutes from './faculty.route.js';
import majorRoutes from './major.route.js';
import courseRoutes from './course.route.js';
import prerequisiteRoutes from './prerequisite.route.js';
import curriculumCourseRoutes from './curriculum-course.route.js';
import lecturerRoutes from './lecturer.route.js';
import studentRoutes from './student.route.js';
import semesterRoutes from './semester.route.js';
import roomRoutes from './room.route.js';
import classSectionRoutes from './class-section.route.js';
import scheduleRoutes from './schedule.route.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/faculties', facultyRoutes);
router.use('/majors', majorRoutes);
router.use('/courses', courseRoutes);
router.use('/prerequisites', prerequisiteRoutes);
router.use('/curriculum-courses', curriculumCourseRoutes);
router.use('/lecturers', lecturerRoutes);
router.use('/students', studentRoutes);
router.use('/semesters', semesterRoutes);
router.use('/rooms', roomRoutes);
router.use('/class-sections', classSectionRoutes);
router.use('/schedules', scheduleRoutes);

export default router;
