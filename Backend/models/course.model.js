import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
    faculty_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
    course_code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    course_name: { type: String, required: true, trim: true },
    credits: { type: Number, required: true, min: 1 },
    theory_periods: { type: Number, default: 0 },
    practice_periods: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Course', courseSchema);
