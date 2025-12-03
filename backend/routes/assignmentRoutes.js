const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const assignmentController = require('../controllers/assignmentController');
const submissionController = require('../controllers/submissionController');
const { verifyToken, authorizeRole } = require('../middleware/auth');
const upload = require('../middlewares/upload');

// Helper function for role-based authentication
const auth = (roles) => {
  return [verifyToken, authorizeRole(roles)];
};

// Middleware validation
const createAssignmentValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Tiêu đề bài tập từ 1-255 ký tự'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Mô tả tối đa 5000 ký tự'),
  body('type')
    .isIn(['essay', 'file_upload', 'mcq'])
    .withMessage('Loại bài tập không hợp lệ'),
  body('classId')
    .isInt({ min: 1 })
    .withMessage('ID lớp học không hợp lệ'),
  body('subjectId')
    .isInt({ min: 1 })
    .withMessage('ID môn học không hợp lệ'),
  body('dueDate')
    .isISO8601()
    .toDate()
    .withMessage('Hạn nộp bài không hợp lệ'),
  body('maxGrade')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Điểm tối đa từ 0-100'),
  body('instructions')
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage('Hướng dẫn tối đa 10000 ký tự'),
  body('allowedFileTypes')
    .optional()
    .trim()
    .custom((value) => {
      if (value) {
        const types = value.split(',').map(t => t.trim());
        const validTypes = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'zip', 'rar'];
        return types.every(type => validTypes.includes(type.toLowerCase()));
      }
      return true;
    })
    .withMessage('Loại file không hợp lệ'),
  body('maxFileSize')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Kích thước file tối đa từ 1-50MB'),
  body('mcqQuestions')
    .optional()
    .custom((value) => {
      if (value) {
        try {
          const questions = JSON.parse(value);
          if (!Array.isArray(questions)) return false;
          
          return questions.every(q => 
            q.question && 
            Array.isArray(q.options) && 
            q.options.length >= 2 &&
            q.correctAnswer >= 0 && 
            q.correctAnswer < q.options.length
          );
        } catch {
          return false;
        }
      }
      return true;
    })
    .withMessage('Câu hỏi trắc nghiệm không hợp lệ'),
  body('autoGrade')
    .optional()
    .isBoolean()
    .withMessage('Auto grade phải là true/false'),
  body('showCorrectAnswers')
    .optional()
    .isBoolean()
    .withMessage('Show correct answers phải là true/false')
];

const updateAssignmentValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Tiêu đề bài tập từ 1-255 ký tự'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Mô tả tối đa 5000 ký tự'),
  body('dueDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Hạn nộp bài không hợp lệ'),
  body('maxGrade')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Điểm tối đa từ 0-100'),
  body('instructions')
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage('Hướng dẫn tối đa 10000 ký tự'),
  body('allowedFileTypes')
    .optional()
    .trim()
    .custom((value) => {
      if (value) {
        const types = value.split(',').map(t => t.trim());
        const validTypes = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'zip', 'rar'];
        return types.every(type => validTypes.includes(type.toLowerCase()));
      }
      return true;
    })
    .withMessage('Loại file không hợp lệ'),
  body('maxFileSize')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Kích thước file tối đa từ 1-50MB'),
  body('mcqQuestions')
    .optional()
    .custom((value) => {
      if (value) {
        try {
          const questions = JSON.parse(value);
          if (!Array.isArray(questions)) return false;
          
          return questions.every(q => 
            q.question && 
            Array.isArray(q.options) && 
            q.options.length >= 2 &&
            q.correctAnswer >= 0 && 
            q.correctAnswer < q.options.length
          );
        } catch {
          return false;
        }
      }
      return true;
    })
    .withMessage('Câu hỏi trắc nghiệm không hợp lệ'),
  body('autoGrade')
    .optional()
    .isBoolean()
    .withMessage('Auto grade phải là true/false'),
  body('showCorrectAnswers')
    .optional()
    .isBoolean()
    .withMessage('Show correct answers phải là true/false'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Trạng thái không hợp lệ')
];

const createSubmissionValidation = [
  param('assignmentId')
    .isInt({ min: 1 })
    .withMessage('ID bài tập không hợp lệ'),
  body('content')
    .optional()
    .trim()
    .isLength({ max: 20000 })
    .withMessage('Nội dung tối đa 20000 ký tự'),
  body('mcqAnswers')
    .optional()
    .custom((value) => {
      if (value) {
        try {
          const answers = JSON.parse(value);
          return Array.isArray(answers);
        } catch {
          return false;
        }
      }
      return true;
    })
    .withMessage('Câu trả lời trắc nghiệm không hợp lệ')
];

const gradeSubmissionValidation = [
  body('grade')
    .isFloat({ min: 0 })
    .withMessage('Điểm không hợp lệ'),
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Nhận xét tối đa 2000 ký tự'),
  body('status')
    .optional()
    .isIn(['submitted', 'graded', 'late', 'missing', 'draft', 'returned'])
    .withMessage('Trạng thái không hợp lệ'),
  body('gradedBy')
    .optional()
    .isInt()
    .withMessage('ID người chấm không hợp lệ')
];

// =================
// ASSIGNMENT ROUTES
// =================

/**
 * @swagger
 * /api/v1/assignments:
 *   post:
 *     summary: Tạo bài tập mới
 *     description: Giáo viên hoặc Admin tạo bài tập mới cho lớp học
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - type
 *               - classId
 *               - subjectId
 *               - dueDate
 *               - maxGrade
 *             properties:
 *               title:
 *                 type: string
 *                 description: Tiêu đề bài tập
 *                 example: Bài tập tuần 1 - Toán học
 *               description:
 *                 type: string
 *                 description: Mô tả bài tập
 *                 example: Làm bài tập về phương trình bậc hai
 *               type:
 *                 type: string
 *                 enum: [essay, file_upload, mcq]
 *                 description: Loại bài tập
 *                 example: essay
 *               classId:
 *                 type: integer
 *                 description: ID lớp học
 *                 example: 1
 *               subjectId:
 *                 type: integer
 *                 description: ID môn học
 *                 example: 1
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Hạn nộp bài
 *                 example: 2024-12-31T23:59:59Z
 *               maxGrade:
 *                 type: number
 *                 description: Điểm tối đa
 *                 example: 10
 *               instructions:
 *                 type: string
 *                 description: Hướng dẫn làm bài
 *                 example: Giải các bài tập từ 1 đến 10
 *               allowedFileTypes:
 *                 type: string
 *                 description: Các loại file được phép (cách nhau bởi dấu phẩy)
 *                 example: pdf,doc,docx
 *               maxFileSize:
 *                 type: integer
 *                 description: Kích thước file tối đa (MB)
 *                 example: 10
 *               mcqQuestions:
 *                 type: string
 *                 description: JSON string chứa danh sách câu hỏi trắc nghiệm
 *                 example: '[{"question":"2+2=?","options":["3","4","5","6"],"correctAnswer":1}]'
 *               autoGrade:
 *                 type: boolean
 *                 description: Tự động chấm điểm
 *                 example: true
 *               showCorrectAnswers:
 *                 type: boolean
 *                 description: Hiện đáp án đúng sau khi nộp
 *                 example: true
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Các file đính kèm (tối đa 10 files) - Sử dụng field 'files'
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Một file đính kèm - Sử dụng field 'file' (backward compatibility)
 *     responses:
 *       201:
 *         description: Tạo bài tập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Tạo bài tập thành công
 *                 data:
 *                   $ref: '#/components/schemas/Assignment'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 */
// Tạo bài tập mới (Admin, Teacher)
router.post(
  '/',
  ...auth(['admin', 'teacher']),
  upload.assignmentUploadFlexible,
  upload.validateUploadedFiles,
  ...createAssignmentValidation,
  assignmentController.createAssignment
);

/**
 * @swagger
 * /api/v1/assignments:
 *   get:
 *     summary: Lấy danh sách bài tập
 *     description: Lấy danh sách bài tập với phân trang và filter
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng bài tập mỗi trang
 *       - in: query
 *         name: classId
 *         schema:
 *           type: integer
 *         description: Lọc theo ID lớp học
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: integer
 *         description: Lọc theo ID môn học
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [essay, file_upload, mcq]
 *         description: Lọc theo loại bài tập
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, closed]
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Sắp xếp theo trường
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Thứ tự sắp xếp
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     assignments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Assignment'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 5
 *                         totalItems:
 *                           type: integer
 *                           example: 50
 *                         itemsPerPage:
 *                           type: integer
 *                           example: 10
 *       401:
 *         description: Chưa xác thực
 */
// Lấy danh sách bài tập
router.get(
  '/',
  ...auth(['admin', 'teacher', 'student']),
  assignmentController.getAssignments
);

/**
 * @swagger
 * /api/v1/assignments/my-submissions:
 *   get:
 *     summary: Lấy danh sách bài nộp của học sinh
 *     description: Học sinh xem danh sách bài nộp của mình
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng bài nộp mỗi trang
 *       - in: query
 *         name: classId
 *         schema:
 *           type: integer
 *         description: Lọc theo ID lớp học
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: integer
 *         description: Lọc theo ID môn học
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, graded, late]
 *         description: Lọc theo trạng thái
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     submissions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Submission'
 *                     pagination:
 *                       type: object
 *       401:
 *         description: Chưa xác thực
 */
// Lấy danh sách submission của học sinh hiện tại (phải đặt TRƯỚC route /:id)
router.get(
  '/my-submissions',
  ...auth(['student']),
  submissionController.getMySubmissions
);

/**
 * @swagger
 * /api/v1/assignments/{id}:
 *   get:
 *     summary: Lấy chi tiết bài tập
 *     description: Lấy thông tin chi tiết của một bài tập
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bài tập
 *     responses:
 *       200:
 *         description: Lấy chi tiết thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Assignment'
 *       404:
 *         description: Không tìm thấy bài tập
 *       401:
 *         description: Chưa xác thực
 */
// Lấy chi tiết bài tập
router.get(
  '/:id',
  ...auth(['admin', 'teacher', 'student']),
  assignmentController.getAssignmentById
);

/**
 * @swagger
 * /api/v1/assignments/{id}:
 *   put:
 *     summary: Cập nhật bài tập
 *     description: Cập nhật thông tin bài tập
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bài tập
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Bài tập tuần 2 - Toán học
 *               description:
 *                 type: string
 *                 example: Cập nhật mô tả bài tập
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-12-31T23:59:59Z
 *               maxGrade:
 *                 type: number
 *                 example: 10
 *               instructions:
 *                 type: string
 *                 example: Hướng dẫn mới
 *               allowedFileTypes:
 *                 type: string
 *                 example: pdf,doc,docx
 *               maxFileSize:
 *                 type: integer
 *                 example: 10
 *               mcqQuestions:
 *                 type: string
 *                 example: '[{"question":"2+2=?","options":["3","4","5","6"],"correctAnswer":1}]'
 *               autoGrade:
 *                 type: boolean
 *                 example: true
 *               showCorrectAnswers:
 *                 type: boolean
 *                 example: true
 *               status:
 *                 type: string
 *                 enum: [draft, published, closed]
 *                 example: published
 *               deleteAttachmentIds:
 *                 type: string
 *                 description: JSON string chứa mảng ID của các attachment cần xóa
 *                 example: '[1, 2, 3]'
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Các file đính kèm mới (tối đa 10 files) - Sử dụng field 'files'
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Một file đính kèm mới - Sử dụng field 'file' (backward compatibility)
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Cập nhật bài tập thành công
 *                 data:
 *                   $ref: '#/components/schemas/Assignment'
 *       404:
 *         description: Không tìm thấy bài tập
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
// Cập nhật bài tập (Admin, Teacher)
router.put(
  '/:id',
  ...auth(['admin', 'teacher']),
  upload.assignmentUploadFlexible,
  upload.validateUploadedFiles,
  ...updateAssignmentValidation,
  assignmentController.updateAssignment
);

/**
 * @swagger
 * /api/v1/assignments/{id}:
 *   delete:
 *     summary: Xóa bài tập
 *     description: Xóa bài tập (soft delete)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bài tập
 *     responses:
 *       200:
 *         description: Xóa thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Xóa bài tập thành công
 *       404:
 *         description: Không tìm thấy bài tập
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
// Xóa bài tập (Admin, Teacher)
router.delete(
  '/:id',
  ...auth(['admin', 'teacher']),
  assignmentController.deleteAssignment
);

/**
 * @swagger
 * /api/v1/assignments/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái bài tập
 *     description: Thay đổi trạng thái bài tập (draft/published/closed)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bài tập
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, published, closed]
 *                 example: published
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Cập nhật trạng thái thành công
 *                 data:
 *                   $ref: '#/components/schemas/Assignment'
 *       404:
 *         description: Không tìm thấy bài tập
 *       401:
 *         description: Chưa xác thực
 */
// Publish/Unpublish bài tập (Admin, Teacher)
router.patch(
  '/:id/status',
  ...auth(['admin', 'teacher']),
  body('status').isIn(['draft', 'published', 'archived']).withMessage('Trạng thái không hợp lệ'),
  assignmentController.updateAssignmentStatus
);

// =================
// SUBMISSION ROUTES
// =================

/**
 * @swagger
 * /api/v1/assignments/submissions/all:
 *   get:
 *     summary: Lấy tất cả bài nộp (Admin và Teacher)
 *     description: Admin/Teacher xem tất cả bài nộp trong hệ thống với các bộ lọc
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số lượng bài nộp mỗi trang
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [submitted, graded, late, missing]
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: classId
 *         schema:
 *           type: integer
 *         description: Lọc theo lớp học
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: integer
 *         description: Lọc theo môn học
 *       - in: query
 *         name: assignmentId
 *         schema:
 *           type: integer
 *         description: Lọc theo bài tập
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: integer
 *         description: Lọc theo học sinh
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: submittedAt
 *         description: Sắp xếp theo trường
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Thứ tự sắp xếp
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     submissions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Submission'
 *                     pagination:
 *                       type: object
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 */
// Lấy tất cả submissions (Admin only) - Phải đặt trước các route có :id hoặc :assignmentId
router.get(
  '/submissions/all',
  ...auth(['admin']),
  submissionController.getAllSubmissions
);

// Lấy submissions của teacher (Teacher only) - Phải đặt trước các route có :id
router.get(
  '/submissions/teacher',
  ...auth(['teacher']),
  submissionController.getTeacherSubmissions
);

/**
 * @swagger
 * /api/v1/assignments/{assignmentId}/submissions:
 *   post:
 *     summary: Nộp bài tập
 *     description: Học sinh nộp bài tập (chỉ học sinh)
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bài tập
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: Nội dung bài làm (cho essay)
 *                 example: Đây là bài làm của tôi về phương trình bậc hai...
 *               mcqAnswers:
 *                 type: string
 *                 description: JSON string chứa mảng đáp án trắc nghiệm (index của đáp án)
 *                 example: '[1, 0, 2, 3]'
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File nộp bài
 *     responses:
 *       201:
 *         description: Nộp bài thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Nộp bài thành công
 *                 data:
 *                   $ref: '#/components/schemas/Submission'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       404:
 *         description: Không tìm thấy bài tập
 */
// Nộp bài (Student only)
router.post(
  '/:assignmentId/submissions',
  ...auth(['student']),
  upload.submissionUploadMultiple,
  upload.validateUploadedFiles,
  ...createSubmissionValidation,
  submissionController.createSubmission
);

/**
 * @swagger
 * /api/v1/assignments/{assignmentId}/submissions:
 *   get:
 *     summary: Lấy danh sách bài nộp của bài tập
 *     description: Giáo viên/Admin xem danh sách bài nộp của một bài tập
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bài tập
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng bài nộp mỗi trang
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, graded, late]
 *         description: Lọc theo trạng thái
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     submissions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Submission'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 3
 *                         totalItems:
 *                           type: integer
 *                           example: 25
 *                         itemsPerPage:
 *                           type: integer
 *                           example: 10
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy bài tập
 */
// Lấy danh sách submission của bài tập (Admin, Teacher)
router.get(
  '/:assignmentId/submissions',
  ...auth(['admin', 'teacher']),
  submissionController.getSubmissionsByAssignment
);

/**
 * @swagger
 * /api/v1/assignments/submissions/{id}:
 *   get:
 *     summary: Lấy chi tiết bài nộp
 *     description: Xem chi tiết một bài nộp
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bài nộp
 *     responses:
 *       200:
 *         description: Lấy chi tiết thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Submission'
 *       404:
 *         description: Không tìm thấy bài nộp
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền xem bài nộp này
 */
// Lấy chi tiết submission
router.get(
  '/submissions/:id',
  ...auth(['admin', 'teacher', 'student']),
  submissionController.getSubmissionById
);

/**
 * @swagger
 * /api/v1/assignments/submissions/{id}/grade:
 *   put:
 *     summary: Chấm điểm bài nộp
 *     description: Giáo viên/Admin chấm điểm và nhận xét bài nộp
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bài nộp
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - grade
 *             properties:
 *               grade:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 description: Điểm số
 *                 example: 8.5
 *               feedback:
 *                 type: string
 *                 description: Nhận xét của giáo viên
 *                 example: Bài làm tốt, cần cải thiện phần 2
 *               status:
 *                 type: string
 *                 enum: [submitted, graded, late, missing, draft, returned]
 *                 description: Trạng thái bài nộp (mặc định là 'graded')
 *                 example: graded
 *               gradedBy:
 *                 type: integer
 *                 description: ID người chấm (mặc định là người dùng hiện tại, chỉ admin có thể chỉ định)
 *                 example: 1
 *     responses:
 *       200:
 *         description: Chấm điểm thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Chấm điểm thành công
 *                 data:
 *                   $ref: '#/components/schemas/Submission'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy bài nộp
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
// Chấm điểm submission (Admin, Teacher) - Pattern 1: /submissions/:id/grade
router.put(
  '/submissions/:id/grade',
  ...auth(['admin', 'teacher']),
  ...gradeSubmissionValidation,
  submissionController.gradeSubmission
);

// Chấm điểm submission (Admin, Teacher) - Pattern 2: /:assignmentId/submissions/:id/grade
router.put(
  '/:assignmentId/submissions/:id/grade',
  ...auth(['admin', 'teacher']),
  ...gradeSubmissionValidation,
  submissionController.gradeSubmission
);

/**
 * @swagger
 * /api/v1/assignments/submissions/{id}:
 *   delete:
 *     summary: Xóa bài nộp
 *     description: Admin xóa bài nộp (bao gồm cả file đính kèm)
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bài nộp
 *     responses:
 *       200:
 *         description: Xóa thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Xóa bài nộp thành công
 *       404:
 *         description: Không tìm thấy bài nộp
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền (chỉ admin)
 */
// Xóa submission (Admin only)
router.delete(
  '/submissions/:id',
  ...auth(['admin']),
  submissionController.deleteSubmission
);

module.exports = router;