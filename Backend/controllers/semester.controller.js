import Semester from '../models/semester.model.js';

// Get all semesters
export const getSemesters = async (req, res) => {
    try {
        const semesters = await Semester.find().sort({ start_date: -1 });
        return res.status(200).json({
            success: true,
            data: semesters
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi lấy danh sách Học kỳ',
            error: error.message
        });
    }
};

// Get single semester by ID
export const getSemesterById = async (req, res) => {
    try {
        const semester = await Semester.findById(req.params.id);
        if (!semester) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin Học kỳ'
            });
        }
        return res.status(200).json({
            success: true,
            data: semester
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi lấy thông tin Học kỳ',
            error: error.message
        });
    }
};

// Create new semester (AC 1)
export const createSemester = async (req, res) => {
    try {
        const { semester_code, year_start, year_end, semester_number, start_date, end_date } = req.body;

        // Validation for missing required fields
        if (!semester_code || year_start === undefined || year_end === undefined || semester_number === undefined || !start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin (Mã học kỳ, Năm bắt đầu, Năm kết thúc, Học kỳ thứ, Ngày bắt đầu, Ngày kết thúc)'
            });
        }

        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Định dạng ngày bắt đầu hoặc ngày kết thúc không hợp lệ'
            });
        }

        // AC 1: Given thông tin học kỳ có ngày kết thúc trước hoặc bằng ngày bắt đầu, hệ thống chặn thao tác và cảnh báo khoảng thời gian không hợp lệ.
        if (endDate <= startDate) {
            return res.status(400).json({
                success: false,
                message: 'Ngày kết thúc học kỳ phải sau ngày bắt đầu (Khoảng thời gian không hợp lệ)'
            });
        }

        const normalizedCode = semester_code.trim().toUpperCase();
        const existingSemester = await Semester.findOne({ semester_code: normalizedCode });

        if (existingSemester) {
            return res.status(400).json({
                success: false,
                message: 'Mã học kỳ đã tồn tại trên hệ thống'
            });
        }

        const semester = new Semester({
            semester_code: normalizedCode,
            year_start: Number(year_start),
            year_end: Number(year_end),
            semester_number: Number(semester_number),
            start_date: startDate,
            end_date: endDate
        });

        await semester.save();

        return res.status(201).json({
            success: true,
            message: 'Cấu hình học kỳ mới thành công',
            data: semester
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi tạo Học kỳ mới',
            error: error.message
        });
    }
};

// Update semester
export const updateSemester = async (req, res) => {
    try {
        const { id } = req.params;
        const { semester_code, year_start, year_end, semester_number, start_date, end_date } = req.body;

        const semester = await Semester.findById(id);
        if (!semester) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin Học kỳ'
            });
        }

        let newStartDate = semester.start_date;
        let newEndDate = semester.end_date;

        if (start_date) {
            const parsedStart = new Date(start_date);
            if (isNaN(parsedStart.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Định dạng ngày bắt đầu không hợp lệ'
                });
            }
            newStartDate = parsedStart;
        }

        if (end_date) {
            const parsedEnd = new Date(end_date);
            if (isNaN(parsedEnd.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Định dạng ngày kết thúc không hợp lệ'
                });
            }
            newEndDate = parsedEnd;
        }

        // AC 1 Date validation check
        if (newEndDate <= newStartDate) {
            return res.status(400).json({
                success: false,
                message: 'Ngày kết thúc học kỳ phải sau ngày bắt đầu (Khoảng thời gian không hợp lệ)'
            });
        }

        if (semester_code && semester_code.trim().toUpperCase() !== semester.semester_code) {
            const normalizedCode = semester_code.trim().toUpperCase();
            const existingSemester = await Semester.findOne({ semester_code: normalizedCode });
            if (existingSemester) {
                return res.status(400).json({
                    success: false,
                    message: 'Mã học kỳ đã tồn tại trên hệ thống'
                });
            }
            semester.semester_code = normalizedCode;
        }

        if (year_start !== undefined) semester.year_start = Number(year_start);
        if (year_end !== undefined) semester.year_end = Number(year_end);
        if (semester_number !== undefined) semester.semester_number = Number(semester_number);
        semester.start_date = newStartDate;
        semester.end_date = newEndDate;

        await semester.save();

        return res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin Học kỳ thành công',
            data: semester
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi cập nhật Học kỳ',
            error: error.message
        });
    }
};

// Delete semester
export const deleteSemester = async (req, res) => {
    try {
        const { id } = req.params;
        const semester = await Semester.findByIdAndDelete(id);

        if (!semester) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy Học kỳ để xóa'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Xóa Học kỳ thành công'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi xóa Học kỳ',
            error: error.message
        });
    }
};
