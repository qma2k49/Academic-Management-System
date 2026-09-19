import mongoose from 'mongoose';

const lecturerSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    faculty_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
    lecturer_code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    full_name: { type: String, required: true, trim: true },
    degree: { type: String },
    phone_number: { type: String }
}, { timestamps: true });

export default mongoose.model('Lecturer', lecturerSchema);
