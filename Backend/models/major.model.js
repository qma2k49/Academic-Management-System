import mongoose from 'mongoose';

const majorSchema = new mongoose.Schema({
    faculty_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
    major_code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    major_name: { type: String, required: true, trim: true },
    total_required_credits: { type: Number, required: true, min: 0 }
}, { timestamps: true });

export default mongoose.model('Major', majorSchema);
