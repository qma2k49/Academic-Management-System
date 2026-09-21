import CurriculumCourse from '../models/curriculum-course.model.js';
import Major from '../models/major.model.js';
import Course from '../models/course.model.js';

// Get all curriculum courses (with filters for major_id, recommended_semester, course_type)
export const getCurriculumCourses = async (req, res) => {
    try {
        const { major_id, recommended_semester, course_type } = req.query;
        let query = {};
        if (major_id) query.major_id = major_id;
        if (recommended_semester) query.recommended_semester = Number(recommended_semester);
        if (course_type) query.course_type = course_type.toUpperCase();

        const curriculumCourses = await CurriculumCourse.find(query)
            .populate('major_id', 'major_code major_name total_required_credits')
            .populate({
                path: 'course_id',
                select: 'course_code course_name credits theory_periods practice_periods',
                populate: { path: 'faculty_id', select: 'faculty_code faculty_name' }
            })
            .sort({ recommended_semester: 1, createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: curriculumCourses
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi lấy danh sách khung chương trình đào tạo',
            error: error.message
        });
    }
};

// Get single curriculum course allocation by ID
export const getCurriculumCourseById = async (req, res) => {
    try {
        const curriculumCourse = await CurriculumCourse.findById(req.params.id)
            .populate('major_id', 'major_code major_name')
            .populate('course_id', 'course_code course_name credits');

        if (!curriculumCourse) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin phân bổ môn học trong CTĐT'
            });
        }

        return res.status(200).json({
            success: true,
            data: curriculumCourse
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi lấy thông tin phân bổ môn học',
            error: error.message
        });
    }
};

// Create curriculum course allocation (AC 1 & AC 2)
export const createCurriculumCourse = async (req, res) => {
    try {
        const { major_id, course_id, recommended_semester, course_type } = req.body;

        // Required fields validation
        if (!major_id || !course_id || recommended_semester === undefined || !course_type) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ Ngành đào tạo, Môn học, Học kỳ gợi ý và Loại môn (Bắt buộc/Tự chọn)'
            });
        }

        // Validate recommended_semester > 0
        const parsedSemester = Number(recommended_semester);
        if (isNaN(parsedSemester) || parsedSemester <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Học kỳ gợi ý phải là số nguyên lớn hơn 0'
            });
        }

        // Validate course_type enum
        const normalizedType = course_type.trim().toUpperCase();
        if (!['COMPULSORY', 'ELECTIVE'].includes(normalizedType)) {
            return res.status(400).json({
                success: false,
                message: 'Loại môn học không hợp lệ (Chỉ chấp nhận COMPULSORY hoặc ELECTIVE)'
            });
        }

        // Verify major and course exist
        const [majorExists, courseExists] = await Promise.all([
            Major.findById(major_id),
            Course.findById(course_id)
        ]);

        if (!majorExists) {
            return res.status(404).json({
                success: false,
                message: 'Ngành đào tạo được chọn không tồn tại trên hệ thống'
            });
        }

        if (!courseExists) {
            return res.status(404).json({
                success: false,
                message: 'Môn học được chọn không tồn tại trên hệ thống'
            });
        }

        // AC 2: Check if course already exists in the major's curriculum
        const existingCurriculum = await CurriculumCourse.findOne({
            major_id,
            course_id
        });

        if (existingCurriculum) {
            return res.status(400).json({
                success: false,
                message: 'Môn học này đã tồn tại trong khung chương trình đào tạo của ngành'
            });
        }

        // AC 1: Save valid CurriculumCourse allocation record
        const curriculumCourse = new CurriculumCourse({
            major_id,
            course_id,
            recommended_semester: parsedSemester,
            course_type: normalizedType
        });

        await curriculumCourse.save();
        await curriculumCourse.populate([
            { path: 'major_id', select: 'major_code major_name' },
            { path: 'course_id', select: 'course_code course_name credits' }
        ]);

        return res.status(201).json({
            success: true,
            message: 'Phân bổ môn học vào khung chương trình đào tạo thành công',
            data: curriculumCourse
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi phân bổ môn học vào CTĐT',
            error: error.message
        });
    }
};

// Update curriculum course allocation
export const updateCurriculumCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { recommended_semester, course_type } = req.body;

        const curriculumCourse = await CurriculumCourse.findById(id);
        if (!curriculumCourse) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin phân bổ môn học để cập nhật'
            });
        }

        if (recommended_semester !== undefined) {
            const parsedSemester = Number(recommended_semester);
            if (isNaN(parsedSemester) || parsedSemester <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Học kỳ gợi ý phải là số nguyên lớn hơn 0'
                });
            }
            curriculumCourse.recommended_semester = parsedSemester;
        }

        if (course_type) {
            const normalizedType = course_type.trim().toUpperCase();
            if (!['COMPULSORY', 'ELECTIVE'].includes(normalizedType)) {
                return res.status(400).json({
                    success: false,
                    message: 'Loại môn học không hợp lệ (Chỉ chấp nhận COMPULSORY hoặc ELECTIVE)'
                });
            }
            curriculumCourse.course_type = normalizedType;
        }

        await curriculumCourse.save();
        await curriculumCourse.populate([
            { path: 'major_id', select: 'major_code major_name' },
            { path: 'course_id', select: 'course_code course_name credits' }
        ]);

        return res.status(200).json({
            success: true,
            message: 'Cập nhật phân bổ môn học thành công',
            data: curriculumCourse
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi cập nhật phân bổ môn học',
            error: error.message
        });
    }
};

// Delete curriculum course allocation
export const deleteCurriculumCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const curriculumCourse = await CurriculumCourse.findByIdAndDelete(id);

        if (!curriculumCourse) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin phân bổ môn học để xóa'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Xóa môn học khỏi khung chương trình đào tạo thành công'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi xóa môn học khỏi CTĐT',
            error: error.message
        });
    }
};
