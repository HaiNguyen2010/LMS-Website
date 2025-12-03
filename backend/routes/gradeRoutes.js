const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const gradeController = require('../controllers/gradeController');
const { verifyToken, authorizeRole } = require('../middleware/auth');

// Helper function for role-based authentication
const auth = (roles) => {
  return [verifyToken, authorizeRole(roles)];
};

// Middleware validation cho tạo điểm
const createGradeValidation = [
  body('studentId')
    .isInt({ min: 1 })
    .withMessage('ID học sinh không hợp lệ'),
  body('subjectId')
    .isInt({ min: 1 })
    .withMessage('ID môn học không hợp lệ'),
  body('classId')
    .isInt({ min: 1 })
    .withMessage('ID lớp học không hợp lệ'),
  body('gradeValue')
    .isFloat({ min: 0, max: 10 })
    .withMessage('Điểm phải từ 0 đến 10'),
  body('gradeType')
    .isIn(['homework', 'quiz', 'midterm', 'final', 'assignment', 'participation'])
    .withMessage('Loại điểm không hợp lệ'),
  body('weight')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Trọng số phải từ 0 đến 100'),
  body('term')
    .isIn(['1', '2', 'final'])
    .withMessage('Học kỳ phải là 1, 2 hoặc final'),
  body('academicYear')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Năm học phải có định dạng YYYY-YYYY'),
  body('remarks')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Ghi chú không được vượt quá 1000 ký tự')
];

// Middleware validation cho cập nhật điểm
const updateGradeValidation = [
  body('gradeValue')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Điểm phải từ 0 đến 10'),
  body('weight')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Trọng số phải từ 0 đến 100'),
  body('remarks')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Ghi chú không được vượt quá 1000 ký tự')
];

// Middleware validation cho query parameters
const gradeQueryValidation = [
  query('classId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Class ID không hợp lệ'),
  query('subjectId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Subject ID không hợp lệ'),
  query('term')
    .optional()
    .isIn(['1', '2', 'final'])
    .withMessage('Học kỳ phải là 1, 2 hoặc final'),
  query('academicYear')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Năm học phải có định dạng YYYY-YYYY'),
  query('gradeType')
    .optional()
    .isIn(['homework', 'quiz', 'midterm', 'final', 'assignment', 'participation'])
    .withMessage('Loại điểm không hợp lệ'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Số trang phải là số nguyên dương'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit phải từ 1 đến 100'),
  query('sortBy')
    .optional()
    .isIn(['recordedAt', 'gradeValue', 'studentId', 'subjectId'])
    .withMessage('Trường sắp xếp không hợp lệ'),
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Thứ tự sắp xếp phải là ASC hoặc DESC')
];

/**
 * @swagger
 * components:
 *   schemas:
 *     Grade:
 *       type: object
 *       required:
 *         - studentId
 *         - subjectId
 *         - classId
 *         - gradeValue
 *         - gradeType
 *         - term
 *       properties:
 *         id:
 *           type: integer
 *           description: ID duy nhất của điểm
 *         studentId:
 *           type: integer
 *           description: ID học sinh
 *         subjectId:
 *           type: integer
 *           description: ID môn học
 *         classId:
 *           type: integer
 *           description: ID lớp học
 *         gradeValue:
 *           type: number
 *           minimum: 0
 *           maximum: 10
 *           description: Điểm số
 *         gradeType:
 *           type: string
 *           enum: [homework, quiz, midterm, final, assignment, participation]
 *           description: Loại điểm
 *         weight:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Trọng số
 *         term:
 *           type: string
 *           enum: [1, 2, final]
 *           description: Học kỳ
 *         academicYear:
 *           type: string
 *           pattern: ^\d{4}-\d{4}$
 *           description: Năm học (YYYY-YYYY)
 *         remarks:
 *           type: string
 *           maxLength: 1000
 *           description: Ghi chú
 *         recordedBy:
 *           type: integer
 *           description: ID người nhập điểm
 *         recordedAt:
 *           type: string
 *           format: date-time
 *           description: Thời gian nhập điểm
 *         isActive:
 *           type: boolean
 *           description: Trạng thái hoạt động
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/grades:
 *   post:
 *     tags: [Grades]
 *     summary: Nhập điểm mới
 *     description: Tạo điểm mới cho học sinh (chỉ Admin và Teacher)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - subjectId
 *               - classId
 *               - gradeValue
 *               - gradeType
 *               - term
 *             properties:
 *               studentId:
 *                 type: integer
 *                 description: ID học sinh
 *               subjectId:
 *                 type: integer
 *                 description: ID môn học
 *               classId:
 *                 type: integer
 *                 description: ID lớp học
 *               gradeValue:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 10
 *                 description: Điểm số
 *               gradeType:
 *                 type: string
 *                 enum: [homework, quiz, midterm, final, assignment, participation]
 *                 description: Loại điểm
 *               weight:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Trọng số (tự động nếu không cung cấp)
 *               term:
 *                 type: string
 *                 enum: [1, 2, final]
 *                 description: Học kỳ
 *               academicYear:
 *                 type: string
 *                 pattern: ^\d{4}-\d{4}$
 *                 description: Năm học (tự động nếu không cung cấp)
 *               remarks:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Ghi chú
 *     responses:
 *       201:
 *         description: Nhập điểm thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Grade'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  '/',
  ...auth(['admin', 'teacher']),
  ...createGradeValidation,
  gradeController.createGrade
);

/**
 * @swagger
 * /api/v1/grades:
 *   get:
 *     tags: [Grades]
 *     summary: Lấy danh sách điểm theo lớp
 *     description: Lấy danh sách điểm với phân trang và bộ lọc (Admin xem tất cả, Teacher chỉ xem lớp mình dạy)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema:
 *           type: integer
 *         description: ID lớp học (optional)
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: integer
 *         description: ID môn học
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: integer
 *         description: ID học sinh
 *       - in: query
 *         name: term
 *         schema:
 *           type: string
 *           enum: ['1', '2', 'final']
 *         description: Học kỳ
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: Năm học (VD 2023-2024)
 *       - in: query
 *         name: gradeType
 *         schema:
 *           type: string
 *           enum: [homework, quiz, midterm, final, assignment, participation]
 *         description: Loại điểm
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
 *         description: Số lượng kết quả mỗi trang
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: recordedAt
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
 *         description: Lấy danh sách điểm thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Grade'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalItems:
 *                           type: integer
 *                         itemsPerPage:
 *                           type: integer
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  '/',
  ...auth(['admin', 'teacher']),
  ...gradeQueryValidation,
  gradeController.getAllGrades
);

/**
 * @swagger
 * /api/v1/grades/student/{id}:
 *   get:
 *     tags: [Grades]
 *     summary: Xem điểm cá nhân học sinh
 *     description: Lấy danh sách điểm của một học sinh cụ thể
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID học sinh
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: integer
 *         description: ID môn học
 *       - in: query
 *         name: classId
 *         schema:
 *           type: integer
 *         description: ID lớp học
 *       - in: query
 *         name: term
 *         schema:
 *           type: string
 *           enum: [1, 2, final]
 *         description: Học kỳ
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *           pattern: ^\d{4}-\d{4}$
 *         description: Năm học
 *       - in: query
 *         name: gradeType
 *         schema:
 *           type: string
 *           enum: [homework, quiz, midterm, final, assignment, participation]
 *         description: Loại điểm
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
 *         description: Số lượng điểm mỗi trang
 *     responses:
 *       200:
 *         description: Điểm của học sinh
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     grades:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Grade'
 *                     averages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           subjectId:
 *                             type: integer
 *                           term:
 *                             type: string
 *                           averageGrade:
 *                             type: number
 *                           totalGrades:
 *                             type: integer
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalItems:
 *                           type: integer
 *                         itemsPerPage:
 *                           type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  '/student/:id',
  ...auth(['admin', 'teacher', 'student']),
  ...gradeQueryValidation,
  gradeController.getStudentGrades
);

/**
 * @swagger
 * /api/v1/grades/statistics:
 *   get:
 *     tags: [Grades]
 *     summary: Thống kê điểm
 *     description: Lấy thống kê điểm của lớp học
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID lớp học
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: integer
 *         description: ID môn học
 *       - in: query
 *         name: term
 *         schema:
 *           type: string
 *           enum: [1, 2, final]
 *         description: Học kỳ
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *           pattern: ^\d{4}-\d{4}$
 *         description: Năm học
 *     responses:
 *       200:
 *         description: Thống kê điểm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     statistics:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           subjectId:
 *                             type: integer
 *                           averageGrade:
 *                             type: number
 *                           minGrade:
 *                             type: number
 *                           maxGrade:
 *                             type: number
 *                           totalGrades:
 *                             type: integer
 *                           passingGrades:
 *                             type: integer
 *                     gradeDistribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           subjectId:
 *                             type: integer
 *                           excellent:
 *                             type: integer
 *                           good:
 *                             type: integer
 *                           fair:
 *                             type: integer
 *                           average:
 *                             type: integer
 *                           poor:
 *                             type: integer
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  '/statistics',
  ...auth(['admin', 'teacher']),
  ...gradeQueryValidation,
  gradeController.getGradeStatistics
);

/**
 * @swagger
 * /api/v1/grades/report/export:
 *   get:
 *     tags: [Grades]
 *     summary: Xuất báo cáo điểm Excel
 *     description: Xuất báo cáo điểm dưới dạng file Excel
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID lớp học
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: integer
 *         description: ID môn học
 *       - in: query
 *         name: term
 *         schema:
 *           type: string
 *           enum: [1, 2, final]
 *         description: Học kỳ
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *           pattern: ^\d{4}-\d{4}$
 *         description: Năm học
 *     responses:
 *       200:
 *         description: File Excel báo cáo điểm
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  '/report/export',
  ...auth(['admin', 'teacher']),
  ...gradeQueryValidation,
  gradeController.exportGradesCSV
);

/**
 * @swagger
 * /api/v1/grades/{id}:
 *   put:
 *     tags: [Grades]
 *     summary: Cập nhật điểm
 *     description: Cập nhật thông tin điểm (chỉ Admin và Teacher)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID điểm
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gradeValue:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 10
 *                 description: Điểm số mới
 *               weight:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Trọng số mới
 *               remarks:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Ghi chú mới
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
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Grade'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put(
  '/:id',
  ...auth(['admin', 'teacher']),
  ...updateGradeValidation,
  gradeController.updateGrade
);

/**
 * @swagger
 * /api/v1/grades/{id}:
 *   delete:
 *     tags: [Grades]
 *     summary: Xóa điểm
 *     description: Xóa điểm (soft delete - chỉ Admin và Teacher)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID điểm
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
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete(
  '/:id',
  ...auth(['admin', 'teacher']),
  gradeController.deleteGrade
);

module.exports = router;