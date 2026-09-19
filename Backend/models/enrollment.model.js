import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    section_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSection', required: true },
    registration_type: { type: String, required: true, enum: ['OFFICIAL', 'ADJUSTED'] },
    status: { type: String, default: 'ENROLLED', enum: ['ENROLLED', 'DROPPED'] }
}, { timestamps: true });

enrollmentSchema.index({ student_id: 1, section_id: 1 }, { unique: true });

export default mongoose.model('Enrollment', enrollmentSchema);
