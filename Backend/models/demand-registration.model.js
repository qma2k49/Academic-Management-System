import mongoose from 'mongoose';

const demandRegistrationSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    semester_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true }
}, { timestamps: true });

demandRegistrationSchema.index({ student_id: 1, course_id: 1, semester_id: 1 }, { unique: true });

export default mongoose.model('DemandRegistration', demandRegistrationSchema);
