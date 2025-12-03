const express = require('express');
const router = express.Router();
const studentEnrollmentController = require('../controllers/studentEnrollmentController');
const { studentEnrollmentValidation } = require('../middleware/classValidation');
const { verifyToken, requireAdmin, requireOwnershipOrAdmin } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validationErrors');

/**
 * @swagger
 * tags:
 *   - name: Student Enrollment
 *     description: Quản lý ghi danh học sinh
 */

/**
 * @swagger
 * /api/v1/student-enrollments/student/{studentId}:
 *   get:
 *     summary: Lấy lớp học của một học sinh
 *     tags: [Student Enrollment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID học sinh
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng mỗi trang
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Lọc theo trạng thái hoạt động
 *     responses:
 *       200:
 *         description: Lấy lớp học của học sinh thành công
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
 *                   example: Lấy danh sách lớp học của học sinh thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     student:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         fullName:
 *                           type: string
 *                         email:
 *                           type: string
 *                     enrollments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/StudentEnrollment'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationInfo'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// GET /api/student-enrollments/student/:studentId - Lấy lớp học của một học sinh
// Student có thể xem enrollment của chính mình, Admin có thể xem tất cả
router.get('/student/:studentId', 
  verifyToken,
  requireOwnershipOrAdmin('studentId'),
  studentEnrollmentValidation.getStudentClasses,
  handleValidationErrors,
  studentEnrollmentController.getStudentClasses
);

/**
 * @swagger
 * /api/v1/student-enrollments/class/{classId}:
 *   get:
 *     summary: Lấy danh sách sinh viên của một lớp
 *     tags: [Student Enrollment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID lớp học
 *     responses:
 *       200:
 *         description: Lấy danh sách sinh viên thành công
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
 *                   example: Lấy danh sách sinh viên của lớp thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StudentEnrollment'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// GET /api/student-enrollments/class/:classId - Lấy danh sách sinh viên của một lớp
router.get('/class/:classId', 
  verifyToken,
  studentEnrollmentController.getByClassId
);

// Middleware: Yêu cầu token hợp lệ và quyền Admin cho các routes còn lại
router.use(verifyToken);
router.use(requireAdmin);

/**
 * @swagger
 * /api/v1/student-enrollments:
 *   get:
 *     summary: Lấy danh sách tất cả ghi danh
 *     tags: [Student Enrollment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng mỗi trang
 *       - in: query
 *         name: classId
 *         schema:
 *           type: integer
 *         description: Lọc theo ID lớp học
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: integer
 *         description: Lọc theo ID học sinh
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Lọc theo trạng thái hoạt động
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên học sinh hoặc lớp
 *     responses:
 *       200:
 *         description: Lấy danh sách ghi danh thành công
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
 *                   example: Lấy danh sách ghi danh thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     enrollments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/StudentEnrollment'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationInfo'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// GET /api/student-enrollments - Lấy danh sách tất cả ghi danh
router.get('/', 
  studentEnrollmentValidation.getAllEnrollments,
  handleValidationErrors,
  studentEnrollmentController.getAllEnrollments
);

/**
 * @swagger
 * /api/v1/student-enrollments:
 *   post:
 *     summary: Ghi danh một học sinh vào lớp
 *     tags: [Student Enrollment]
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
 *               - classId
 *             properties:
 *               studentId:
 *                 type: integer
 *                 example: 1
 *               classId:
 *                 type: integer
 *                 example: 1
 *               enrollmentDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *               isActive:
 *                 type: boolean
 *                 description: Trạng thái hoạt động của ghi danh (true = active, false = inactive)
 *                 example: true
 *                 default: true
 *     responses:
 *       201:
 *         description: Ghi danh học sinh thành công
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
 *                   example: Ghi danh học sinh vào lớp thành công
 *                 data:
 *                   $ref: '#/components/schemas/StudentEnrollment'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// POST /api/student-enrollments - Ghi danh một học sinh vào lớp
router.post('/', 
  studentEnrollmentValidation.enrollStudent,
  handleValidationErrors,
  studentEnrollmentController.enrollStudent
);

/**
 * @swagger
 * /api/v1/student-enrollments/multiple:
 *   post:
 *     summary: Ghi danh nhiều học sinh vào lớp
 *     tags: [Student Enrollment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentIds
 *               - classId
 *             properties:
 *               studentIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 minItems: 1
 *                 example: [1, 2, 3]
 *               classId:
 *                 type: integer
 *                 example: 1
 *               enrollmentDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *     responses:
 *       201:
 *         description: Ghi danh nhiều học sinh thành công
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
 *                   example: Ghi danh thành công 3 học sinh vào lớp
 *                 data:
 *                   type: object
 *                   properties:
 *                     enrolledCount:
 *                       type: integer
 *                       example: 3
 *                     skippedCount:
 *                       type: integer
 *                       example: 0
 *                     enrollments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/StudentEnrollment'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
// POST /api/student-enrollments/multiple - Ghi danh nhiều học sinh vào lớp
router.post('/multiple', 
  studentEnrollmentValidation.enrollMultipleStudents,
  handleValidationErrors,
  studentEnrollmentController.enrollMultipleStudents
);

/**
 * @swagger
 * /api/v1/student-enrollments/{id}:
 *   put:
 *     summary: Cập nhật trạng thái ghi danh
 *     tags: [Student Enrollment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ghi danh
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: Trạng thái hoạt động của ghi danh (true = active, false = inactive)
 *                 example: true
 *               enrollmentDate:
 *                 type: string
 *                 format: date
 *                 description: Ngày ghi danh của học sinh
 *                 example: "2024-02-01"
 *     responses:
 *       200:
 *         description: Cập nhật ghi danh thành công
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
 *                   example: Cập nhật ghi danh thành công
 *                 data:
 *                   $ref: '#/components/schemas/StudentEnrollment'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// PUT /api/student-enrollments/:id - Cập nhật trạng thái ghi danh
router.put('/:id', 
  studentEnrollmentValidation.updateEnrollment,
  handleValidationErrors,
  studentEnrollmentController.updateEnrollment
);

/**
 * @swagger
 * /api/v1/student-enrollments/{id}:
 *   delete:
 *     summary: Xóa ghi danh (soft delete)
 *     tags: [Student Enrollment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ghi danh
 *     responses:
 *       200:
 *         description: Xóa ghi danh thành công
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
 *                   example: Xóa ghi danh thành công
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// DELETE /api/student-enrollments/:id - Xóa ghi danh
router.delete('/:id', 
  studentEnrollmentValidation.deleteEnrollment,
  handleValidationErrors,
  studentEnrollmentController.deleteEnrollment
);

module.exports = router;