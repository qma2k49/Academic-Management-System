import mongoose from 'mongoose';

const classSectionSchema = new mongoose.Schema({
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    semester_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true },
    section_code: { type: String, required: true, unique: true, trim: true },
    max_capacity: { type: Number, required: true, min: 1 },
    current_enrolled: { type: Number, default: 0, min: 0 },
    status: { type: String, default: 'OPEN', enum: ['OPEN', 'FULL', 'CANCELLED', 'CLOSED'] },
    version: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('ClassSection', classSectionSchema);
