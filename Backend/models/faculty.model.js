import mongoose from 'mongoose';

const facultySchema = new mongoose.Schema({
    faculty_code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    faculty_name: { type: String, required: true, trim: true }
}, { timestamps: true });

export default mongoose.model('Faculty', facultySchema);
