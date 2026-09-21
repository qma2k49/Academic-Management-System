import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    password_hash: { type: String, required: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    role: { type: String, required: true, enum: ['ADMIN', 'OFFICER', 'LECTURER', 'STUDENT'] },
    is_active: { type: Boolean, default: true },
    refresh_token: { type: String, default: null }
}, { timestamps: true });

// Pre-save hook to hash password before saving if modified
userSchema.pre('save', async function (next) {
    if (!this.isModified('password_hash')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password_hash = await bcrypt.hash(this.password_hash, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Helper method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password_hash);
};

export default mongoose.model('User', userSchema);
