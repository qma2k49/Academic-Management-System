import Faculty from '../models/faculty.model.js';

// Get all faculties
export const getFaculties = async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};
        if (search) {
            query = {
                $or: [
                    { faculty_code: { $regex: search, $options: 'i' } },
                    { faculty_name: { $regex: search, $options: 'i' } }
                ]
            };
        }
        const faculties = await Faculty.find(query).sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            data: faculties
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi lấy danh sách Khoa',
            error: error.message
        });
    }
};

// Get single faculty by ID
export const getFacultyById = async (req, res) => {
    try {
        const faculty = await Faculty.findById(req.params.id);
        if (!faculty) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy Khoa'
            });
        }
        return res.status(200).json({
            success: true,
            data: faculty
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi lấy thông tin Khoa',
            error: error.message
        });
    }
};

// Create new faculty
export const createFaculty = async (req, res) => {
    try {
        const { faculty_code, faculty_name } = req.body;

        if (!faculty_code || !faculty_name) {
            return res.status(400).json({
                success: false,
                message: 'Mã khoa và tên khoa là bắt buộc'
            });
        }

        const existingFaculty = await Faculty.findOne({ faculty_code: faculty_code.trim().toUpperCase() });
        if (existingFaculty) {
            return res.status(400).json({
                success: false,
                message: 'Mã khoa đã tồn tại trên hệ thống'
            });
        }

        const faculty = new Faculty({
            faculty_code,
            faculty_name
        });

        await faculty.save();

        return res.status(201).json({
            success: true,
            message: 'Tạo mới Khoa thành công',
            data: faculty
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi tạo Khoa',
            error: error.message
        });
    }
};

// Update faculty
export const updateFaculty = async (req, res) => {
    try {
        const { id } = req.params;
        const { faculty_code, faculty_name } = req.body;

        const faculty = await Faculty.findById(id);
        if (!faculty) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy Khoa'
            });
        }

        if (faculty_code && faculty_code.trim().toUpperCase() !== faculty.faculty_code) {
            const existingFaculty = await Faculty.findOne({ faculty_code: faculty_code.trim().toUpperCase() });
            if (existingFaculty) {
                return res.status(400).json({
                    success: false,
                    message: 'Mã khoa đã tồn tại trên hệ thống'
                });
            }
            faculty.faculty_code = faculty_code;
        }

        if (faculty_name) faculty.faculty_name = faculty_name;

        await faculty.save();

        return res.status(200).json({
            success: true,
            message: 'Cập nhật Khoa thành công',
            data: faculty
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi cập nhật Khoa',
            error: error.message
        });
    }
};

// Delete faculty
export const deleteFaculty = async (req, res) => {
    try {
        const { id } = req.params;
        const faculty = await Faculty.findByIdAndDelete(id);

        if (!faculty) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy Khoa để xóa'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Xóa Khoa thành công'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi xóa Khoa',
            error: error.message
        });
    }
};
