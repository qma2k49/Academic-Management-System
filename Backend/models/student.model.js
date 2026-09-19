import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    class_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    student_code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    full_name: { type: String, required: true, trim: true },
    dob: { type: Date, required: true },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'] },
    academic_status: { type: String, default: 'STUDYING', enum: ['STUDYING', 'SUSPENDED', 'EXPELLED', 'GRADUATED'] }
}, { timestamps: true });

export default mongoose.model('Student', studentSchema);
