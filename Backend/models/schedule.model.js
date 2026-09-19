import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
    section_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSection', required: true },
    lecturer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Lecturer', required: true },
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    day_of_week: { type: Number, required: true, min: 2, max: 8 },
    start_period: { type: Number, required: true, min: 1 },
    end_period: { type: Number, required: true, min: 1 }
}, { timestamps: true });

scheduleSchema.index({ room_id: 1, day_of_week: 1, start_period: 1, end_period: 1 });

export default mongoose.model('Schedule', scheduleSchema);
