import Schedule from '../models/schedule.model.js';
import ClassSection from '../models/class-section.model.js';
import Lecturer from '../models/lecturer.model.js';
import Room from '../models/room.model.js';

// Get all schedules (with filters for section_id, lecturer_id, room_id, day_of_week)
export const getSchedules = async (req, res) => {
    try {
        const { section_id, lecturer_id, room_id, day_of_week } = req.query;
        let query = {};
        if (section_id) query.section_id = section_id;
        if (lecturer_id) query.lecturer_id = lecturer_id;
        if (room_id) query.room_id = room_id;
        if (day_of_week) query.day_of_week = Number(day_of_week);

        const schedules = await Schedule.find(query)
            .populate({
                path: 'section_id',
                select: 'section_code max_capacity current_enrolled status',
                populate: [
                    { path: 'course_id', select: 'course_code course_name credits' },
                    { path: 'semester_id', select: 'semester_code year_start year_end' }
                ]
            })
            .populate('lecturer_id', 'lecturer_code full_name degree phone_number')
            .populate('room_id', 'room_code capacity room_type')
            .sort({ day_of_week: 1, start_period: 1 });

        return res.status(200).json({
            success: true,
            data: schedules
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi lấy danh sách Thời khóa biểu',
            error: error.message
        });
    }
};

// Get single schedule profile by ID
export const getScheduleById = async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id)
            .populate('section_id')
            .populate('lecturer_id')
            .populate('room_id');

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin Thời khóa biểu'
            });
        }

        return res.status(200).json({
            success: true,
            data: schedule
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi lấy thông tin Thời khóa biểu',
            error: error.message
        });
    }
};

// Create new schedule assignment (AC)
export const createSchedule = async (req, res) => {
    try {
        const { section_id, lecturer_id, room_id, day_of_week, start_period, end_period } = req.body;

        // Validation for missing required fields
        if (!section_id || !lecturer_id || !room_id || day_of_week === undefined || start_period === undefined || end_period === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin (Lớp học phần, Giảng viên, Phòng học, Thứ trong tuần, Tiết bắt đầu, Tiết kết thúc)'
            });
        }

        const parsedDay = Number(day_of_week);
        const parsedStart = Number(start_period);
        const parsedEnd = Number(end_period);

        // Validate day_of_week (2 = Thứ 2, 8 = Chủ Nhật)
        if (isNaN(parsedDay) || parsedDay < 2 || parsedDay > 7) {
            return res.status(400).json({
                success: false,
                message: 'Thứ trong tuần không hợp lệ (Chấp nhận giá trị từ 2 - Thứ 2 đến Thứ 7)'
            });
        }

        // AC: Validate periods 1 <= start < end <= 12
        if (isNaN(parsedStart) || isNaN(parsedEnd) || parsedStart < 1 || parsedEnd > 12 || parsedStart >= parsedEnd) {
            return res.status(400).json({
                success: false,
                message: 'Tiết bắt đầu và tiết kết thúc không hợp lệ (Yêu cầu: 1 <= Tiết bắt đầu < Tiết kết thúc <= 12)'
            });
        }

        // Verify ClassSection exists
        const section = await ClassSection.findById(section_id);
        if (!section) {
            return res.status(404).json({
                success: false,
                message: 'Lớp học phần được chọn không tồn tại trên hệ thống'
            });
        }

        // AC: Verify ClassSection is in 'OPEN' status
        if (section.status !== 'OPEN') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể xếp thời khóa biểu cho lớp học phần đang ở trạng thái OPEN'
            });
        }

        // Verify Lecturer and Room exist
        const [lecturerExists, roomExists] = await Promise.all([
            Lecturer.findById(lecturer_id),
            Room.findById(room_id)
        ]);

        if (!lecturerExists) {
            return res.status(404).json({
                success: false,
                message: 'Giảng viên được chọn không tồn tại trên hệ thống'
            });
        }

        if (!roomExists) {
            return res.status(404).json({
                success: false,
                message: 'Phòng học được chọn không tồn tại trên hệ thống'
            });
        }

        // Room Conflict Check (same room, same day_of_week, overlapping periods)
        const roomConflict = await Schedule.findOne({
            room_id,
            day_of_week: parsedDay,
            start_period: { $lt: parsedEnd },
            end_period: { $gt: parsedStart }
        });

        if (roomConflict) {
            return res.status(400).json({
                success: false,
                message: 'Phòng học bị trùng lịch với một lớp học phần khác trong cùng khung tiết này'
            });
        }

        // Lecturer Conflict Check (same lecturer, same day_of_week, overlapping periods)
        const lecturerConflict = await Schedule.findOne({
            lecturer_id,
            day_of_week: parsedDay,
            start_period: { $lt: parsedEnd },
            end_period: { $gt: parsedStart }
        });

        if (lecturerConflict) {
            return res.status(400).json({
                success: false,
                message: 'Giảng viên bị trùng lịch dạy một lớp học phần khác trong cùng khung tiết này'
            });
        }

        // AC: Record Schedule document in Schedules collection
        const schedule = new Schedule({
            section_id,
            lecturer_id,
            room_id,
            day_of_week: parsedDay,
            start_period: parsedStart,
            end_period: parsedEnd
        });

        await schedule.save();
        await schedule.populate([
            {
                path: 'section_id',
                select: 'section_code status',
                populate: { path: 'course_id', select: 'course_code course_name' }
            },
            { path: 'lecturer_id', select: 'lecturer_code full_name degree' },
            { path: 'room_id', select: 'room_code capacity room_type' }
        ]);

        return res.status(201).json({
            success: true,
            message: 'Gán thời khóa biểu cho lớp học phần thành công',
            data: schedule
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi tạo Thời khóa biểu',
            error: error.message
        });
    }
};

// Update schedule
export const updateSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const { lecturer_id, room_id, day_of_week, start_period, end_period } = req.body;

        const schedule = await Schedule.findById(id);
        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy Thời khóa biểu để cập nhật'
            });
        }

        const targetDay = day_of_week !== undefined ? Number(day_of_week) : schedule.day_of_week;
        const targetStart = start_period !== undefined ? Number(start_period) : schedule.start_period;
        const targetEnd = end_period !== undefined ? Number(end_period) : schedule.end_period;
        const targetRoom = room_id || schedule.room_id;
        const targetLecturer = lecturer_id || schedule.lecturer_id;

        if (targetDay < 2 || targetDay > 7) {
            return res.status(400).json({
                success: false,
                message: 'Thứ trong tuần không hợp lệ (Chấp nhận giá trị từ 2 - Thứ 2 đến 8 - Chủ Nhật)'
            });
        }

        if (targetStart < 1 || targetEnd > 12 || targetStart >= targetEnd) {
            return res.status(400).json({
                success: false,
                message: 'Tiết bắt đầu và tiết kết thúc không hợp lệ (Yêu cầu: 1 <= Tiết bắt đầu < Tiết kết thúc <= 12)'
            });
        }

        // Room conflict check excluding current schedule
        const roomConflict = await Schedule.findOne({
            _id: { $ne: id },
            room_id: targetRoom,
            day_of_week: targetDay,
            start_period: { $lt: targetEnd },
            end_period: { $gt: targetStart }
        });

        if (roomConflict) {
            return res.status(400).json({
                success: false,
                message: 'Phòng học bị trùng lịch với lớp học phần khác'
            });
        }

        // Lecturer conflict check excluding current schedule
        const lecturerConflict = await Schedule.findOne({
            _id: { $ne: id },
            lecturer_id: targetLecturer,
            day_of_week: targetDay,
            start_period: { $lt: targetEnd },
            end_period: { $gt: targetStart }
        });

        if (lecturerConflict) {
            return res.status(400).json({
                success: false,
                message: 'Giảng viên bị trùng lịch dạy với lớp học phần khác'
            });
        }

        schedule.room_id = targetRoom;
        schedule.lecturer_id = targetLecturer;
        schedule.day_of_week = targetDay;
        schedule.start_period = targetStart;
        schedule.end_period = targetEnd;

        await schedule.save();
        await schedule.populate([
            { path: 'section_id', select: 'section_code status' },
            { path: 'lecturer_id', select: 'lecturer_code full_name degree' },
            { path: 'room_id', select: 'room_code capacity room_type' }
        ]);

        return res.status(200).json({
            success: true,
            message: 'Cập nhật Thời khóa biểu thành công',
            data: schedule
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi cập nhật Thời khóa biểu',
            error: error.message
        });
    }
};

// Delete schedule
export const deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const schedule = await Schedule.findByIdAndDelete(id);

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy Thời khóa biểu để xóa'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Xóa Thời khóa biểu thành công'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi xóa Thời khóa biểu',
            error: error.message
        });
    }
};
