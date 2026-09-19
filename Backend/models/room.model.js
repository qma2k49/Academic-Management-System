import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
    room_code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    room_type: { type: String, default: 'THEORY', enum: ['THEORY', 'LAB'] }
}, { timestamps: true });

export default mongoose.model('Room', roomSchema);
