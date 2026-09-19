import mongoose from 'mongoose';

const graduationAssessmentSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    batch_year: { type: Number, required: true },
    batch_phase: { type: Number, required: true },
    accumulated_credits: { type: Number, required: true },
    cpa: { type: Number, required: true, min: 0, max: 4 },
    classification: { type: String, enum: ['EXCELLENT', 'VERY_GOOD', 'GOOD', 'AVERAGE', null] },
    is_qualified: { type: Boolean, required: true },
    disqualification_reason: { type: String, default: null }
}, { timestamps: true });

graduationAssessmentSchema.index({ student_id: 1, batch_year: 1, batch_phase: 1 }, { unique: true });

export default mongoose.model('GraduationAssessment', graduationAssessmentSchema);
