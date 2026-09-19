import mongoose from 'mongoose';

const prerequisiteSchema = new mongoose.Schema({
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    prerequisite_course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    relation_type: { type: String, default: 'PREREQUISITE', enum: ['PREREQUISITE', 'PARALLEL'] }
}, { timestamps: true });

prerequisiteSchema.index({ course_id: 1, prerequisite_course_id: 1 }, { unique: true });

export default mongoose.model('Prerequisite', prerequisiteSchema);
