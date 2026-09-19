import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    password_hash: { type: String, required: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    role: { type: String, required: true, enum: ['ADMIN', 'OFFICER', 'LECTURER', 'STUDENT'] },
    is_active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
