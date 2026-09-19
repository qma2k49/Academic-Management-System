import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
    major_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Major', required: true },
    class_code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    academic_year: { type: Number, required: true },
    advisor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Lecturer', default: null }
}, { timestamps: true });

export default mongoose.model('Class', classSchema);
