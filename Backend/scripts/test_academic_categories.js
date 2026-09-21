import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import Faculty from '../models/faculty.model.js';
import Major from '../models/major.model.js';
import Course from '../models/course.model.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/academic_management';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_2026';

async function runTests() {
    console.log('--- STARTING AUTOMATED AC VERIFICATION TESTS FOR ACADEMIC CATEGORIES ---');

    try {
        await mongoose.connect(MONGO_URI);
        console.log('[+] Connected to MongoDB');

        // 1. Prepare Officer Test User & Token
        let officer = await User.findOne({ username: 'test_officer_cat' });
        if (!officer) {
            officer = new User({
                user_id: 'OFF_CAT_01',
                username: 'test_officer_cat',
                password: 'Password123',
                email: 'officer_cat@test.com',
                full_name: 'Giáo Vụ Test',
                role: 'OFFICER'
            });
            await officer.save();
        }

        const officerToken = jwt.sign(
            { id: officer._id, role: officer.role, username: officer.username },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // 2. Prepare Faculty Test Record
        await Faculty.deleteMany({ faculty_code: 'CNTT_TEST' });
        const faculty = new Faculty({
            faculty_code: 'CNTT_TEST',
            faculty_name: 'Khoa Công Nghệ Thông Tin Test'
        });
        await faculty.save();
        console.log('[+] Faculty created:', faculty.faculty_code, 'ID:', faculty._id);

        // Clean up previous test courses with code 'INT1001_TEST'
        await Course.deleteMany({ course_code: 'INT1001_TEST' });

        // HTTP Server Base URL
        const BASE_URL = 'http://localhost:3000/api/v1';

        // -------------------------------------------------------------
        // TEST CASE 1: AC 2 - Create valid course (name, code, credits > 0)
        // -------------------------------------------------------------
        console.log('\n[TEST 1] Testing AC 2: Valid course creation (credits > 0)...');
        const validCoursePayload = {
            faculty_id: faculty._id,
            course_code: 'INT1001_TEST',
            course_name: 'Lập trình C++ Cơ bản',
            credits: 3,
            theory_periods: 30,
            practice_periods: 15
        };

        const res1 = await fetch(`${BASE_URL}/courses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${officerToken}`
            },
            body: JSON.stringify(validCoursePayload)
        });

        const data1 = await res1.json();
        console.log(`HTTP Status: ${res1.status}`);
        console.log('Response:', JSON.stringify(data1, null, 2));

        if (res1.status === 201 && data1.success === true && data1.data.course_code === 'INT1001_TEST') {
            console.log('=> [PASSED] AC 2 Verified: Môn học mới được lưu thành công vào cơ sở dữ liệu (Status 201 Created).');
        } else {
            console.error('=> [FAILED] AC 2 Failed');
            process.exit(1);
        }

        // -------------------------------------------------------------
        // TEST CASE 2: AC 1 - Create course with existing course_code
        // -------------------------------------------------------------
        console.log('\n[TEST 2] Testing AC 1: Rejection on duplicate course_code...');
        const duplicateCoursePayload = {
            faculty_id: faculty._id,
            course_code: 'INT1001_TEST', // Duplicate code
            course_name: 'Lập trình C++ Nâng cao',
            credits: 4
        };

        const res2 = await fetch(`${BASE_URL}/courses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${officerToken}`
            },
            body: JSON.stringify(duplicateCoursePayload)
        });

        const data2 = await res2.json();
        console.log(`HTTP Status: ${res2.status}`);
        console.log('Response:', JSON.stringify(data2, null, 2));

        if (res2.status === 400 && data2.success === false && data2.message.includes('Mã môn học đã tồn tại')) {
            console.log('=> [PASSED] AC 1 Verified: Hệ thống từ chối lưu và hiển thị thông báo lỗi trùng mã môn.');
        } else {
            console.error('=> [FAILED] AC 1 Failed');
            process.exit(1);
        }

        // -------------------------------------------------------------
        // TEST CASE 3: Create course with invalid credits (credits <= 0)
        // -------------------------------------------------------------
        console.log('\n[TEST 3] Testing Credits > 0 validation (invalid credits)...');
        const invalidCreditsPayload = {
            faculty_id: faculty._id,
            course_code: 'INT1002_TEST',
            course_name: 'Cấu trúc dữ liệu',
            credits: 0 // Invalid credits
        };

        const res3 = await fetch(`${BASE_URL}/courses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${officerToken}`
            },
            body: JSON.stringify(invalidCreditsPayload)
        });

        const data3 = await res3.json();
        console.log(`HTTP Status: ${res3.status}`);
        console.log('Response:', JSON.stringify(data3, null, 2));

        if (res3.status === 400 && data3.success === false && data3.message.includes('Số tín chỉ phải lớn hơn 0')) {
            console.log('=> [PASSED] Verified: Hệ thống từ chối môn học có số tín chỉ <= 0.');
        } else {
            console.error('=> [FAILED] Credits validation Failed');
            process.exit(1);
        }

        // -------------------------------------------------------------
        // TEST CASE 4: Retrieve course list and verify created course exists
        // -------------------------------------------------------------
        console.log('\n[TEST 4] Testing GET /courses list...');
        const res4 = await fetch(`${BASE_URL}/courses`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${officerToken}`
            }
        });

        const data4 = await res4.json();
        console.log(`HTTP Status: ${res4.status}`);
        const found = data4.data.some(c => c.course_code === 'INT1001_TEST');
        if (res4.status === 200 && found) {
            console.log('=> [PASSED] Verified: Môn học vừa tạo hiển thị đúng trên danh sách môn học.');
        } else {
            console.error('=> [FAILED] Course listing Failed');
            process.exit(1);
        }

        console.log('\n=============================================================');
        console.log('ALL ACCEPTANCE CRITERIA (AC 1 & AC 2) PASSED SUCCESSFULLY!');
        console.log('=============================================================');

    } catch (err) {
        console.error('Error running AC verification tests:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

runTests();
