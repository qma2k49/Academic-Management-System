import mongoose from 'mongoose';

const semesterSchema = new mongoose.Schema({
    semester_code: { type: String, required: true, unique: true, trim: true },
    year_start: { type: Number, required: true },
    year_end: { type: Number, required: true },
    semester_number: { type: Number, required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true }
}, { timestamps: true });

export default mongoose.model('Semester', semesterSchema);
