import Course from '../models/course.model.js';
import Faculty from '../models/faculty.model.js';

// Get all courses
export const getCourses = async (req, res) => {
    try {
        const { search, faculty_id } = req.query;
        let query = {};
        if (faculty_id) query.faculty_id = faculty_id;
        if (search) {
            query.$or = [
                { course_code: { $regex: search, $options: 'i' } },
                { course_name: { $regex: search, $options: 'i' } }
            ];
        }
        const courses = await Course.find(query).populate('faculty_id', 'faculty_code faculty_name').sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            data: courses
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi lấy danh sách Môn học',
            error: error.message
        });
    }
};

// Get single course by ID
export const getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('faculty_id', 'faculty_code faculty_name');
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy Môn học'
            });
        }
        return res.status(200).json({
            success: true,
            data: course
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi lấy thông tin Môn học',
            error: error.message
        });
    }
};

// Create new course (AC 1 & AC 2)
export const createCourse = async (req, res) => {
    try {
        const { faculty_id, course_code, course_name, credits, theory_periods, practice_periods } = req.body;

        // Validation for missing required fields
        if (!faculty_id || !course_code || !course_name || credits === undefined || credits === null) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin môn học (Khoa, Mã môn, Tên môn, Số tín chỉ)'
            });
        }

        // AC 2: Check credits > 0
        const parsedCredits = Number(credits);
        if (isNaN(parsedCredits) || parsedCredits <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Số tín chỉ phải lớn hơn 0'
            });
        }

        // Check if faculty exists
        const facultyExists = await Faculty.findById(faculty_id);
        if (!facultyExists) {
            return res.status(404).json({
                success: false,
                message: 'Khoa được chọn không tồn tại trên hệ thống'
            });
        }

        // AC 1: Given thông tin môn học có mã môn đã tồn tại trên hệ thống, hệ thống từ chối lưu và hiển thị thông báo lỗi trùng mã môn.
        const normalizedCode = course_code.trim().toUpperCase();
        const existingCourse = await Course.findOne({ course_code: normalizedCode });
        if (existingCourse) {
            return res.status(400).json({
                success: false,
                message: 'Mã môn học đã tồn tại trên hệ thống'
            });
        }

        // AC 2: Given thông tin môn học mới hợp lệ (tên, mã, số tín chỉ > 0), môn học được lưu vào cơ sở dữ liệu và hiển thị trên bảng danh sách.
        const course = new Course({
            faculty_id,
            course_code: normalizedCode,
            course_name: course_name.trim(),
            credits: parsedCredits,
            theory_periods: theory_periods || 0,
            practice_periods: practice_periods || 0
        });

        await course.save();
        await course.populate('faculty_id', 'faculty_code faculty_name');

        return res.status(201).json({
            success: true,
            message: 'Tạo mới môn học thành công',
            data: course
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi tạo mới Môn học',
            error: error.message
        });
    }
};

// Update course
export const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { faculty_id, course_code, course_name, credits, theory_periods, practice_periods } = req.body;

        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy Môn học'
            });
        }

        if (credits !== undefined) {
            const parsedCredits = Number(credits);
            if (isNaN(parsedCredits) || parsedCredits <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Số tín chỉ phải lớn hơn 0'
                });
            }
            course.credits = parsedCredits;
        }

        if (faculty_id) {
            const facultyExists = await Faculty.findById(faculty_id);
            if (!facultyExists) {
                return res.status(404).json({
                    success: false,
                    message: 'Khoa được chọn không tồn tại'
                });
            }
            course.faculty_id = faculty_id;
        }

        if (course_code && course_code.trim().toUpperCase() !== course.course_code) {
            const normalizedCode = course_code.trim().toUpperCase();
            const existingCourse = await Course.findOne({ course_code: normalizedCode });
            if (existingCourse) {
                return res.status(400).json({
                    success: false,
                    message: 'Mã môn học đã tồn tại trên hệ thống'
                });
            }
            course.course_code = normalizedCode;
        }

        if (course_name) course.course_name = course_name.trim();
        if (theory_periods !== undefined) course.theory_periods = theory_periods;
        if (practice_periods !== undefined) course.practice_periods = practice_periods;

        await course.save();
        await course.populate('faculty_id', 'faculty_code faculty_name');

        return res.status(200).json({
            success: true,
            message: 'Cập nhật Môn học thành công',
            data: course
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi cập nhật Môn học',
            error: error.message
        });
    }
};

// Delete course
export const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findByIdAndDelete(id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy Môn học để xóa'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Xóa Môn học thành công'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi xóa Môn học',
            error: error.message
        });
    }
};
