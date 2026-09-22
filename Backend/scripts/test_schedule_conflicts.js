import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import dns from 'dns';
import User from '../models/user.model.js';
import Faculty from '../models/faculty.model.js';
import Lecturer from '../models/lecturer.model.js';
import Room from '../models/room.model.js';
import Course from '../models/course.model.js';
import Semester from '../models/semester.model.js';
import ClassSection from '../models/class-section.model.js';
import Schedule from '../models/schedule.model.js';

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGO_URI = process.env.DB_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/academic_management';
const JWT_SECRET = process.env.JWT_SECRET || 'academic_management_access_secret_key_2026';

async function runScheduleConflictsTests() {
    console.log('--- STARTING AUTOMATED AC VERIFICATION TESTS FOR SCHEDULE CONFLICT DETECTION ---');

    try {
        await mongoose.connect(MONGO_URI);
        console.log('[+] Connected to MongoDB');

        // 1. Prepare Officer User & JWT Token
        let officer = await User.findOne({ username: 'test_officer_conflict' });
        if (!officer) {
            officer = new User({
                username: 'test_officer_conflict',
                password_hash: 'Password123',
                email: 'officer_conflict@test.com',
                role: 'OFFICER'
            });
            await officer.save();
        }

        const officerToken = jwt.sign(
            { id: officer._id, role: officer.role, username: officer.username },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // 2. Prepare Test Data
        let faculty = await Faculty.findOne({ faculty_code: 'CNTT_CONF' });
        if (!faculty) {
            faculty = await Faculty.create({
                faculty_code: 'CNTT_CONF',
                faculty_name: 'Khoa CNTT Conflict Test'
            });
        }

        // Lecturer G
        let lecturerUserG = await User.findOne({ username: 'GV_CONF_G' });
        if (!lecturerUserG) {
            lecturerUserG = await User.create({
                username: 'GV_CONF_G',
                password_hash: 'Password123',
                email: 'gv_conf_g@test.com',
                role: 'LECTURER'
            });
        }
        let lecturerG = await Lecturer.findOne({ lecturer_code: 'GV_CONF_G' });
        if (!lecturerG) {
            lecturerG = await Lecturer.create({
                user_id: lecturerUserG._id,
                faculty_id: faculty._id,
                lecturer_code: 'GV_CONF_G',
                full_name: 'Giảng Viên G Test'
            });
        }

        // Lecturer G2 (Second lecturer for room conflict test)
        let lecturerUserG2 = await User.findOne({ username: 'GV_CONF_G2' });
        if (!lecturerUserG2) {
            lecturerUserG2 = await User.create({
                username: 'GV_CONF_G2',
                password_hash: 'Password123',
                email: 'gv_conf_g2@test.com',
                role: 'LECTURER'
            });
        }
        let lecturerG2 = await Lecturer.findOne({ lecturer_code: 'GV_CONF_G2' });
        if (!lecturerG2) {
            lecturerG2 = await Lecturer.create({
                user_id: lecturerUserG2._id,
                faculty_id: faculty._id,
                lecturer_code: 'GV_CONF_G2',
                full_name: 'Giảng Viên G2 Test'
            });
        }

        // Room P and Room P2
        let roomP = await Room.findOne({ room_code: 'ROOM_P_TEST' });
        if (!roomP) {
            roomP = await Room.create({
                room_code: 'ROOM_P_TEST',
                capacity: 50,
                room_type: 'THEORY'
            });
        }

        let roomP2 = await Room.findOne({ room_code: 'ROOM_P2_TEST' });
        if (!roomP2) {
            roomP2 = await Room.create({
                room_code: 'ROOM_P2_TEST',
                capacity: 50,
                room_type: 'THEORY'
            });
        }

        let course = await Course.findOne({ course_code: 'INT1001_CONF' });
        if (!course) {
            course = await Course.create({
                faculty_id: faculty._id,
                course_code: 'INT1001_CONF',
                course_name: 'Môn Trùng Lịch Test',
                credits: 3
            });
        }

        let semester = await Semester.findOne({ semester_code: 'HK1_2026_CONF' });
        if (!semester) {
            semester = await Semester.create({
                semester_code: 'HK1_2026_CONF',
                year_start: 2026,
                year_end: 2027,
                semester_number: 1,
                start_date: new Date('2026-09-01'),
                end_date: new Date('2027-01-15')
            });
        }

        // Prepare ClassSection A and ClassSection B
        await ClassSection.deleteMany({ section_code: { $in: ['SEC_A_CONF', 'SEC_B_CONF'] } });

        const sectionA = await ClassSection.create({
            course_id: course._id,
            semester_id: semester._id,
            section_code: 'SEC_A_CONF',
            max_capacity: 50,
            status: 'OPEN'
        });

        const sectionB = await ClassSection.create({
            course_id: course._id,
            semester_id: semester._id,
            section_code: 'SEC_B_CONF',
            max_capacity: 50,
            status: 'OPEN'
        });

        await Schedule.deleteMany({ section_id: { $in: [sectionA._id, sectionB._id] } });

        const BASE_URL = 'http://localhost:3000/api/v1';

        // -------------------------------------------------------------
        // TEST CASE 1: AC 1 - Room Conflict Detection
        // Given Room P assigned to Section A on Monday (Day 2), Periods 1-3.
        // When attempting to assign Section B to Room P on Monday (Day 2), Periods 2-4.
        // -------------------------------------------------------------
        console.log('\n[TEST 1] Testing AC 1: Room Conflict Detection (Room P, Day 2/Thứ 2, P1-3 vs P2-4)...');

        // Step 1: Assign Section A to Room P on Monday (Day 2), Periods 1-3
        const res1a = await fetch(`${BASE_URL}/schedules`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${officerToken}`
            },
            body: JSON.stringify({
                section_id: sectionA._id,
                lecturer_id: lecturerG._id,
                room_id: roomP._id,
                day_of_week: 2, // Thứ 2
                start_period: 1,
                end_period: 3
            })
        });
        console.log(`Initial Schedule Status: ${res1a.status}`);

        // Step 2: Attempt to assign Section B to Room P on Monday (Day 2), Periods 2-4
        const res1b = await fetch(`${BASE_URL}/schedules`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${officerToken}`
            },
            body: JSON.stringify({
                section_id: sectionB._id,
                lecturer_id: lecturerG2._id,
                room_id: roomP._id, // Same Room P!
                day_of_week: 2, // Same Day 2!
                start_period: 2, // Overlapping periods (2-4 overlaps 1-3)!
                end_period: 4
            })
        });

        const data1b = await res1b.json();
        console.log(`HTTP Status: ${res1b.status}`);
        console.log('Response:', JSON.stringify(data1b, null, 2));

        if (res1b.status === 400 && data1b.success === false && data1b.message.includes('Phòng học đã bị trùng lịch')) {
            console.log('=> [PASSED] AC 1 Verified: Hệ thống từ chối lưu và hiển thị thông báo lỗi "Phòng học đã bị trùng lịch".');
        } else {
            console.error('=> [FAILED] AC 1 Room Conflict Test Failed');
            process.exit(1);
        }

        // -------------------------------------------------------------
        // TEST CASE 2: AC 2 - Lecturer Conflict Detection
        // Given Lecturer G assigned to Section A on Wednesday (Day 4), Periods 7-9.
        // When attempting to assign Lecturer G to Section B on Wednesday (Day 4), Periods 8-10.
        // -------------------------------------------------------------
        console.log('\n[TEST 2] Testing AC 2: Lecturer Conflict Detection (Lecturer G, Day 4/Thứ 4, P7-9 vs P8-10)...');

        // Step 1: Assign Lecturer G to Section A on Wednesday (Day 4), Periods 7-9
        const res2a = await fetch(`${BASE_URL}/schedules`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${officerToken}`
            },
            body: JSON.stringify({
                section_id: sectionA._id,
                lecturer_id: lecturerG._id,
                room_id: roomP._id,
                day_of_week: 4, // Thứ 4
                start_period: 7,
                end_period: 9
            })
        });
        console.log(`Initial Lecturer Schedule Status: ${res2a.status}`);

        // Step 2: Attempt to assign Lecturer G to Section B on Wednesday (Day 4), Periods 8-10
        const res2b = await fetch(`${BASE_URL}/schedules`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${officerToken}`
            },
            body: JSON.stringify({
                section_id: sectionB._id,
                lecturer_id: lecturerG._id, // Same Lecturer G!
                room_id: roomP2._id, // Different Room P2
                day_of_week: 4, // Same Day 4!
                start_period: 8, // Overlapping periods (8-10 overlaps 7-9)!
                end_period: 10
            })
        });

        const data2b = await res2b.json();
        console.log(`HTTP Status: ${res2b.status}`);
        console.log('Response:', JSON.stringify(data2b, null, 2));

        if (res2b.status === 400 && data2b.success === false && data2b.message.includes('Giảng viên đã có lịch giảng dạy trong khung giờ này')) {
            console.log('=> [PASSED] AC 2 Verified: Hệ thống hiển thị thông báo "Giảng viên đã có lịch giảng dạy trong khung giờ này".');
        } else {
            console.error('=> [FAILED] AC 2 Lecturer Conflict Test Failed');
            process.exit(1);
        }

        console.log('\n=============================================================');
        console.log('ALL SCHEDULE CONFLICT ACCEPTANCE CRITERIA (AC 1 & AC 2) PASSED!');
        console.log('=============================================================');

    } catch (err) {
        console.error('Error running Schedule Conflicts AC verification tests:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

runScheduleConflictsTests();
