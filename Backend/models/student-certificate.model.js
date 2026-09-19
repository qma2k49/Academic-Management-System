import mongoose from 'mongoose';

const studentCertificateSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    certificate_type: { type: String, required: true, enum: ['FOREIGN_LANGUAGE', 'INFORMATICS', 'PHYSICAL_EDUCATION', 'MILITARY_EDUCATION'] },
    certificate_name: { type: String, required: true },
    issued_date: { type: Date, required: true },
    is_verified: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('StudentCertificate', studentCertificateSchema);
