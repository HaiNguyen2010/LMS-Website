const { 
  User, 
  Class, 
  Subject, 
  TeacherAssignment, 
  ClassStudent,
  Lesson,
  Assignment,
  Submission,
  Grade,
  ForumPost,
  ForumComment,
  ForumLike,
  Notification,
  Attachment,
  syncDatabase 
} = require('../models');
require('dotenv').config();

const seedData = async () => {
  try {
    console.log('🌱 Bắt đầu seed dữ liệu...\n');

    // Đồng bộ database (force: true sẽ xóa toàn bộ dữ liệu cũ)
    await syncDatabase({ force: true });
    console.log('✅ Đã đồng bộ database\n');

    // ===================== 1. TẠO USERS =====================
    console.log('👥 Tạo Users...');
    
    // Admin
    const admin = await User.createWithHashedPassword({
      name: 'Administrator',
      email: 'admin@lms.com',
      password: 'Admin123456',
      role: 'admin',
      phoneNumber: '0901234567',
      code: 'ADMIN001',
      address: 'Hà Nội',
      isActive: true
    });
    console.log('   ✓ Admin:', admin.email);

    // Teachers
    const teachers = [];
    const teacherData = [
      { name: 'Nguyễn Văn An', email: 'teacher1@lms.com', password: 'Teacher123', phoneNumber: '0912345678', code: 'GV001', address: 'Hà Nội', isActive: true },
      { name: 'Trần Thị Bình', email: 'teacher2@lms.com', password: 'Teacher123', phoneNumber: '0923456789', code: 'GV002', address: 'Hà Nội', isActive: true },
      { name: 'Lê Hoàng Cường', email: 'teacher3@lms.com', password: 'Teacher123', phoneNumber: '0934567890', code: 'GV003', address: 'TP.HCM', isActive: true },
      { name: 'Phạm Thị Dung', email: 'teacher4@lms.com', password: 'Teacher123', phoneNumber: '0945678901', code: 'GV004', address: 'Đà Nẵng', isActive: true },
      { name: 'Hoàng Văn Em', email: 'teacher5@lms.com', password: 'Teacher123', phoneNumber: '0956789012', code: 'GV005', address: 'Hà Nội', isActive: true },
    ];

    for (const data of teacherData) {
      const teacher = await User.createWithHashedPassword({ ...data, role: 'teacher' });
      teachers.push(teacher);
      console.log(`   ✓ Teacher: ${teacher.email}`);
    }

    // Students
    const students = [];
    const studentData = [
      { name: 'Nguyễn Minh Anh', email: 'student1@lms.com', password: 'Student123', phoneNumber: '0967890123', code: 'SV001', address: 'Hà Nội', isActive: true },
      { name: 'Trần Quốc Bảo', email: 'student2@lms.com', password: 'Student123', phoneNumber: '0978901234', code: 'SV002', address: 'Hà Nội', isActive: true },
      { name: 'Lê Thị Cẩm', email: 'student3@lms.com', password: 'Student123', phoneNumber: '0989012345', code: 'SV003', address: 'TP.HCM', isActive: true },
      { name: 'Phạm Văn Dũng', email: 'student4@lms.com', password: 'Student123', phoneNumber: '0990123456', code: 'SV004', address: 'Đà Nẵng', isActive: true },
      { name: 'Hoàng Thị Hoa', email: 'student5@lms.com', password: 'Student123', phoneNumber: '0901234568', code: 'SV005', address: 'Hà Nội', isActive: true },
      { name: 'Vũ Văn Khoa', email: 'student6@lms.com', password: 'Student123', phoneNumber: '0912345679', code: 'SV006', address: 'Hà Nội', isActive: true },
      { name: 'Đỗ Thị Lan', email: 'student7@lms.com', password: 'Student123', phoneNumber: '0923456780', code: 'SV007', address: 'TP.HCM', isActive: true },
      { name: 'Bùi Văn Minh', email: 'student8@lms.com', password: 'Student123', phoneNumber: '0934567891', code: 'SV008', address: 'Hà Nội', isActive: true },
      { name: 'Đặng Thị Nga', email: 'student9@lms.com', password: 'Student123', phoneNumber: '0945678902', code: 'SV009', address: 'Đà Nẵng', isActive: true },
      { name: 'Ngô Văn Phong', email: 'student10@lms.com', password: 'Student123', phoneNumber: '0956789013', code: 'SV010', address: 'Hà Nội', isActive: true },
      { name: 'Phan Thị Quỳnh', email: 'student11@lms.com', password: 'Student123', phoneNumber: '0967890124', code: 'SV011', address: 'Hà Nội', isActive: true },
      { name: 'Tô Văn Sơn', email: 'student12@lms.com', password: 'Student123', phoneNumber: '0978901235', code: 'SV012', address: 'TP.HCM', isActive: true },
      { name: 'Lý Thị Tâm', email: 'student13@lms.com', password: 'Student123', phoneNumber: '0989012346', code: 'SV013', address: 'Hà Nội', isActive: true },
      { name: 'Mai Văn Tùng', email: 'student14@lms.com', password: 'Student123', phoneNumber: '0990123457', code: 'SV014', address: 'Đà Nẵng', isActive: true },
      { name: 'Cao Thị Uyên', email: 'student15@lms.com', password: 'Student123', phoneNumber: '0901234569', code: 'SV015', address: 'Hà Nội', isActive: true },
    ];

    for (const data of studentData) {
      const student = await User.createWithHashedPassword({ ...data, role: 'student' });
      students.push(student);
      console.log(`   ✓ Student: ${student.email}`);
    }
    console.log(`✅ Đã tạo ${teachers.length} giáo viên và ${students.length} học sinh\n`);

    // ===================== 2. TẠO CLASSES =====================
    console.log('🏫 Tạo Classes...');
    const classes = [];
    const classData = [
      { name: '10A1', code: '10A1', description: 'Lớp 10A1', maxStudents: 40 },
      { name: '10A2', code: '10A2', description: 'Lớp 10A2', maxStudents: 40 },
      { name: '11A1', code: '11A1', description: 'Lớp 11A1', maxStudents: 40 },
      { name: '11A2', code: '11A2', description: 'Lớp 11A2', maxStudents: 40 },
      { name: '12A1', code: '12A1', description: 'Lớp 12A1', maxStudents: 40 },
    ];

    for (const data of classData) {
      const classObj = await Class.create(data);
      classes.push(classObj);
      console.log(`   ✓ Class: ${classObj.name}`);
    }
    console.log(`✅ Đã tạo ${classes.length} lớp học\n`);

    // ===================== 3. TẠO SUBJECTS =====================
    console.log('📚 Tạo Subjects...');
    const subjects = [];
    const subjectData = [
      { name: 'Toán học', code: 'MATH', description: 'Môn Toán học', credits: 4 },
      { name: 'Vật lý', code: 'PHYS', description: 'Môn Vật lý', credits: 3 },
      { name: 'Hóa học', code: 'CHEM', description: 'Môn Hóa học', credits: 3 },
      { name: 'Sinh học', code: 'BIOL', description: 'Môn Sinh học', credits: 2 },
      { name: 'Ngữ văn', code: 'LIT', description: 'Môn Ngữ văn', credits: 4 },
      { name: 'Tiếng Anh', code: 'ENG', description: 'Môn Tiếng Anh', credits: 3 },
      { name: 'Lịch sử', code: 'HIST', description: 'Môn Lịch sử', credits: 2 },
      { name: 'Địa lý', code: 'GEO', description: 'Môn Địa lý', credits: 2 },
    ];

    for (const data of subjectData) {
      const subject = await Subject.create(data);
      subjects.push(subject);
      console.log(`   ✓ Subject: ${subject.name}`);
    }
    console.log(`✅ Đã tạo ${subjects.length} môn học\n`);

    // ===================== 4. TẠO TEACHER ASSIGNMENTS =====================
    console.log('👨‍🏫 Tạo Teacher Assignments...');
    const teacherAssignments = [];
    
    // Phân công giáo viên dạy môn học cho các lớp
    const assignments = [
      // Lớp 10A1
      { teacherId: teachers[0].id, classId: classes[0].id, subjectId: subjects[0].id }, // Thầy An dạy Toán 10A1
      { teacherId: teachers[1].id, classId: classes[0].id, subjectId: subjects[1].id }, // Cô Bình dạy Vật lý 10A1
      { teacherId: teachers[2].id, classId: classes[0].id, subjectId: subjects[4].id }, // Thầy Cường dạy Văn 10A1
      
      // Lớp 10A2
      { teacherId: teachers[0].id, classId: classes[1].id, subjectId: subjects[0].id }, // Thầy An dạy Toán 10A2
      { teacherId: teachers[3].id, classId: classes[1].id, subjectId: subjects[2].id }, // Cô Dung dạy Hóa 10A2
      { teacherId: teachers[4].id, classId: classes[1].id, subjectId: subjects[5].id }, // Thầy Em dạy Anh 10A2
      
      // Lớp 11A1
      { teacherId: teachers[1].id, classId: classes[2].id, subjectId: subjects[0].id }, // Cô Bình dạy Toán 11A1
      { teacherId: teachers[2].id, classId: classes[2].id, subjectId: subjects[1].id }, // Thầy Cường dạy Vật lý 11A1
      { teacherId: teachers[3].id, classId: classes[2].id, subjectId: subjects[3].id }, // Cô Dung dạy Sinh 11A1
      
      // Lớp 11A2
      { teacherId: teachers[4].id, classId: classes[3].id, subjectId: subjects[0].id }, // Thầy Em dạy Toán 11A2
      { teacherId: teachers[0].id, classId: classes[3].id, subjectId: subjects[6].id }, // Thầy An dạy Sử 11A2
      { teacherId: teachers[1].id, classId: classes[3].id, subjectId: subjects[7].id }, // Cô Bình dạy Địa 11A2
      
      // Lớp 12A1
      { teacherId: teachers[2].id, classId: classes[4].id, subjectId: subjects[0].id }, // Thầy Cường dạy Toán 12A1
      { teacherId: teachers[3].id, classId: classes[4].id, subjectId: subjects[1].id }, // Cô Dung dạy Vật lý 12A1
      { teacherId: teachers[4].id, classId: classes[4].id, subjectId: subjects[4].id }, // Thầy Em dạy Văn 12A1
    ];

    for (let i = 0; i < assignments.length; i++) {
      const data = assignments[i];
      const assignment = await TeacherAssignment.create({
        ...data,
        code: `TA${String(i + 1).padStart(3, '0')}`, // TA001, TA002, etc.
        isActive: true
      });
      teacherAssignments.push(assignment);
    }
    console.log(`✅ Đã tạo ${teacherAssignments.length} phân công giảng dạy\n`);

    // ===================== 5. TẠO CLASS STUDENTS (GHI DANH) =====================
    console.log('📝 Tạo Student Enrollments...');
    const enrollments = [];
    
    // Phân bổ học sinh vào các lớp (3 học sinh/lớp)
    const enrollmentData = [
      // Lớp 10A1
      { studentId: students[0].id, classId: classes[0].id },
      { studentId: students[1].id, classId: classes[0].id },
      { studentId: students[2].id, classId: classes[0].id },
      
      // Lớp 10A2
      { studentId: students[3].id, classId: classes[1].id },
      { studentId: students[4].id, classId: classes[1].id },
      { studentId: students[5].id, classId: classes[1].id },
      
      // Lớp 11A1
      { studentId: students[6].id, classId: classes[2].id },
      { studentId: students[7].id, classId: classes[2].id },
      { studentId: students[8].id, classId: classes[2].id },
      
      // Lớp 11A2
      { studentId: students[9].id, classId: classes[3].id },
      { studentId: students[10].id, classId: classes[3].id },
      { studentId: students[11].id, classId: classes[3].id },
      
      // Lớp 12A1
      { studentId: students[12].id, classId: classes[4].id },
      { studentId: students[13].id, classId: classes[4].id },
      { studentId: students[14].id, classId: classes[4].id },
    ];

    for (const data of enrollmentData) {
      const enrollment = await ClassStudent.create({
        ...data,
        enrollmentDate: new Date('2024-09-01'),
        isActive: true
      });
      enrollments.push(enrollment);
    }
    console.log(`✅ Đã ghi danh ${enrollments.length} học sinh\n`);

    // ===================== 6. TẠO LESSONS =====================
    console.log('📖 Tạo Lessons...');
    const lessons = [];
    
    // Tạo bài giảng cho lớp 10A1 - Môn Toán (createdBy là teacher phụ trách môn đó)
    const lessonData = [
      { classId: classes[0].id, subjectId: subjects[0].id, createdBy: teachers[0].id, title: 'Bài 1: Mệnh đề', description: 'Khái niệm mệnh đề, mệnh đề phủ định', status: 'published' },
      { classId: classes[0].id, subjectId: subjects[0].id, createdBy: teachers[0].id, title: 'Bài 2: Tập hợp', description: 'Khái niệm tập hợp, các phép toán tập hợp', status: 'published' },
      { classId: classes[0].id, subjectId: subjects[0].id, createdBy: teachers[0].id, title: 'Bài 3: Hàm số', description: 'Khái niệm hàm số, đồ thị hàm số', status: 'published' },
      
      // Lớp 10A1 - Vật lý
      { classId: classes[0].id, subjectId: subjects[1].id, createdBy: teachers[1].id, title: 'Bài 1: Chuyển động cơ học', description: 'Các đại lượng đặc trưng của chuyển động', status: 'published' },
      { classId: classes[0].id, subjectId: subjects[1].id, createdBy: teachers[1].id, title: 'Bài 2: Lực và chuyển động', description: 'Các định luật Newton', status: 'published' },
      
      // Lớp 11A1 - Toán
      { classId: classes[2].id, subjectId: subjects[0].id, createdBy: teachers[1].id, title: 'Bài 1: Hàm số lượng giác', description: 'Giá trị lượng giác của một góc', status: 'published' },
      { classId: classes[2].id, subjectId: subjects[0].id, createdBy: teachers[1].id, title: 'Bài 2: Phương trình lượng giác', description: 'Giải các phương trình lượng giác cơ bản', status: 'published' },
      
      // Lớp 12A1 - Toán
      { classId: classes[4].id, subjectId: subjects[0].id, createdBy: teachers[2].id, title: 'Bài 1: Nguyên hàm', description: 'Khái niệm nguyên hàm và tính chất', status: 'published' },
      { classId: classes[4].id, subjectId: subjects[0].id, createdBy: teachers[2].id, title: 'Bài 2: Tích phân', description: 'Khái niệm tích phân và ứng dụng', status: 'draft' },
    ];

    for (const data of lessonData) {
      const lesson = await Lesson.create(data);
      lessons.push(lesson);
    }
    console.log(`✅ Đã tạo ${lessons.length} bài giảng\n`);

    // ===================== 7. TẠO ASSIGNMENTS =====================
    console.log('📋 Tạo Assignments...');
    const assignmentsList = [];
    
    const assignmentData = [
      // Lớp 10A1 - Toán (Teacher An)
      {
        title: 'Bài tập về Mệnh đề',
        description: 'Làm các bài tập từ 1 đến 10 trang 15',
        type: 'file_upload',
        classId: classes[0].id,
        subjectId: subjects[0].id,
        createdBy: teachers[0].id,
        dueDate: new Date('2025-12-15'),
        status: 'published',
        instructions: 'Nộp file PDF hoặc ảnh chụp bài làm',
        allowedFileTypes: 'pdf,jpg,png',
        maxFileSize: 5242880, // 5MB in bytes
        autoGrade: false,
        showCorrectAnswers: false
      },
      {
        title: 'Bài kiểm tra trắc nghiệm Tập hợp',
        description: 'Bài kiểm tra 15 phút',
        type: 'mcq',
        classId: classes[0].id,
        subjectId: subjects[0].id,
        createdBy: teachers[0].id,
        dueDate: new Date('2025-12-20'),
        status: 'published',
        autoGrade: true,
        showCorrectAnswers: true,
        mcqQuestions: JSON.stringify([
          {
            question: 'Tập hợp nào sau đây là tập hợp rỗng?',
            options: ['A = {0}', 'B = {}', 'C = {1,2,3}', 'D = {x | x > 0}'],
            correctAnswer: 1
          },
          {
            question: 'Cho A = {1,2,3}, B = {2,3,4}. Tập A ∩ B là?',
            options: ['{1,2,3,4}', '{2,3}', '{1}', '{4}'],
            correctAnswer: 1
          }
        ])
      },
      
      // Lớp 10A1 - Vật lý (Teacher Bình)
      {
        title: 'Bài tập Chuyển động thẳng đều',
        description: 'Giải các bài tập về chuyển động thẳng đều',
        type: 'essay',
        classId: classes[0].id,
        subjectId: subjects[1].id,
        createdBy: teachers[1].id,
        dueDate: new Date('2025-12-18'),
        status: 'published',
        instructions: 'Trình bày chi tiết lời giải',
        autoGrade: false,
        showCorrectAnswers: false
      },
      
      // Lớp 11A1 - Toán (Teacher Bình)
      {
        title: 'Bài tập Hàm số lượng giác',
        description: 'Bài tập về giá trị lượng giác',
        type: 'file_upload',
        classId: classes[2].id,
        subjectId: subjects[0].id,
        createdBy: teachers[1].id,
        dueDate: new Date('2025-12-22'),
        status: 'published',
        instructions: 'Nộp file bài làm',
        allowedFileTypes: 'pdf,docx',
        maxFileSize: 5242880, // 5MB in bytes
        autoGrade: false,
        showCorrectAnswers: false
      },
      
      // Lớp 12A1 - Toán (Teacher Cường)
      {
        title: 'Bài tập Nguyên hàm',
        description: 'Tính nguyên hàm của các hàm số',
        type: 'file_upload',
        classId: classes[4].id,
        subjectId: subjects[0].id,
        createdBy: teachers[2].id,
        dueDate: new Date('2025-12-25'),
        status: 'published',
        instructions: 'Làm bài tập từ 1-15',
        allowedFileTypes: 'pdf,jpg,png',
        maxFileSize: 10485760, // 10MB in bytes
        autoGrade: false,
        showCorrectAnswers: false
      },
    ];

    for (const data of assignmentData) {
      const assignment = await Assignment.create(data);
      assignmentsList.push(assignment);
    }
    console.log(`✅ Đã tạo ${assignmentsList.length} bài tập\n`);

    // ===================== 8. TẠO SUBMISSIONS =====================
    console.log('📤 Tạo Submissions...');
    const submissions = [];
    
    // Một số học sinh nộp bài
    const submissionData = [
      // Học sinh 1 nộp bài tập Toán
      {
        assignmentId: assignmentsList[0].id,
        studentId: students[0].id,
        content: 'Bài làm của học sinh Minh Anh về Mệnh đề',
        submittedAt: new Date('2025-12-10'),
        status: 'graded',
        grade: 9,
        feedback: 'Bài làm tốt, trình bày rõ ràng'
      },
      {
        assignmentId: assignmentsList[0].id,
        studentId: students[1].id,
        content: 'Bài làm của học sinh Quốc Bảo về Mệnh đề',
        submittedAt: new Date('2025-12-12'),
        status: 'graded',
        grade: 8.5,
        feedback: 'Bài làm khá tốt'
      },
      
      // Học sinh nộp bài trắc nghiệm
      {
        assignmentId: assignmentsList[1].id,
        studentId: students[0].id,
        mcqAnswers: JSON.stringify([1, 1]),
        submittedAt: new Date('2025-12-15'),
        status: 'graded',
        grade: 10,
        feedback: 'Hoàn thành xuất sắc'
      },
      
      // Học sinh lớp 11A1 nộp bài
      {
        assignmentId: assignmentsList[3].id,
        studentId: students[6].id,
        content: 'Bài làm về hàm số lượng giác',
        submittedAt: new Date('2025-12-20'),
        status: 'submitted'
      },
      
      // Học sinh lớp 12A1 nộp bài
      {
        assignmentId: assignmentsList[4].id,
        studentId: students[12].id,
        content: 'Bài tập nguyên hàm',
        submittedAt: new Date('2025-12-23'),
        status: 'graded',
        grade: 9.5,
        feedback: 'Rất tốt, làm đầy đủ'
      },
    ];

    for (const data of submissionData) {
      const submission = await Submission.create(data);
      submissions.push(submission);
    }
    console.log(`✅ Đã tạo ${submissions.length} bài nộp\n`);

    // ===================== 8.1. TẠO ATTACHMENTS =====================
    console.log('📎 Tạo Attachments...');
    const attachments = [];
    
    // Attachments cho Lessons
    const lessonAttachmentData = [
      // Lesson 1 - Mệnh đề (2 files)
      {
        attachableType: 'lesson',
        attachableId: lessons[0].id,
        fileName: 'Bai_giang_Menh_de.pdf',
        fileUrl: '/uploads/lessons/1730280000000-Bai_giang_Menh_de.pdf',
        fileSize: 2048576, // 2MB
        fileType: 'pdf',
        mimeType: 'application/pdf',
        uploadedBy: teachers[0].id,
        description: 'Bài giảng chi tiết về mệnh đề',
        sortOrder: 1
      },
      {
        attachableType: 'lesson',
        attachableId: lessons[0].id,
        fileName: 'Bai_tap_Menh_de.docx',
        fileUrl: '/uploads/lessons/1730280100000-Bai_tap_Menh_de.docx',
        fileSize: 512000, // 500KB
        fileType: 'docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        uploadedBy: teachers[0].id,
        description: 'Bài tập về mệnh đề',
        sortOrder: 2
      },
      
      // Lesson 2 - Tập hợp (1 file)
      {
        attachableType: 'lesson',
        attachableId: lessons[1].id,
        fileName: 'Tap_hop_ly_thuyet.pdf',
        fileUrl: '/uploads/lessons/1730290000000-Tap_hop_ly_thuyet.pdf',
        fileSize: 3145728, // 3MB
        fileType: 'pdf',
        mimeType: 'application/pdf',
        uploadedBy: teachers[0].id,
        description: 'Lý thuyết về tập hợp',
        sortOrder: 1
      },
      {
        attachableType: 'lesson',
        attachableId: lessons[1].id,
        fileName: 'Tap_hop_slide.pptx',
        fileUrl: '/uploads/lessons/1730290100000-Tap_hop_slide.pptx',
        fileSize: 5242880, // 5MB
        fileType: 'pptx',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        uploadedBy: teachers[0].id,
        description: 'Slide bài giảng',
        sortOrder: 2
      },
      
      // Lesson 4 - Chuyển động cơ học (video + pdf)
      {
        attachableType: 'lesson',
        attachableId: lessons[3].id,
        fileName: 'Chuyen_dong_co_hoc.pdf',
        fileUrl: '/uploads/lessons/1730300000000-Chuyen_dong_co_hoc.pdf',
        fileSize: 1572864, // 1.5MB
        fileType: 'pdf',
        mimeType: 'application/pdf',
        uploadedBy: teachers[1].id,
        description: 'Tài liệu bài giảng',
        sortOrder: 1
      },
      {
        attachableType: 'lesson',
        attachableId: lessons[3].id,
        fileName: 'Video_mo_phong_chuyen_dong.mp4',
        fileUrl: '/uploads/lessons/1730300100000-Video_mo_phong_chuyen_dong.mp4',
        fileSize: 15728640, // 15MB
        fileType: 'mp4',
        mimeType: 'video/mp4',
        uploadedBy: teachers[1].id,
        description: 'Video mô phỏng chuyển động',
        sortOrder: 2
      },
      
      // Lesson 8 - Nguyên hàm
      {
        attachableType: 'lesson',
        attachableId: lessons[7].id,
        fileName: 'Nguyen_ham_bang_tong_hop.xlsx',
        fileUrl: '/uploads/lessons/1730310000000-Nguyen_ham_bang_tong_hop.xlsx',
        fileSize: 819200, // 800KB
        fileType: 'xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        uploadedBy: teachers[2].id,
        description: 'Bảng công thức nguyên hàm',
        sortOrder: 1
      }
    ];
    
    // Attachments cho Assignments
    const assignmentAttachmentData = [
      // Assignment 1 - Bài tập về Mệnh đề
      {
        attachableType: 'assignment',
        attachableId: assignmentsList[0].id,
        fileName: 'De_bai_Menh_de.pdf',
        fileUrl: '/uploads/assignments/1730320000000-De_bai_Menh_de.pdf',
        fileSize: 1048576, // 1MB
        fileType: 'pdf',
        mimeType: 'application/pdf',
        uploadedBy: teachers[0].id,
        description: 'Đề bài chi tiết',
        sortOrder: 1
      },
      {
        attachableType: 'assignment',
        attachableId: assignmentsList[0].id,
        fileName: 'Huong_dan_lam_bai.docx',
        fileUrl: '/uploads/assignments/1730320100000-Huong_dan_lam_bai.docx',
        fileSize: 512000, // 500KB
        fileType: 'docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        uploadedBy: teachers[0].id,
        description: 'Hướng dẫn làm bài',
        sortOrder: 2
      },
      
      // Assignment 3 - Bài tập Vật lý
      {
        attachableType: 'assignment',
        attachableId: assignmentsList[2].id,
        fileName: 'Bai_tap_Chuyen_dong.pdf',
        fileUrl: '/uploads/assignments/1730330000000-Bai_tap_Chuyen_dong.pdf',
        fileSize: 2097152, // 2MB
        fileType: 'pdf',
        mimeType: 'application/pdf',
        uploadedBy: teachers[1].id,
        description: 'Đề bài tập',
        sortOrder: 1
      }
    ];
    
    // Attachments cho Submissions
    const submissionAttachmentData = [
      // Submission 1 - Học sinh Minh Anh nộp bài (2 files)
      {
        attachableType: 'submission',
        attachableId: submissions[0].id,
        fileName: 'Bai_lam_Menh_de_MinhAnh.pdf',
        fileUrl: '/uploads/submissions/submission-1-1730340000000-Bai_lam_Menh_de_MinhAnh.pdf',
        fileSize: 3145728, // 3MB
        fileType: 'pdf',
        mimeType: 'application/pdf',
        uploadedBy: students[0].id,
        description: 'Bài làm về mệnh đề',
        sortOrder: 1
      },
      {
        attachableType: 'submission',
        attachableId: submissions[0].id,
        fileName: 'Phu_luc_MinhAnh.jpg',
        fileUrl: '/uploads/submissions/submission-1-1730340100000-Phu_luc_MinhAnh.jpg',
        fileSize: 1048576, // 1MB
        fileType: 'jpg',
        mimeType: 'image/jpeg',
        uploadedBy: students[0].id,
        description: 'Hình ảnh minh họa',
        sortOrder: 2
      },
      
      // Submission 2 - Học sinh Quốc Bảo
      {
        attachableType: 'submission',
        attachableId: submissions[1].id,
        fileName: 'Bai_lam_QuocBao.pdf',
        fileUrl: '/uploads/submissions/submission-2-1730350000000-Bai_lam_QuocBao.pdf',
        fileSize: 2621440, // 2.5MB
        fileType: 'pdf',
        mimeType: 'application/pdf',
        uploadedBy: students[1].id,
        description: 'Bài làm của Quốc Bảo',
        sortOrder: 1
      },
      
      // Submission 4 - Lớp 11A1
      {
        attachableType: 'submission',
        attachableId: submissions[3].id,
        fileName: 'Ham_luong_giac_bai_lam.docx',
        fileUrl: '/uploads/submissions/submission-7-1730360000000-Ham_luong_giac_bai_lam.docx',
        fileSize: 1572864, // 1.5MB
        fileType: 'docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        uploadedBy: students[6].id,
        description: 'Bài làm hàm lượng giác',
        sortOrder: 1
      },
      {
        attachableType: 'submission',
        attachableId: submissions[3].id,
        fileName: 'Do_thi_ham_luong_giac.png',
        fileUrl: '/uploads/submissions/submission-7-1730360100000-Do_thi_ham_luong_giac.png',
        fileSize: 524288, // 512KB
        fileType: 'png',
        mimeType: 'image/png',
        uploadedBy: students[6].id,
        description: 'Đồ thị hàm lượng giác',
        sortOrder: 2
      },
      
      // Submission 5 - Lớp 12A1 (multiple files)
      {
        attachableType: 'submission',
        attachableId: submissions[4].id,
        fileName: 'Nguyen_ham_bai_lam.pdf',
        fileUrl: '/uploads/submissions/submission-13-1730370000000-Nguyen_ham_bai_lam.pdf',
        fileSize: 4194304, // 4MB
        fileType: 'pdf',
        mimeType: 'application/pdf',
        uploadedBy: students[12].id,
        description: 'Bài làm nguyên hàm',
        sortOrder: 1
      },
      {
        attachableType: 'submission',
        attachableId: submissions[4].id,
        fileName: 'Giai_chi_tiet.docx',
        fileUrl: '/uploads/submissions/submission-13-1730370100000-Giai_chi_tiet.docx',
        fileSize: 1048576, // 1MB
        fileType: 'docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        uploadedBy: students[12].id,
        description: 'Giải chi tiết từng bước',
        sortOrder: 2
      },
      {
        attachableType: 'submission',
        attachableId: submissions[4].id,
        fileName: 'Ket_qua_tong_hop.xlsx',
        fileUrl: '/uploads/submissions/submission-13-1730370200000-Ket_qua_tong_hop.xlsx',
        fileSize: 614400, // 600KB
        fileType: 'xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        uploadedBy: students[12].id,
        description: 'Bảng tổng hợp kết quả',
        sortOrder: 3
      }
    ];
    
    // Tạo tất cả attachments
    const allAttachmentData = [
      ...lessonAttachmentData,
      ...assignmentAttachmentData,
      ...submissionAttachmentData
    ];
    
    for (const data of allAttachmentData) {
      const attachment = await Attachment.create(data);
      attachments.push(attachment);
    }
    console.log(`✅ Đã tạo ${attachments.length} attachments`);
    console.log(`   - Lesson attachments: ${lessonAttachmentData.length}`);
    console.log(`   - Assignment attachments: ${assignmentAttachmentData.length}`);
    console.log(`   - Submission attachments: ${submissionAttachmentData.length}\n`);

    // ===================== 9. TẠO GRADES =====================
    console.log('💯 Tạo Grades...');
    const grades = [];
    
    // Tạo điểm cho học sinh
    const gradeData = [
      // Học sinh Minh Anh - Lớp 10A1 - Toán (Teacher An nhập)
      { studentId: students[0].id, subjectId: subjects[0].id, classId: classes[0].id, gradeValue: 9.0, gradeType: 'midterm', weight: 2, term: '1', academicYear: '2024-2025', recordedBy: teachers[0].id, recordedAt: new Date('2024-11-15'), remarks: 'Học tốt' },
      { studentId: students[0].id, subjectId: subjects[0].id, classId: classes[0].id, gradeValue: 8.5, gradeType: 'homework', weight: 1, term: '1', academicYear: '2024-2025', recordedBy: teachers[0].id, recordedAt: new Date('2024-11-10') },
      { studentId: students[0].id, subjectId: subjects[0].id, classId: classes[0].id, gradeValue: 9.5, gradeType: 'quiz', weight: 1.5, term: '1', academicYear: '2024-2025', recordedBy: teachers[0].id, recordedAt: new Date('2024-11-05') },
      
      // Học sinh Minh Anh - Vật lý (Teacher Bình nhập)
      { studentId: students[0].id, subjectId: subjects[1].id, classId: classes[0].id, gradeValue: 8.0, gradeType: 'midterm', weight: 2, term: '1', academicYear: '2024-2025', recordedBy: teachers[1].id, recordedAt: new Date('2024-11-16') },
      { studentId: students[0].id, subjectId: subjects[1].id, classId: classes[0].id, gradeValue: 8.5, gradeType: 'homework', weight: 2, term: '1', academicYear: '2024-2025', recordedBy: teachers[1].id, recordedAt: new Date('2024-11-12') },
      
      // Học sinh Quốc Bảo - Lớp 10A1 - Toán (Teacher An nhập)
      { studentId: students[1].id, subjectId: subjects[0].id, classId: classes[0].id, gradeValue: 8.5, gradeType: 'midterm', weight: 2, term: '1', academicYear: '2024-2025', recordedBy: teachers[0].id, recordedAt: new Date('2024-11-15') },
      { studentId: students[1].id, subjectId: subjects[0].id, classId: classes[0].id, gradeValue: 9.0, gradeType: 'homework', weight: 1, term: '1', academicYear: '2024-2025', recordedBy: teachers[0].id, recordedAt: new Date('2024-11-10') },
      
      // Học sinh Quốc Bảo - Vật lý (Teacher Bình nhập)
      { studentId: students[1].id, subjectId: subjects[1].id, classId: classes[0].id, gradeValue: 7.5, gradeType: 'midterm', weight: 2, term: '1', academicYear: '2024-2025', recordedBy: teachers[1].id, recordedAt: new Date('2024-11-16') },
      
      // Học sinh Thị Cẩm - Lớp 10A1 - Toán (Teacher An nhập)
      { studentId: students[2].id, subjectId: subjects[0].id, classId: classes[0].id, gradeValue: 9.0, gradeType: 'midterm', weight: 2, term: '1', academicYear: '2024-2025', recordedBy: teachers[0].id, recordedAt: new Date('2024-11-15') },
      { studentId: students[2].id, subjectId: subjects[0].id, classId: classes[0].id, gradeValue: 9.5, gradeType: 'homework', weight: 1, term: '1', academicYear: '2024-2025', recordedBy: teachers[0].id, recordedAt: new Date('2024-11-10') },
      
      // Học sinh lớp 11A1 - Toán (Teacher Bình nhập)
      { studentId: students[6].id, subjectId: subjects[0].id, classId: classes[2].id, gradeValue: 8.0, gradeType: 'midterm', weight: 2, term: '1', academicYear: '2024-2025', recordedBy: teachers[1].id, recordedAt: new Date('2024-11-17') },
      { studentId: students[7].id, subjectId: subjects[0].id, classId: classes[2].id, gradeValue: 8.5, gradeType: 'midterm', weight: 2, term: '1', academicYear: '2024-2025', recordedBy: teachers[1].id, recordedAt: new Date('2024-11-17') },
      
      // Học sinh lớp 12A1 - Toán (Teacher Cường nhập)
      { studentId: students[12].id, subjectId: subjects[0].id, classId: classes[4].id, gradeValue: 9.5, gradeType: 'midterm', weight: 2, term: '1', academicYear: '2024-2025', recordedBy: teachers[2].id, recordedAt: new Date('2024-11-18'), remarks: 'Xuất sắc' },
      { studentId: students[13].id, subjectId: subjects[0].id, classId: classes[4].id, gradeValue: 8.0, gradeType: 'midterm', weight: 2, term: '1', academicYear: '2024-2025', recordedBy: teachers[2].id, recordedAt: new Date('2024-11-18') },
      { studentId: students[14].id, subjectId: subjects[0].id, classId: classes[4].id, gradeValue: 7.5, gradeType: 'midterm', weight: 2, term: '1', academicYear: '2024-2025', recordedBy: teachers[2].id, recordedAt: new Date('2024-11-18') },
    ];

    for (const data of gradeData) {
      const grade = await Grade.create(data);
      grades.push(grade);
    }
    console.log(`✅ Đã tạo ${grades.length} bản ghi điểm\n`);

    // ===================== 10. TẠO FORUM POSTS =====================
    console.log('💬 Tạo Forum Posts...');
    const forumPosts = [];
    
    const postData = [
      {
        classId: classes[0].id,
        authorId: students[0].id,
        title: 'Hỏi về bài tập Toán tuần này',
        content: 'Mọi người cho mình hỏi cách giải bài 5 trang 20 với ạ. Mình làm mãi không ra.',
        isPinned: false,
        isLocked: false,
        tags: JSON.stringify(['toán học', 'bài tập'])
      },
      {
        classId: classes[0].id,
        authorId: teachers[0].id,
        title: 'Thông báo: Lịch kiểm tra giữa kỳ',
        content: 'Lớp 10A1 sẽ có bài kiểm tra giữa kỳ môn Toán vào thứ 6 tuần sau. Các em chuẩn bị ôn tập nhé!',
        isPinned: true,
        isLocked: false,
        tags: JSON.stringify(['thông báo', 'kiểm tra'])
      },
      {
        classId: classes[0].id,
        authorId: students[1].id,
        title: 'Share tài liệu ôn thi Vật lý',
        content: 'Mình có tài liệu tổng hợp các công thức Vật lý 10, ai cần thì nhắn mình nhé!',
        isPinned: false,
        isLocked: false,
        tags: JSON.stringify(['vật lý', 'tài liệu'])
      },
      {
        classId: classes[2].id,
        authorId: students[6].id,
        title: 'Câu hỏi về phương trình lượng giác',
        content: 'Thầy ơi, cho em hỏi khi nào thì dùng công thức biến đổi tích thành tổng ạ?',
        isPinned: false,
        isLocked: false,
        tags: JSON.stringify(['toán học', 'lượng giác'])
      },
      {
        classId: classes[4].id,
        authorId: teachers[2].id,
        title: 'Hướng dẫn làm bài tập Tích phân',
        content: 'Các em chú ý khi làm bài tập tích phân cần:\n1. Tìm nguyên hàm\n2. Áp dụng công thức Newton-Leibniz\n3. Tính giá trị',
        isPinned: true,
        isLocked: false,
        tags: JSON.stringify(['toán học', 'hướng dẫn'])
      },
    ];

    for (const data of postData) {
      const post = await ForumPost.create(data);
      forumPosts.push(post);
    }
    console.log(`✅ Đã tạo ${forumPosts.length} bài viết diễn đàn\n`);

    // ===================== 11. TẠO FORUM COMMENTS =====================
    console.log('💭 Tạo Forum Comments...');
    const forumComments = [];
    
    const commentData = [
      // Comments cho bài viết 1
      {
        postId: forumPosts[0].id,
        authorId: students[1].id,
        content: 'Mình cũng đang thắc mắc bài này. Ai biết giải giúp với!'
      },
      {
        postId: forumPosts[0].id,
        authorId: teachers[0].id,
        content: 'Bài này các em cần áp dụng công thức khai triển nhị thức Newton. Thầy sẽ giải chi tiết trên lớp nhé.'
      },
      {
        postId: forumPosts[0].id,
        authorId: students[0].id,
        content: 'Cảm ơn thầy ạ! Em hiểu rồi.'
      },
      
      // Comments cho bài viết 2
      {
        postId: forumPosts[1].id,
        authorId: students[0].id,
        content: 'Dạ em đã biết ạ. Cảm ơn thầy!'
      },
      {
        postId: forumPosts[1].id,
        authorId: students[2].id,
        content: 'Em sẽ chuẩn bị kỹ ạ!'
      },
      
      // Comments cho bài viết 3
      {
        postId: forumPosts[2].id,
        authorId: students[0].id,
        content: 'Mình cần tài liệu này lắm. Bạn gửi cho mình được không?'
      },
      
      // Comments cho bài viết 4
      {
        postId: forumPosts[3].id,
        authorId: teachers[1].id,
        content: 'Em dùng công thức đó khi cần chuyển tích thành tổng để dễ tính tích phân em nhé.'
      },
    ];

    for (const data of commentData) {
      const comment = await ForumComment.create(data);
      forumComments.push(comment);
    }
    console.log(`✅ Đã tạo ${forumComments.length} comments\n`);

    // ===================== 12. TẠO FORUM LIKES =====================
    console.log('❤️ Tạo Forum Likes...');
    const forumLikes = [];
    
    const likeData = [
      // Likes cho bài viết
      { userId: students[1].id, targetType: 'post', targetId: forumPosts[0].id, likeType: 'like' },
      { userId: students[2].id, targetType: 'post', targetId: forumPosts[0].id, likeType: 'love' },
      { userId: students[0].id, targetType: 'post', targetId: forumPosts[1].id, likeType: 'like' },
      { userId: students[1].id, targetType: 'post', targetId: forumPosts[1].id, likeType: 'like' },
      { userId: students[2].id, targetType: 'post', targetId: forumPosts[1].id, likeType: 'wow' },
      { userId: students[0].id, targetType: 'post', targetId: forumPosts[2].id, likeType: 'like' },
      { userId: students[12].id, targetType: 'post', targetId: forumPosts[4].id, likeType: 'like' },
      { userId: students[13].id, targetType: 'post', targetId: forumPosts[4].id, likeType: 'love' },
    ];

    for (const data of likeData) {
      const like = await ForumLike.create(data);
      forumLikes.push(like);
    }
    console.log(`✅ Đã tạo ${forumLikes.length} likes\n`);

    // ===================== 13. TẠO NOTIFICATIONS =====================
    console.log('🔔 Tạo Notifications...');
    const notifications = [];
    
    const notificationData = [
      // Thông báo cho tất cả học sinh
      {
        senderId: admin.id,
        receiverRole: 'student',
        title: 'Thông báo: Lịch nghỉ Tết Nguyên Đán',
        message: 'Nhà trường thông báo lịch nghỉ Tết Nguyên Đán từ ngày 25/1 đến 3/2/2025',
        type: 'announcement',
        priority: 'high',
        expiresAt: new Date('2025-02-03')
      },
      
      // Thông báo cho học sinh lớp 10A1
      {
        senderId: teachers[0].id,
        receiverRole: 'student',
        classId: classes[0].id,
        title: 'Bài tập mới',
        message: 'Thầy vừa giao bài tập mới về Mệnh đề. Hạn nộp 15/12.',
        type: 'assignment',
        priority: 'medium'
      },
      {
        senderId: teachers[0].id,
        receiverRole: 'student',
        classId: classes[0].id,
        title: 'Bài tập mới',
        message: 'Thầy vừa giao bài tập mới về Mệnh đề. Hạn nộp 15/12.',
        type: 'assignment',
        priority: 'medium'
      },
      
      // Thông báo điểm
      {
        senderId: teachers[0].id,
        receiverRole: 'student',
        subjectId: subjects[0].id,
        classId: classes[0].id,
        title: 'Điểm bài kiểm tra',
        message: 'Bạn đã được chấm điểm bài kiểm tra giữa kỳ môn Toán: 9.0',
        type: 'grade',
        priority: 'low',
        isRead: false
      },
      {
        senderId: teachers[0].id,
        receiverRole: 'student',
        subjectId: subjects[0].id,
        classId: classes[0].id,
        title: 'Điểm bài kiểm tra',
        message: 'Bạn đã được chấm điểm bài kiểm tra giữa kỳ môn Toán: 8.5',
        type: 'grade',
        priority: 'low',
        isRead: true
      },
      
      // Thông báo diễn đàn
      {
        senderId: students[1].id,
        receiverRole: 'student',
        classId: classes[0].id,
        title: 'Bình luận mới',
        message: 'Quốc Bảo đã bình luận vào bài viết của bạn',
        type: 'forum',
        priority: 'low'
      },
      
      // Thông báo nhắc nhở
      {
        senderId: admin.id,
        receiverRole: 'student',
        classId: classes[0].id,
        title: 'Nhắc nhở: Sắp hết hạn nộp bài',
        message: 'Bài tập môn Toán sẽ hết hạn nộp vào ngày mai',
        type: 'reminder',
        priority: 'urgent'
      },
      
      // Thông báo cho giáo viên
      {
        senderId: admin.id,
        receiverRole: 'teacher',
        title: 'Họp giáo viên',
        message: 'Thông báo họp giáo viên vào thứ 6 tuần sau lúc 14h',
        type: 'announcement',
        priority: 'high'
      },
    ];

    for (const data of notificationData) {
      const notification = await Notification.create(data);
      notifications.push(notification);
    }
    console.log(`✅ Đã tạo ${notifications.length} thông báo\n`);

    // ===================== TỔNG KẾT =====================
    console.log('\n🎉 ================================');
    console.log('✅ SEED DỮ LIỆU HOÀN TẤT!');
    console.log('================================\n');
    
    console.log('📊 THỐNG KÊ DỮ LIỆU:');
    console.log(`   👥 Users: ${teachers.length + students.length + 1} (1 admin, ${teachers.length} teachers, ${students.length} students)`);
    console.log(`   🏫 Classes: ${classes.length}`);
    console.log(`   📚 Subjects: ${subjects.length}`);
    console.log(`   👨‍🏫 Teacher Assignments: ${teacherAssignments.length}`);
    console.log(`   📝 Student Enrollments: ${enrollments.length}`);
    console.log(`   📖 Lessons: ${lessons.length}`);
    console.log(`   📋 Assignments: ${assignmentsList.length}`);
    console.log(`   📤 Submissions: ${submissions.length}`);
    console.log(`   � Attachments: ${attachments.length}`);
    console.log(`   �💯 Grades: ${grades.length}`);
    console.log(`   💬 Forum Posts: ${forumPosts.length}`);
    console.log(`   💭 Forum Comments: ${forumComments.length}`);
    console.log(`   ❤️ Forum Likes: ${forumLikes.length}`);
    console.log(`   🔔 Notifications: ${notifications.length}`);

    console.log('\n📋 THÔNG TIN ĐĂNG NHẬP:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👨‍💼 Admin:');
    console.log('   Email: admin@lms.com');
    console.log('   Password: Admin123456');
    console.log('\n👨‍🏫 Teachers:');
    console.log('   Email: teacher1@lms.com - teacher5@lms.com');
    console.log('   Password: Teacher123');
    console.log('\n👨‍🎓 Students:');
    console.log('   Email: student1@lms.com - student15@lms.com');
    console.log('   Password: Student123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

// Chạy seed
seedData();