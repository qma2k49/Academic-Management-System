import XLSX from 'xlsx';
import { performance } from 'perf_hooks';
import bcrypt from 'bcryptjs';
import Student from '../models/student.model.js';
import User from '../models/user.model.js';
import Class from '../models/class.model.js';
import Major from '../models/major.model.js';

/**
 * Helper to parse and validate date of birth input in various formats
 * (DD/MM/YYYY, YYYY-MM-DD, Excel Serial Date, or Date objects)
 */
const parseAndValidateDate = (dobInput) => {
    if (!dobInput) return null;

    if (dobInput instanceof Date) {
        return isNaN(dobInput.getTime()) ? null : dobInput;
    }

    if (typeof dobInput === 'number') {
        // Excel serial date conversion
        const dateObj = new Date(Math.round((dobInput - 25569) * 86400 * 1000));
        return isNaN(dateObj.getTime()) ? null : dateObj;
    }

    if (typeof dobInput === 'string') {
        const str = dobInput.trim();

        // Format DD/MM/YYYY or DD-MM-YYYY
        const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (dmyMatch) {
            const day = parseInt(dmyMatch[1], 10);
            const month = parseInt(dmyMatch[2], 10) - 1;
            const year = parseInt(dmyMatch[3], 10);
            const d = new Date(year, month, day);
            if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
                return d;
            }
            return null;
        }

        // Format YYYY-MM-DD or YYYY/MM/DD
        const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
        if (ymdMatch) {
            const year = parseInt(ymdMatch[1], 10);
            const month = parseInt(ymdMatch[2], 10) - 1;
            const day = parseInt(ymdMatch[3], 10);
            const d = new Date(year, month, day);
            if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
                return d;
            }
            return null;
        }

        const fallback = new Date(str);
        return isNaN(fallback.getTime()) ? null : fallback;
    }

    return null;
};

// Gender normalization helper
const normalizeGender = (val) => {
    if (!val) return 'OTHER';
    const s = String(val).trim().toUpperCase();
    if (s === 'NAM' || s === 'MALE' || s === 'M') return 'MALE';
    if (s === 'NỮ' || s === 'NU' || s === 'FEMALE' || s === 'F') return 'FEMALE';
    return 'OTHER';
};

// Get all students (with search and class filter)
export const getStudents = async (req, res) => {
    try {
        const { search, class_id } = req.query;
        let query = {};
        if (class_id) query.class_id = class_id;
        if (search) {
            query.$or = [
                { student_code: { $regex: search, $options: 'i' } },
                { full_name: { $regex: search, $options: 'i' } }
            ];
        }

        const students = await Student.find(query)
            .populate('user_id', 'username email role is_active')
            .populate({
                path: 'class_id',
                select: 'class_code academic_year',
                populate: { path: 'major_id', select: 'major_code major_name' }
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: students
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi lấy danh sách Sinh viên',
            error: error.message
        });
    }
};

// Get single student profile by ID
export const getStudentById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)
            .populate('user_id', 'username email role is_active')
            .populate({
                path: 'class_id',
                select: 'class_code academic_year',
                populate: { path: 'major_id', select: 'major_code major_name' }
            });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hồ sơ Sinh viên'
            });
        }

        return res.status(200).json({
            success: true,
            data: student
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi lấy thông tin Sinh viên',
            error: error.message
        });
    }
};

// Import students from Excel file with High Performance (<5s for 1000 records) & Row-by-Row Validation (AC 1 & AC 2)
export const importStudentsFromExcel = async (req, res) => {
    const startTime = performance.now();

    try {
        let rawRows = [];

        // Support Excel file upload (req.file) OR direct JSON array in req.body.students
        if (req.file) {
            const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        } else if (req.body && Array.isArray(req.body.students)) {
            rawRows = req.body.students;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng tải lên tệp tin Excel (.xlsx, .xls) hoặc gửi mảng dữ liệu sinh viên'
            });
        }

        if (rawRows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Tệp Excel không chứa dữ liệu sinh viên'
            });
        }

        // Map column headers to standard keys
        const mappedRows = rawRows.map((r, idx) => ({
            rowIndex: idx + 2, // Header is row 1
            student_code: String(r['student_code'] || r['Mã sinh viên'] || r['MSV'] || r['Mã SV'] || '').trim().toUpperCase(),
            full_name: String(r['full_name'] || r['Họ và tên'] || r['Tên sinh viên'] || r['Họ tên'] || '').trim(),
            dob: r['dob'] || r['Ngày sinh'] || r['DOB'] || '',
            gender: r['gender'] || r['Giới tính'] || '',
            class_code: String(r['class_code'] || r['Lớp'] || r['Mã lớp'] || r['Lớp sinh hoạt'] || 'K26_CNTT1').trim().toUpperCase(),
            email: String(r['email'] || r['Email'] || '').trim().toLowerCase()
        }));

        // Fetch existing student codes from Database for fast pre-validation
        const existingStudentCodes = new Set(
            (await Student.find({}, 'student_code')).map(s => s.student_code.toUpperCase())
        );
        const existingUsernames = new Set(
            (await User.find({}, 'username')).map(u => u.username.toUpperCase())
        );

        const errors = [];
        const seenCodesInFile = new Set();
        const validRows = [];

        // AC 2: Row-by-Row Error Validation
        for (const row of mappedRows) {
            let hasRowError = false;

            // 1. Validate student_code presence
            if (!row.student_code) {
                errors.push({
                    row: row.rowIndex,
                    student_code: row.student_code || 'N/A',
                    field: 'student_code',
                    error: 'Mã sinh viên không được để trống'
                });
                hasRowError = true;
            } else {
                // 2. Validate student_code duplicate in upload file
                if (seenCodesInFile.has(row.student_code)) {
                    errors.push({
                        row: row.rowIndex,
                        student_code: row.student_code,
                        field: 'student_code',
                        error: 'Mã sinh viên bị trùng lặp trong tệp Excel'
                    });
                    hasRowError = true;
                } else {
                    seenCodesInFile.add(row.student_code);
                }

                // 3. Validate student_code duplicate in DB
                if (existingStudentCodes.has(row.student_code) || existingUsernames.has(row.student_code)) {
                    errors.push({
                        row: row.rowIndex,
                        student_code: row.student_code,
                        field: 'student_code',
                        error: 'Mã sinh viên đã tồn tại trên hệ thống'
                    });
                    hasRowError = true;
                }
            }

            // 4. Validate full_name presence
            if (!row.full_name) {
                errors.push({
                    row: row.rowIndex,
                    student_code: row.student_code || 'N/A',
                    field: 'full_name',
                    error: 'Họ tên sinh viên không được để trống'
                });
                hasRowError = true;
            }

            // 5. Validate Date of Birth (dob) format
            const parsedDob = parseAndValidateDate(row.dob);
            if (!parsedDob) {
                errors.push({
                    row: row.rowIndex,
                    student_code: row.student_code || 'N/A',
                    field: 'dob',
                    error: 'Định dạng ngày sinh sai (yêu cầu DD/MM/YYYY hoặc YYYY-MM-DD)'
                });
                hasRowError = true;
            }

            if (!hasRowError) {
                validRows.push({
                    ...row,
                    parsedDob
                });
            }
        }

        // AC 2: Return detailed list of row errors if any validation errors are found
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Phát hiện dữ liệu không hợp lệ trong tệp Excel. Vui lòng kiểm tra và sửa lại.',
                total_rows: mappedRows.length,
                error_count: errors.length,
                errors
            });
        }

        // ------------------------------------------------------------------
        // AC 1: HIGH PERFORMANCE BATCH IMPORT (< 5 SECONDS FOR 1,000 RECORDS)
        // ------------------------------------------------------------------

        // Step 1: Resolve / Create Class documents in bulk
        const classCodesSet = new Set(validRows.map(r => r.class_code));
        const classCodesArray = Array.from(classCodesSet);

        let existingClasses = await Class.find({ class_code: { $in: classCodesArray } });
        const classMap = new Map(existingClasses.map(c => [c.class_code.toUpperCase(), c._id]));

        // Get or create default major if missing
        let defaultMajor = await Major.findOne();
        if (!defaultMajor) {
            defaultMajor = await Major.create({
                major_code: 'CNTT',
                major_name: 'Công nghệ thông tin',
                total_required_credits: 130,
                faculty_id: new mongoose.Types.ObjectId()
            });
        }

        const newClassesToCreate = [];
        for (const code of classCodesArray) {
            if (!classMap.has(code)) {
                newClassesToCreate.push({
                    major_id: defaultMajor._id,
                    class_code: code,
                    academic_year: new Date().getFullYear()
                });
            }
        }

        if (newClassesToCreate.length > 0) {
            const createdClasses = await Class.insertMany(newClassesToCreate, { ordered: false });
            for (const c of createdClasses) {
                classMap.set(c.class_code.toUpperCase(), c._id);
            }
        }

        // Step 2: Pre-hash default password ONCE to maximize speed
        const defaultHashedPassword = await bcrypt.hash('123456', 10);

        // Step 3: Prepare Users bulk payload
        const usersToInsert = validRows.map(r => ({
            username: r.student_code,
            password_hash: defaultHashedPassword,
            email: r.email || `${r.student_code.toLowerCase()}@student.university.edu.vn`,
            role: 'STUDENT',
            is_active: true
        }));

        // Step 4: Bulk insert Users
        const createdUsers = await User.insertMany(usersToInsert, { ordered: false });
        const userMap = new Map(createdUsers.map(u => [u.username.toUpperCase(), u._id]));

        // Step 5: Prepare Students bulk payload
        const studentsToInsert = validRows.map(r => ({
            user_id: userMap.get(r.student_code),
            class_id: classMap.get(r.class_code),
            student_code: r.student_code,
            full_name: r.full_name,
            dob: r.parsedDob,
            gender: normalizeGender(r.gender),
            academic_status: 'STUDYING'
        }));

        // Step 6: Bulk insert Students
        const createdStudents = await Student.insertMany(studentsToInsert, { ordered: false });

        const endTime = performance.now();
        const processingTimeSeconds = Number(((endTime - startTime) / 1000).toFixed(3));

        return res.status(201).json({
            success: true,
            message: `Nhập dữ liệu ${createdStudents.length} sinh viên và tạo tài khoản thành công trong ${processingTimeSeconds} giây.`,
            imported_count: createdStudents.length,
            processing_time_seconds: processingTimeSeconds
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi nhập danh sách Sinh viên từ Excel',
            error: error.message
        });
    }
};

// Create single student
export const createStudent = async (req, res) => {
    let createdUser = null;
    try {
        const { student_code, full_name, class_id, dob, gender, email, password } = req.body;

        if (!student_code || !full_name || !class_id || !dob) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin (Mã sinh viên, Họ tên, Lớp, Ngày sinh)'
            });
        }

        const normalizedCode = student_code.trim().toUpperCase();
        const parsedDob = parseAndValidateDate(dob);

        if (!parsedDob) {
            return res.status(400).json({
                success: false,
                message: 'Định dạng ngày sinh không hợp lệ'
            });
        }

        const classExists = await Class.findById(class_id);
        if (!classExists) {
            return res.status(404).json({
                success: false,
                message: 'Lớp học không tồn tại trên hệ thống'
            });
        }

        const existingStudent = await Student.findOne({ student_code: normalizedCode });
        if (existingStudent) {
            return res.status(400).json({
                success: false,
                message: 'Mã sinh viên đã tồn tại trên hệ thống'
            });
        }

        const userEmail = email ? email.trim().toLowerCase() : `${normalizedCode.toLowerCase()}@student.university.edu.vn`;

        createdUser = new User({
            username: normalizedCode,
            password_hash: password || '123456',
            email: userEmail,
            role: 'STUDENT'
        });
        await createdUser.save();

        const student = new Student({
            user_id: createdUser._id,
            class_id,
            student_code: normalizedCode,
            full_name: full_name.trim(),
            dob: parsedDob,
            gender: normalizeGender(gender)
        });

        await student.save();
        await student.populate([
            { path: 'user_id', select: 'username email role is_active' },
            { path: 'class_id', select: 'class_code academic_year' }
        ]);

        return res.status(201).json({
            success: true,
            message: 'Tạo hồ sơ Sinh viên và tài khoản thành công',
            data: student
        });
    } catch (error) {
        if (createdUser && createdUser._id) {
            await User.findByIdAndDelete(createdUser._id);
        }

        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi tạo Sinh viên',
            error: error.message
        });
    }
};

// Update student profile
export const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, class_id, dob, gender, academic_status } = req.body;

        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hồ sơ Sinh viên'
            });
        }

        if (class_id) {
            const classExists = await Class.findById(class_id);
            if (!classExists) {
                return res.status(404).json({
                    success: false,
                    message: 'Lớp học không tồn tại'
                });
            }
            student.class_id = class_id;
        }

        if (dob) {
            const parsedDob = parseAndValidateDate(dob);
            if (!parsedDob) {
                return res.status(400).json({
                    success: false,
                    message: 'Định dạng ngày sinh không hợp lệ'
                });
            }
            student.dob = parsedDob;
        }

        if (full_name) student.full_name = full_name.trim();
        if (gender) student.gender = normalizeGender(gender);
        if (academic_status) student.academic_status = academic_status;

        await student.save();
        await student.populate([
            { path: 'user_id', select: 'username email role is_active' },
            { path: 'class_id', select: 'class_code academic_year' }
        ]);

        return res.status(200).json({
            success: true,
            message: 'Cập nhật hồ sơ Sinh viên thành công',
            data: student
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi cập nhật Sinh viên',
            error: error.message
        });
    }
};

// Delete student profile and linked User account
export const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await Student.findById(id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hồ sơ Sinh viên để xóa'
            });
        }

        await User.findByIdAndDelete(student.user_id);
        await Student.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: 'Xóa hồ sơ Sinh viên và tài khoản liên kết thành công'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi xóa Sinh viên',
            error: error.message
        });
    }
};
