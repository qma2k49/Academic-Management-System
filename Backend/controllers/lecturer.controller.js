import Lecturer from '../models/lecturer.model.js';
import User from '../models/user.model.js';
import Faculty from '../models/faculty.model.js';

// Get all lecturers (with optional search and faculty filter)
export const getLecturers = async (req, res) => {
    try {
        const { search, faculty_id } = req.query;
        let query = {};
        if (faculty_id) query.faculty_id = faculty_id;
        if (search) {
            query.$or = [
                { lecturer_code: { $regex: search, $options: 'i' } },
                { full_name: { $regex: search, $options: 'i' } }
            ];
        }

        const lecturers = await Lecturer.find(query)
            .populate('user_id', 'username email role is_active')
            .populate('faculty_id', 'faculty_code faculty_name')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: lecturers
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi lấy danh sách Giảng viên',
            error: error.message
        });
    }
};

// Get single lecturer by ID
export const getLecturerById = async (req, res) => {
    try {
        const lecturer = await Lecturer.findById(req.params.id)
            .populate('user_id', 'username email role is_active')
            .populate('faculty_id', 'faculty_code faculty_name');

        if (!lecturer) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hồ sơ Giảng viên'
            });
        }

        return res.status(200).json({
            success: true,
            data: lecturer
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi lấy thông tin Giảng viên',
            error: error.message
        });
    }
};

// Create new Lecturer profile and automatically create corresponding User account (AC)
export const createLecturer = async (req, res) => {
    let createdUser = null;
    try {
        const { lecturer_code, full_name, faculty_id, email, degree, phone_number, password } = req.body;

        // Validation for required fields
        if (!lecturer_code || !full_name || !faculty_id || !email) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin (Mã giảng viên, Họ tên, Khoa, Email)'
            });
        }

        const normalizedCode = lecturer_code.trim().toUpperCase();
        const normalizedEmail = email.trim().toLowerCase();

        // Verify faculty exists
        const facultyExists = await Faculty.findById(faculty_id);
        if (!facultyExists) {
            return res.status(404).json({
                success: false,
                message: 'Khoa được chọn không tồn tại trên hệ thống'
            });
        }

        // Check duplicate lecturer_code in Lecturers
        const existingLecturer = await Lecturer.findOne({ lecturer_code: normalizedCode });
        if (existingLecturer) {
            return res.status(400).json({
                success: false,
                message: 'Mã giảng viên đã tồn tại trên hệ thống'
            });
        }

        // Check duplicate email or username in Users
        const existingUser = await User.findOne({
            $or: [{ email: normalizedEmail }, { username: normalizedCode }]
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email hoặc Mã giảng viên (tên đăng nhập) đã được sử dụng cho tài khoản khác'
            });
        }

        // AC: Automatically create User account with role 'LECTURER'
        createdUser = new User({
            username: normalizedCode,
            password_hash: password || '123456',
            email: normalizedEmail,
            role: 'LECTURER'
        });
        await createdUser.save();

        // Create Lecturer record linked to createdUser._id
        const lecturer = new Lecturer({
            user_id: createdUser._id,
            faculty_id,
            lecturer_code: normalizedCode,
            full_name: full_name.trim(),
            degree: degree ? degree.trim() : '',
            phone_number: phone_number ? phone_number.trim() : ''
        });

        await lecturer.save();
        await lecturer.populate([
            { path: 'user_id', select: 'username email role is_active' },
            { path: 'faculty_id', select: 'faculty_code faculty_name' }
        ]);

        return res.status(201).json({
            success: true,
            message: 'Tạo hồ sơ Giảng viên và tài khoản đăng nhập thành công',
            data: lecturer
        });
    } catch (error) {
        // Rollback created user if lecturer saving fails
        if (createdUser && createdUser._id) {
            await User.findByIdAndDelete(createdUser._id);
        }

        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi tạo hồ sơ Giảng viên',
            error: error.message
        });
    }
};

// Update lecturer profile and sync email to User account
export const updateLecturer = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, faculty_id, degree, phone_number, email } = req.body;

        const lecturer = await Lecturer.findById(id);
        if (!lecturer) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hồ sơ Giảng viên'
            });
        }

        // Handle email update and sync to User account
        if (email) {
            const normalizedEmail = email.trim().toLowerCase();
            const existingUser = await User.findOne({
                email: normalizedEmail,
                _id: { $ne: lecturer.user_id }
            });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email này đã được sử dụng bởi một tài khoản khác'
                });
            }

            // Sync email to linked User document
            await User.findByIdAndUpdate(lecturer.user_id, { email: normalizedEmail });
        }

        if (faculty_id) {
            const facultyExists = await Faculty.findById(faculty_id);
            if (!facultyExists) {
                return res.status(404).json({
                    success: false,
                    message: 'Khoa được chọn không tồn tại'
                });
            }
            lecturer.faculty_id = faculty_id;
        }

        if (full_name) lecturer.full_name = full_name.trim();
        if (degree !== undefined) lecturer.degree = degree.trim();
        if (phone_number !== undefined) lecturer.phone_number = phone_number.trim();

        await lecturer.save();
        await lecturer.populate([
            { path: 'user_id', select: 'username email role is_active' },
            { path: 'faculty_id', select: 'faculty_code faculty_name' }
        ]);

        return res.status(200).json({
            success: true,
            message: 'Cập nhật hồ sơ Giảng viên thành công',
            data: lecturer
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi cập nhật hồ sơ Giảng viên',
            error: error.message
        });
    }
};

// Delete lecturer profile and linked User account
export const deleteLecturer = async (req, res) => {
    try {
        const { id } = req.params;
        const lecturer = await Lecturer.findById(id);

        if (!lecturer) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hồ sơ Giảng viên để xóa'
            });
        }

        // Delete associated User account
        await User.findByIdAndDelete(lecturer.user_id);

        // Delete Lecturer record
        await Lecturer.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: 'Xóa hồ sơ Giảng viên và tài khoản liên kết thành công'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi xóa Giảng viên',
            error: error.message
        });
    }
};
