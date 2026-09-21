import Major from '../models/major.model.js';
import Faculty from '../models/faculty.model.js';

// Get all majors
export const getMajors = async (req, res) => {
    try {
        const { search, faculty_id } = req.query;
        let query = {};
        if (faculty_id) query.faculty_id = faculty_id;
        if (search) {
            query.$or = [
                { major_code: { $regex: search, $options: 'i' } },
                { major_name: { $regex: search, $options: 'i' } }
            ];
        }
        const majors = await Major.find(query).populate('faculty_id', 'faculty_code faculty_name').sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            data: majors
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi lấy danh sách Ngành',
            error: error.message
        });
    }
};

// Get single major by ID
export const getMajorById = async (req, res) => {
    try {
        const major = await Major.findById(req.params.id).populate('faculty_id', 'faculty_code faculty_name');
        if (!major) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy Ngành'
            });
        }
        return res.status(200).json({
            success: true,
            data: major
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi lấy thông tin Ngành',
            error: error.message
        });
    }
};

// Create new major
export const createMajor = async (req, res) => {
    try {
        const { faculty_id, major_code, major_name, total_required_credits } = req.body;

        if (!faculty_id || !major_code || !major_name || total_required_credits === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin (Khoa, Mã ngành, Tên ngành, Số tín chỉ bắt buộc)'
            });
        }

        const facultyExists = await Faculty.findById(faculty_id);
        if (!facultyExists) {
            return res.status(404).json({
                success: false,
                message: 'Khoa được chọn không tồn tại trên hệ thống'
            });
        }

        const existingMajor = await Major.findOne({ major_code: major_code.trim().toUpperCase() });
        if (existingMajor) {
            return res.status(400).json({
                success: false,
                message: 'Mã ngành đã tồn tại trên hệ thống'
            });
        }

        const major = new Major({
            faculty_id,
            major_code,
            major_name,
            total_required_credits
        });

        await major.save();
        await major.populate('faculty_id', 'faculty_code faculty_name');

        return res.status(201).json({
            success: true,
            message: 'Tạo mới Ngành thành công',
            data: major
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi tạo Ngành',
            error: error.message
        });
    }
};

// Update major
export const updateMajor = async (req, res) => {
    try {
        const { id } = req.params;
        const { faculty_id, major_code, major_name, total_required_credits } = req.body;

        const major = await Major.findById(id);
        if (!major) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy Ngành'
            });
        }

        if (faculty_id) {
            const facultyExists = await Faculty.findById(faculty_id);
            if (!facultyExists) {
                return res.status(404).json({
                    success: false,
                    message: 'Khoa được chọn không tồn tại'
                });
            }
            major.faculty_id = faculty_id;
        }

        if (major_code && major_code.trim().toUpperCase() !== major.major_code) {
            const existingMajor = await Major.findOne({ major_code: major_code.trim().toUpperCase() });
            if (existingMajor) {
                return res.status(400).json({
                    success: false,
                    message: 'Mã ngành đã tồn tại trên hệ thống'
                });
            }
            major.major_code = major_code;
        }

        if (major_name) major.major_name = major_name;
        if (total_required_credits !== undefined) major.total_required_credits = total_required_credits;

        await major.save();
        await major.populate('faculty_id', 'faculty_code faculty_name');

        return res.status(200).json({
            success: true,
            message: 'Cập nhật Ngành thành công',
            data: major
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi cập nhật Ngành',
            error: error.message
        });
    }
};

// Delete major
export const deleteMajor = async (req, res) => {
    try {
        const { id } = req.params;
        const major = await Major.findByIdAndDelete(id);

        if (!major) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy Ngành để xóa'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Xóa Ngành thành công'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi xóa Ngành',
            error: error.message
        });
    }
};
