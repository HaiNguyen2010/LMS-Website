const { body, param, query } = require('express-validator');

const classValidation = {
  // Validation cho tạo lớp học mới
  createClass: [
    body('name')
      .notEmpty()
      .withMessage('Tên lớp không được để trống')
      .isLength({ min: 1, max: 100 })
      .withMessage('Tên lớp phải từ 1-100 ký tự')
      .trim(),
    body('code')
      .notEmpty()
      .withMessage('Mã lớp không được để trống')
      .isLength({ min: 1, max: 20 })
      .withMessage('Mã lớp phải từ 1-20 ký tự')
      .trim(),
    body('maxStudents')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Sĩ số tối đa phải là số nguyên dương'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Mô tả không được quá 1000 ký tự')
      .trim()
  ],

  // Validation cho cập nhật lớp học
  updateClass: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID lớp học phải là số nguyên dương'),
    body('name')
      .optional()
      .notEmpty()
      .withMessage('Tên lớp không được để trống')
      .isLength({ min: 1, max: 100 })
      .withMessage('Tên lớp phải từ 1-100 ký tự')
      .trim(),
    body('code')
      .optional()
      .notEmpty()
      .withMessage('Mã lớp không được để trống')
      .isLength({ min: 1, max: 20 })
      .withMessage('Mã lớp phải từ 1-20 ký tự')
      .trim(),
    body('maxStudents')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Sĩ số tối đa phải là số nguyên dương'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Mô tả không được quá 1000 ký tự')
      .trim()
  ],

  // Validation cho xóa lớp học
  deleteClass: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID lớp học phải là số nguyên dương')
  ],

  // Validation cho lấy lớp học theo ID
  getClassById: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID lớp học phải là số nguyên dương')
  ],

  // Validation cho lấy danh sách lớp học
  getAllClasses: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Trang phải là số nguyên dương'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit phải là số nguyên từ 1-100'),
    query('grade')
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage('Khối phải là số nguyên từ 1-12'),
    query('search')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Từ khóa tìm kiếm không được quá 100 ký tự')
      .trim()
  ],

  // Validation cho lấy học sinh trong lớp
  getClassStudents: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID lớp học phải là số nguyên dương'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Trang phải là số nguyên dương'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit phải là số nguyên từ 1-100')
  ]
};

const subjectValidation = {
  // Validation cho tạo môn học mới
  createSubject: [
    body('name')
      .notEmpty()
      .withMessage('Tên môn học không được để trống')
      .isLength({ min: 1, max: 100 })
      .withMessage('Tên môn học phải từ 1-100 ký tự')
      .trim(),
    body('code')
      .optional()
      .isLength({ min: 1, max: 20 })
      .withMessage('Mã môn học phải từ 1-20 ký tự')
      .trim(),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Mô tả không được quá 1000 ký tự')
      .trim(),
    body('credits')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Số tín chỉ phải là số nguyên từ 1-10')
  ],

  // Validation cho cập nhật môn học
  updateSubject: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID môn học phải là số nguyên dương'),
    body('name')
      .optional()
      .notEmpty()
      .withMessage('Tên môn học không được để trống')
      .isLength({ min: 1, max: 100 })
      .withMessage('Tên môn học phải từ 1-100 ký tự')
      .trim(),
    body('code')
      .optional()
      .isLength({ min: 1, max: 20 })
      .withMessage('Mã môn học phải từ 1-20 ký tự')
      .trim(),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Mô tả không được quá 1000 ký tự')
      .trim(),
    body('credits')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Số tín chỉ phải là số nguyên từ 1-10')
  ],

  // Validation cho xóa môn học
  deleteSubject: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID môn học phải là số nguyên dương')
  ],

  // Validation cho lấy môn học theo ID
  getSubjectById: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID môn học phải là số nguyên dương')
  ],

  // Validation cho lấy danh sách môn học
  getAllSubjects: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Trang phải là số nguyên dương'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit phải là số nguyên từ 1-100'),
    query('search')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Từ khóa tìm kiếm không được quá 100 ký tự')
      .trim()
  ]
};

const teacherAssignmentValidation = {
  // Validation cho phân công giáo viên
  assignTeacher: [
    body('teacherId')
      .isInt({ min: 1 })
      .withMessage('ID giáo viên phải là số nguyên dương'),
    body('classId')
      .isInt({ min: 1 })
      .withMessage('ID lớp học phải là số nguyên dương'),
    body('subjectId')
      .isInt({ min: 1 })
      .withMessage('ID môn học phải là số nguyên dương'),
    body('startDate')
      .optional()
      .isISO8601()
      .withMessage('Ngày bắt đầu phải có định dạng hợp lệ (YYYY-MM-DD)'),
    body('endDate')
      .optional()
      .isISO8601()
      .withMessage('Ngày kết thúc phải có định dạng hợp lệ (YYYY-MM-DD)')
      .custom((value, { req }) => {
        if (value && req.body.startDate && new Date(value) <= new Date(req.body.startDate)) {
          throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
        }
        return true;
      })
  ],

  // Validation cho cập nhật phân công
  updateAssignment: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID phân công phải là số nguyên dương'),
    body('startDate')
      .optional()
      .isISO8601()
      .withMessage('Ngày bắt đầu phải có định dạng hợp lệ (YYYY-MM-DD)'),
    body('endDate')
      .optional()
      .isISO8601()
      .withMessage('Ngày kết thúc phải có định dạng hợp lệ (YYYY-MM-DD)')
      .custom((value, { req }) => {
        if (value && req.body.startDate && new Date(value) <= new Date(req.body.startDate)) {
          throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
        }
        return true;
      }),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('Trạng thái hoạt động phải là true hoặc false')
  ],

  // Validation cho xóa phân công
  deleteAssignment: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID phân công phải là số nguyên dương')
  ],

  // Validation cho lấy danh sách phân công
  getAllAssignments: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Trang phải là số nguyên dương'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit phải là số nguyên từ 1-100'),
    query('teacherId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('ID giáo viên phải là số nguyên dương'),
    query('classId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('ID lớp học phải là số nguyên dương'),
    query('subjectId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('ID môn học phải là số nguyên dương'),
    query('isActive')
      .optional()
      .isBoolean()
      .withMessage('Trạng thái hoạt động phải là true hoặc false')
  ],

  // Validation cho lấy phân công của giáo viên
  getTeacherAssignments: [
    param('teacherId')
      .isInt({ min: 1 })
      .withMessage('ID giáo viên phải là số nguyên dương'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Trang phải là số nguyên dương'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit phải là số nguyên từ 1-100'),
    query('isActive')
      .optional()
      .isBoolean()
      .withMessage('Trạng thái hoạt động phải là true hoặc false')
  ]
};

const studentEnrollmentValidation = {
  // Validation cho ghi danh một học sinh
  enrollStudent: [
    body('studentId')
      .isInt({ min: 1 })
      .withMessage('ID học sinh phải là số nguyên dương'),
    body('classId')
      .isInt({ min: 1 })
      .withMessage('ID lớp học phải là số nguyên dương'),
    body('enrollmentDate')
      .optional()
      .isISO8601()
      .withMessage('Ngày ghi danh phải có định dạng hợp lệ (YYYY-MM-DD)')
  ],

  // Validation cho ghi danh nhiều học sinh
  enrollMultipleStudents: [
    body('studentIds')
      .isArray({ min: 1 })
      .withMessage('Danh sách học sinh phải là mảng và không được rỗng'),
    body('studentIds.*')
      .isInt({ min: 1 })
      .withMessage('ID học sinh phải là số nguyên dương'),
    body('classId')
      .isInt({ min: 1 })
      .withMessage('ID lớp học phải là số nguyên dương'),
    body('enrollmentDate')
      .optional()
      .isISO8601()
      .withMessage('Ngày ghi danh phải có định dạng hợp lệ (YYYY-MM-DD)')
  ],

  // Validation cho lấy danh sách ghi danh
  getAllEnrollments: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Trang phải là số nguyên dương'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit phải là số nguyên từ 1-100'),
    query('classId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('ID lớp học phải là số nguyên dương'),
    query('studentId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('ID học sinh phải là số nguyên dương'),
    query('isActive')
      .optional()
      .isBoolean()
      .withMessage('Trạng thái hoạt động phải là true hoặc false'),
    query('search')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Từ khóa tìm kiếm không được quá 100 ký tự')
      .trim()
  ],

  // Validation cho cập nhật ghi danh
  updateEnrollment: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID ghi danh phải là số nguyên dương'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('Trạng thái hoạt động phải là true hoặc false'),
    body('enrollmentDate')
      .optional()
      .isISO8601()
      .withMessage('Ngày ghi danh phải có định dạng hợp lệ (YYYY-MM-DD)')
  ],

  // Validation cho xóa ghi danh
  deleteEnrollment: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID ghi danh phải là số nguyên dương')
  ],

  // Validation cho lấy lớp học của học sinh
  getStudentClasses: [
    param('studentId')
      .isInt({ min: 1 })
      .withMessage('ID học sinh phải là số nguyên dương'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Trang phải là số nguyên dương'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit phải là số nguyên từ 1-100'),
    query('isActive')
      .optional()
      .isBoolean()
      .withMessage('Trạng thái hoạt động phải là true hoặc false')
  ]
};

module.exports = {
  classValidation,
  subjectValidation,
  teacherAssignmentValidation,
  studentEnrollmentValidation
};