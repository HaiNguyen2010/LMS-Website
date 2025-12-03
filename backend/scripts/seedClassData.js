const { User, Class, Subject, TeacherAssignment, ClassStudent } = require('../models');
const bcrypt = require('bcryptjs');

const seedClassManagementData = async () => {
  try {
    console.log('🌱 Bắt đầu seed dữ liệu Class Management...');

    // 1. Tạo một số lớp học mẫu
    const classes = await Class.bulkCreate([
      {
        name: 'Lớp 10A1',
        grade: 10,
        description: 'Lớp chuyên Toán - Tin'
      },
      {
        name: 'Lớp 10A2', 
        grade: 10,
        description: 'Lớp chuyên Lý - Hóa'
      },
      {
        name: 'Lớp 11B1',
        grade: 11,
        description: 'Lớp ban cơ bản'
      },
      {
        name: 'Lớp 12C1',
        grade: 12,
        description: 'Lớp ôn thi đại học'
      }
    ], { returning: true });

    console.log(`✅ Đã tạo ${classes.length} lớp học`);

    // 2. Tạo một số môn học mẫu
    const subjects = await Subject.bulkCreate([
      {
        name: 'Toán học',
        code: 'MATH',
        description: 'Môn toán học cơ bản và nâng cao',
        credits: 4
      },
      {
        name: 'Vật lý',
        code: 'PHYS',
        description: 'Môn vật lý từ cơ bản đến nâng cao',
        credits: 3
      },
      {
        name: 'Hóa học',
        code: 'CHEM',
        description: 'Môn hóa học lý thuyết và thực hành',
        credits: 3
      },
      {
        name: 'Tiếng Anh',
        code: 'ENG',
        description: 'Môn tiếng Anh giao tiếp và học thuật',
        credits: 3
      },
      {
        name: 'Tin học',
        code: 'IT',
        description: 'Môn tin học ứng dụng và lập trình',
        credits: 2
      },
      {
        name: 'Văn học',
        code: 'LIT',
        description: 'Môn ngữ văn và văn học Việt Nam',
        credits: 3
      }
    ], { returning: true });

    console.log(`✅ Đã tạo ${subjects.length} môn học`);

    // 3. Tạo một số tài khoản giáo viên mẫu nếu chưa có
    const existingTeachers = await User.findAll({ where: { role: 'Teacher' } });
    
    let teachers = [];
    if (existingTeachers.length < 5) {
      const hashedPassword = await bcrypt.hash('teacher123', 10);
      
      const newTeachers = await User.bulkCreate([
        {
          fullName: 'Nguyễn Văn An',
          email: 'teacher.math@lms.com',
          phone: '0901234567',
          role: 'Teacher',
          password: hashedPassword,
          isActive: true
        },
        {
          fullName: 'Trần Thị Bình',
          email: 'teacher.physics@lms.com',
          phone: '0901234568',
          role: 'Teacher',
          password: hashedPassword,
          isActive: true
        },
        {
          fullName: 'Lê Minh Cường',
          email: 'teacher.chemistry@lms.com',
          phone: '0901234569',
          role: 'Teacher',
          password: hashedPassword,
          isActive: true
        },
        {
          fullName: 'Phạm Thị Dung',
          email: 'teacher.english@lms.com',
          phone: '0901234570',
          role: 'Teacher',
          password: hashedPassword,
          isActive: true
        },
        {
          fullName: 'Hoàng Văn Em',
          email: 'teacher.it@lms.com',
          phone: '0901234571',
          role: 'Teacher',
          password: hashedPassword,
          isActive: true
        }
      ], { returning: true });

      teachers = [...existingTeachers, ...newTeachers];
      console.log(`✅ Đã tạo ${newTeachers.length} tài khoản giáo viên`);
    } else {
      teachers = existingTeachers;
      console.log(`✅ Sử dụng ${existingTeachers.length} tài khoản giáo viên có sẵn`);
    }

    // 4. Tạo một số tài khoản học sinh mẫu nếu chưa có
    const existingStudents = await User.findAll({ where: { role: 'Student' } });
    
    let students = [];
    if (existingStudents.length < 10) {
      const hashedPassword = await bcrypt.hash('student123', 10);
      
      const newStudents = await User.bulkCreate([
        {
          fullName: 'Nguyễn Văn Học',
          email: 'student1@lms.com',
          phone: '0911111111',
          role: 'Student',
          password: hashedPassword,
          isActive: true
        },
        {
          fullName: 'Trần Thị Hiền',
          email: 'student2@lms.com',
          phone: '0911111112',
          role: 'Student',
          password: hashedPassword,
          isActive: true
        },
        {
          fullName: 'Lê Minh Hoàng',
          email: 'student3@lms.com',
          phone: '0911111113',
          role: 'Student',
          password: hashedPassword,
          isActive: true
        },
        {
          fullName: 'Phạm Thị Hoa',
          email: 'student4@lms.com',
          phone: '0911111114',
          role: 'Student',
          password: hashedPassword,
          isActive: true
        },
        {
          fullName: 'Hoàng Văn Hùng',
          email: 'student5@lms.com',
          phone: '0911111115',
          role: 'Student',
          password: hashedPassword,
          isActive: true
        },
        {
          fullName: 'Vũ Thị Hương',
          email: 'student6@lms.com',
          phone: '0911111116',
          role: 'Student',
          password: hashedPassword,
          isActive: true
        },
        {
          fullName: 'Đặng Minh Huy',
          email: 'student7@lms.com',
          phone: '0911111117',
          role: 'Student',
          password: hashedPassword,
          isActive: true
        },
        {
          fullName: 'Bùi Thị Hạnh',
          email: 'student8@lms.com',
          phone: '0911111118',
          role: 'Student',
          password: hashedPassword,
          isActive: true
        },
        {
          fullName: 'Cao Văn Hải',
          email: 'student9@lms.com',
          phone: '0911111119',
          role: 'Student',
          password: hashedPassword,
          isActive: true
        },
        {
          fullName: 'Đinh Thị Hằng',
          email: 'student10@lms.com',
          phone: '0911111120',
          role: 'Student',
          password: hashedPassword,
          isActive: true
        }
      ], { returning: true });

      students = [...existingStudents, ...newStudents];
      console.log(`✅ Đã tạo ${newStudents.length} tài khoản học sinh`);
    } else {
      students = existingStudents.slice(0, 10);
      console.log(`✅ Sử dụng ${students.length} tài khoản học sinh có sẵn`);
    }

    // 5. Tạo phân công giáo viên mẫu
    const assignments = [];
    
    // Giáo viên Toán dạy lớp 10A1 và 11B1
    assignments.push({
      teacherId: teachers[0].id,
      classId: classes[0].id, // 10A1
      subjectId: subjects[0].id, // Toán
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-06-30'),
      isActive: true
    });

    assignments.push({
      teacherId: teachers[0].id,
      classId: classes[2].id, // 11B1
      subjectId: subjects[0].id, // Toán
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-06-30'),
      isActive: true
    });

    // Giáo viên Vật lý dạy lớp 10A2
    assignments.push({
      teacherId: teachers[1].id,
      classId: classes[1].id, // 10A2
      subjectId: subjects[1].id, // Vật lý
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-06-30'),
      isActive: true
    });

    // Giáo viên Hóa học dạy lớp 10A2 và 12C1
    assignments.push({
      teacherId: teachers[2].id,
      classId: classes[1].id, // 10A2
      subjectId: subjects[2].id, // Hóa học
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-06-30'),
      isActive: true
    });

    assignments.push({
      teacherId: teachers[2].id,
      classId: classes[3].id, // 12C1
      subjectId: subjects[2].id, // Hóa học
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-06-30'),
      isActive: true
    });

    // Giáo viên Tiếng Anh dạy tất cả lớp
    for (let i = 0; i < classes.length; i++) {
      assignments.push({
        teacherId: teachers[3].id,
        classId: classes[i].id,
        subjectId: subjects[3].id, // Tiếng Anh
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        isActive: true
      });
    }

    const createdAssignments = await TeacherAssignment.bulkCreate(assignments, { returning: true });
    console.log(`✅ Đã tạo ${createdAssignments.length} phân công giáo viên`);

    // 6. Tạo ghi danh học sinh vào lớp
    const enrollments = [];
    
    // Ghi danh học sinh vào lớp 10A1 (3 học sinh)
    for (let i = 0; i < 3; i++) {
      enrollments.push({
        studentId: students[i].id,
        classId: classes[0].id, // 10A1
        enrollmentDate: new Date('2024-01-15'),
        isActive: true
      });
    }

    // Ghi danh học sinh vào lớp 10A2 (3 học sinh)
    for (let i = 3; i < 6; i++) {
      enrollments.push({
        studentId: students[i].id,
        classId: classes[1].id, // 10A2
        enrollmentDate: new Date('2024-01-15'),
        isActive: true
      });
    }

    // Ghi danh học sinh vào lớp 11B1 (2 học sinh)
    for (let i = 6; i < 8; i++) {
      enrollments.push({
        studentId: students[i].id,
        classId: classes[2].id, // 11B1
        enrollmentDate: new Date('2024-01-15'),
        isActive: true
      });
    }

    // Ghi danh học sinh vào lớp 12C1 (2 học sinh)
    for (let i = 8; i < 10; i++) {
      enrollments.push({
        studentId: students[i].id,
        classId: classes[3].id, // 12C1
        enrollmentDate: new Date('2024-01-15'),
        isActive: true
      });
    }

    const createdEnrollments = await ClassStudent.bulkCreate(enrollments, { returning: true });
    console.log(`✅ Đã tạo ${createdEnrollments.length} ghi danh học sinh`);

    console.log('\n📊 Tóm tắt dữ liệu đã tạo:');
    console.log(`   🏫 ${classes.length} lớp học`);
    console.log(`   📚 ${subjects.length} môn học`);  
    console.log(`   👨‍🏫 ${teachers.length} giáo viên`);
    console.log(`   👨‍🎓 ${students.length} học sinh`);
    console.log(`   📋 ${createdAssignments.length} phân công giáo viên`);
    console.log(`   ✏️ ${createdEnrollments.length} ghi danh học sinh`);

    console.log('\n🔐 Thông tin đăng nhập mẫu:');
    console.log('   Admin: admin@lms.com / admin123');
    console.log('   Teacher: teacher.math@lms.com / teacher123');
    console.log('   Student: student1@lms.com / student123');

    return {
      classes,
      subjects,
      teachers,
      students,
      assignments: createdAssignments,
      enrollments: createdEnrollments
    };

  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu:', error);
    throw error;
  }
};

module.exports = { seedClassManagementData };