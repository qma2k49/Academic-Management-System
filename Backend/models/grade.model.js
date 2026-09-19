import mongoose from 'mongoose';

const gradeSchema = new mongoose.Schema({
    enrollment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', required: true, unique: true },
    attendance_score: { type: Number, min: 0, max: 10, default: null },
    midterm_score: { type: Number, min: 0, max: 10, default: null },
    final_score: { type: Number, min: 0, max: 10, default: null },
    total_score_10: { type: Number, min: 0, max: 10, default: null },
    total_score_4: { type: Number, min: 0, max: 4, default: null },
    letter_grade: { type: String, enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F', null], default: null },
    is_locked: { type: Boolean, default: false },
    locked_at: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model('Grade', gradeSchema);
