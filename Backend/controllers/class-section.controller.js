import ClassSection from '../models/class-section.model.js';
import Course from '../models/course.model.js';
import Semester from '../models/semester.model.js';

// Get all class sections (with filters for semester_id, course_id, status, and search section_code)
export const getClassSections = async (req, res) => {
    try {
        const { semester_id, course_id, status, search } = req.query;
        let query = {};
        if (semester_id) query.semester_id = semester_id;
        if (course_id) query.course_id = course_id;
        if (status) query.status = status.toUpperCase();
        if (search) {
            query.section_code = { $regex: search, $options: 'i' };
        }

        const classSections = await ClassSection.find(query)
            .populate('course_id', 'course_code course_name credits theory_periods practice_periods')
            .populate('semester_id', 'semester_code year_start year_end semester_number')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: classSections
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi lấy danh sách Lớp học phần',
            error: error.message
        });
    }
};

// Get single class section by ID
export const getClassSectionById = async (req, res) => {
    try {
        const classSection = await ClassSection.findById(req.params.id)
            .populate('course_id', 'course_code course_name credits')
            .populate('semester_id', 'semester_code year_start year_end semester_number');

        if (!classSection) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin Lớp học phần'
            });
        }

        return res.status(200).json({
            success: true,
            data: classSection
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi lấy thông tin Lớp học phần',
            error: error.message
        });
    }
};

// Create class section (AC 1 & AC 2)
export const createClassSection = async (req, res) => {
    try {
        const { course_id, semester_id, section_code, max_capacity } = req.body;

        // Validation for required fields
        if (!course_id || !semester_id || !section_code || max_capacity === undefined || max_capacity === null) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin (Môn học, Học kỳ, Mã lớp học phần, Sĩ số tối đa)'
            });
        }

        // Validate max_capacity > 0
        const parsedCapacity = Number(max_capacity);
        if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Sĩ số tối đa của lớp học phần phải là số lớn hơn 0'
            });
        }

        // Verify Course and Semester exist
        const [courseExists, semesterExists] = await Promise.all([
            Course.findById(course_id),
            Semester.findById(semester_id)
        ]);

        if (!courseExists) {
            return res.status(404).json({
                success: false,
                message: 'Môn học được chọn không tồn tại trên hệ thống'
            });
        }

        if (!semesterExists) {
            return res.status(404).json({
                success: false,
                message: 'Học kỳ được chọn không tồn tại trên hệ thống'
            });
        }

        const normalizedCode = section_code.trim().toUpperCase();

        // AC 2: Check duplicate section_code in the same semester
        const existingSection = await ClassSection.findOne({
            section_code: normalizedCode,
            semester_id
        });

        if (existingSection) {
            return res.status(400).json({
                success: false,
                message: 'Mã lớp học phần đã tồn tại trong học kỳ này'
            });
        }

        // Also check globally unique section_code if schema enforces global unique
        const globalExistingSection = await ClassSection.findOne({ section_code: normalizedCode });
        if (globalExistingSection) {
            return res.status(400).json({
                success: false,
                message: 'Mã lớp học phần đã tồn tại trên hệ thống'
            });
        }

        // AC 1: Create new ClassSection with status 'OPEN' and current_enrolled = 0
        const classSection = new ClassSection({
            course_id,
            semester_id,
            section_code: normalizedCode,
            max_capacity: parsedCapacity,
            current_enrolled: 0,
            status: 'OPEN'
        });

        await classSection.save();
        await classSection.populate([
            { path: 'course_id', select: 'course_code course_name credits' },
            { path: 'semester_id', select: 'semester_code year_start year_end semester_number' }
        ]);

        return res.status(201).json({
            success: true,
            message: 'Tạo mới lớp học phần thành công',
            data: classSection
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi tạo mới Lớp học phần',
            error: error.message
        });
    }
};

// Update class section
export const updateClassSection = async (req, res) => {
    try {
        const { id } = req.params;
        const { section_code, max_capacity, status } = req.body;

        const classSection = await ClassSection.findById(id);
        if (!classSection) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin Lớp học phần'
            });
        }

        if (max_capacity !== undefined) {
            const parsedCapacity = Number(max_capacity);
            if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Sĩ số tối đa phải là số lớn hơn 0'
                });
            }

            if (parsedCapacity < classSection.current_enrolled) {
                return res.status(400).json({
                    success: false,
                    message: `Sĩ số tối đa không thể nhỏ hơn sĩ số hiện tại (${classSection.current_enrolled} sinh viên)`
                });
            }

            classSection.max_capacity = parsedCapacity;
        }

        if (status) {
            const normalizedStatus = status.trim().toUpperCase();
            if (!['OPEN', 'FULL', 'CANCELLED', 'CLOSED'].includes(normalizedStatus)) {
                return res.status(400).json({
                    success: false,
                    message: 'Trạng thái lớp học phần không hợp lệ'
                });
            }
            classSection.status = normalizedStatus;
        }

        if (section_code && section_code.trim().toUpperCase() !== classSection.section_code) {
            const normalizedCode = section_code.trim().toUpperCase();
            const existingSection = await ClassSection.findOne({ section_code: normalizedCode });
            if (existingSection) {
                return res.status(400).json({
                    success: false,
                    message: 'Mã lớp học phần đã tồn tại trên hệ thống'
                });
            }
            classSection.section_code = normalizedCode;
        }

        await classSection.save();
        await classSection.populate([
            { path: 'course_id', select: 'course_code course_name credits' },
            { path: 'semester_id', select: 'semester_code year_start year_end semester_number' }
        ]);

        return res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin Lớp học phần thành công',
            data: classSection
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi cập nhật Lớp học phần',
            error: error.message
        });
    }
};

// Delete class section
export const deleteClassSection = async (req, res) => {
    try {
        const { id } = req.params;
        const classSection = await ClassSection.findByIdAndDelete(id);

        if (!classSection) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy Lớp học phần để xóa'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Xóa Lớp học phần thành công'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi xóa Lớp học phần',
            error: error.message
        });
    }
};
