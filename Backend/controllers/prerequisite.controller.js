import Prerequisite from '../models/prerequisite.model.js';
import Course from '../models/course.model.js';

/**
 * Graph traversal (BFS) to detect if a dependency path exists from startCourseId to targetCourseId.
 * If startCourseId can reach targetCourseId via existing prerequisite links, returning targetCourseId as a prerequisite of startCourseId will create a cycle.
 */
const hasDependencyPath = async (startCourseId, targetCourseId) => {
    const visited = new Set();
    const queue = [startCourseId.toString()];

    while (queue.length > 0) {
        const current = queue.shift();

        if (current === targetCourseId.toString()) {
            return true;
        }

        if (!visited.has(current)) {
            visited.add(current);

            // Find all prerequisites for the current course (where course_id === current)
            const prereqs = await Prerequisite.find({ course_id: current });
            for (const p of prereqs) {
                const nextId = p.prerequisite_course_id.toString();
                if (!visited.has(nextId)) {
                    queue.push(nextId);
                }
            }
        }
    }

    return false;
};

// Create a prerequisite configuration (AC 1 & AC 2)
export const createPrerequisite = async (req, res) => {
    try {
        const { course_id, prerequisite_course_id, relation_type } = req.body;

        // Validation for missing fields
        if (!course_id || !prerequisite_course_id) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ Môn học và Môn học tiên quyết'
            });
        }

        // Self-prerequisite validation
        if (course_id.toString() === prerequisite_course_id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Một môn học không thể làm môn tiên quyết của chính nó'
            });
        }

        // Verify both courses exist in DB
        const [targetCourse, prereqCourse] = await Promise.all([
            Course.findById(course_id),
            Course.findById(prerequisite_course_id)
        ]);

        if (!targetCourse || !prereqCourse) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin của một trong hai môn học trên hệ thống'
            });
        }

        // Check if prerequisite relation already exists
        const existingRelation = await Prerequisite.findOne({
            course_id,
            prerequisite_course_id
        });

        if (existingRelation) {
            return res.status(400).json({
                success: false,
                message: 'Cấu hình môn tiên quyết này đã tồn tại trên hệ thống'
            });
        }

        // AC 1: Cyclic dependency detection
        // If prerequisite_course_id already depends on course_id directly or transitively,
        // adding course_id -> prerequisite_course_id creates a dependency cycle (A -> B -> A)
        const isCyclic = await hasDependencyPath(prerequisite_course_id, course_id);
        if (isCyclic) {
            return res.status(400).json({
                success: false,
                message: 'Hệ thống phát hiện vòng lặp phụ thuộc môn học! Không thể thiết lập điều kiện tiên quyết này.'
            });
        }

        // AC 2: Valid prerequisite setup
        const prerequisite = new Prerequisite({
            course_id,
            prerequisite_course_id,
            relation_type: relation_type || 'PREREQUISITE'
        });

        await prerequisite.save();
        await prerequisite.populate([
            { path: 'course_id', select: 'course_code course_name credits' },
            { path: 'prerequisite_course_id', select: 'course_code course_name credits' }
        ]);

        return res.status(201).json({
            success: true,
            message: 'Tạo mối quan hệ môn học tiên quyết thành công',
            data: prerequisite
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi cấu hình môn tiên quyết',
            error: error.message
        });
    }
};

// Get all prerequisites
export const getPrerequisites = async (req, res) => {
    try {
        const { course_id } = req.query;
        let query = {};
        if (course_id) {
            query.course_id = course_id;
        }

        const prerequisites = await Prerequisite.find(query)
            .populate('course_id', 'course_code course_name credits')
            .populate('prerequisite_course_id', 'course_code course_name credits')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: prerequisites
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi lấy danh sách môn tiên quyết',
            error: error.message
        });
    }
};

// Delete a prerequisite relationship
export const deletePrerequisite = async (req, res) => {
    try {
        const { id } = req.params;
        const prerequisite = await Prerequisite.findByIdAndDelete(id);

        if (!prerequisite) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy cấu hình môn tiên quyết để xóa'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Xóa liên kết môn tiên quyết thành công'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi xóa môn tiên quyết',
            error: error.message
        });
    }
};
