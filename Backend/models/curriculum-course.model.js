import mongoose from 'mongoose';

const curriculumCourseSchema = new mongoose.Schema({
    major_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Major', required: true },
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    recommended_semester: { type: Number, required: true },
    course_type: { type: String, required: true, enum: ['COMPULSORY', 'ELECTIVE'] }
}, { timestamps: true });

curriculumCourseSchema.index({ major_id: 1, course_id: 1 }, { unique: true });

export default mongoose.model('CurriculumCourse', curriculumCourseSchema);
