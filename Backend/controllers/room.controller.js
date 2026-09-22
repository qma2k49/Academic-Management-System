import Room from '../models/room.model.js';

// Get all rooms (with optional room_type filter and search)
export const getRooms = async (req, res) => {
    try {
        const { search, room_type } = req.query;
        let query = {};
        if (room_type) query.room_type = room_type.toUpperCase();
        if (search) {
            query.room_code = { $regex: search, $options: 'i' };
        }

        const rooms = await Room.find(query).sort({ room_code: 1 });
        return res.status(200).json({
            success: true,
            data: rooms
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi lấy danh mục Phòng học',
            error: error.message
        });
    }
};

// Get single room by ID
export const getRoomById = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin Phòng học'
            });
        }
        return res.status(200).json({
            success: true,
            data: room
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi lấy thông tin Phòng học',
            error: error.message
        });
    }
};

// Create new room (AC 2)
export const createRoom = async (req, res) => {
    try {
        const { room_code, capacity, room_type } = req.body;

        // Validation for required fields
        if (!room_code || capacity === undefined || capacity === null) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin (Mã phòng học và Sức chứa)'
            });
        }

        // AC 2: Check capacity > 0
        const parsedCapacity = Number(capacity);
        if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Sức chứa của phòng học phải là số lớn hơn 0'
            });
        }

        const normalizedCode = room_code.trim().toUpperCase();
        const existingRoom = await Room.findOne({ room_code: normalizedCode });

        if (existingRoom) {
            return res.status(400).json({
                success: false,
                message: 'Mã phòng học đã tồn tại trên hệ thống'
            });
        }

        const room = new Room({
            room_code: normalizedCode,
            capacity: parsedCapacity,
            room_type: room_type ? room_type.trim().toUpperCase() : 'THEORY'
        });

        await room.save();

        return res.status(201).json({
            success: true,
            message: 'Tạo mới phòng học thành công, phòng học đã sẵn sàng xếp lịch',
            data: room
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi tạo mới Phòng học',
            error: error.message
        });
    }
};

// Update room
export const updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const { room_code, capacity, room_type } = req.body;

        const room = await Room.findById(id);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin Phòng học'
            });
        }

        if (capacity !== undefined) {
            const parsedCapacity = Number(capacity);
            if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Sức chứa của phòng học phải là số lớn hơn 0'
                });
            }
            room.capacity = parsedCapacity;
        }

        if (room_code && room_code.trim().toUpperCase() !== room.room_code) {
            const normalizedCode = room_code.trim().toUpperCase();
            const existingRoom = await Room.findOne({ room_code: normalizedCode });
            if (existingRoom) {
                return res.status(400).json({
                    success: false,
                    message: 'Mã phòng học đã tồn tại trên hệ thống'
                });
            }
            room.room_code = normalizedCode;
        }

        if (room_type) room.room_type = room_type.trim().toUpperCase();

        await room.save();

        return res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin Phòng học thành công',
            data: room
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi cập nhật Phòng học',
            error: error.message
        });
    }
};

// Delete room
export const deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const room = await Room.findByIdAndDelete(id);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy Phòng học để xóa'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Xóa Phòng học thành công'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi xóa Phòng học',
            error: error.message
        });
    }
};
