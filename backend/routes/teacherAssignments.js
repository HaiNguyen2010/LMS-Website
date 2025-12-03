const express = require('express');
const router = express.Router();
const teacherAssignmentController = require('../controllers/teacherAssignmentController');
const { teacherAssignmentValidation } = require('../middleware/classValidation');
const { verifyToken, requireAdmin, requireTeacher } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validationErrors');

// Route công khai cho student/teacher - phải đặt trước middleware requireAdmin
/**
 * @swagger
 * /api/v1/teacher-assignments/class/{classId}:
 *   get:
 *     summary: Lấy phân công giáo viên theo lớp học (Tất cả người dùng đã đăng nhập)
 *     tags: [Teacher Assignment]
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
 *         description: Lấy phân công giáo viên theo lớp thành công
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
 *                   example: Lấy danh sách phân công giáo viên thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TeacherAssignment'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/class/:classId', verifyToken, teacherAssignmentController.getByClassId);

/**
 * @swagger
 * /api/v1/teacher-assignments/my-classes:
 *   get:
 *     summary: Lấy danh sách lớp của giáo viên (Teacher only)
 *     tags: [Teacher Assignment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách lớp học thành công
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
 *                   example: Lấy danh sách lớp học thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Class'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/my-classes', verifyToken, requireTeacher, teacherAssignmentController.getTeacherClasses);

/**
 * @swagger
 * /api/v1/teacher-assignments/my-assignments:
 *   get:
 *     summary: Lấy danh sách phân công của giáo viên (Teacher only)
 *     tags: [Teacher Assignment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách phân công thành công
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
 *                         $ref: '#/components/schemas/TeacherAssignment'
 *                     total:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/my-assignments', verifyToken, requireTeacher, teacherAssignmentController.getTeacherAssignments);

// Middleware: Yêu cầu token hợp lệ và quyền Admin cho các routes còn lại
router.use(verifyToken);
router.use(requireAdmin);

/**
 * @swagger
 * tags:
 *   - name: Teacher Assignment
 *     description: Quản lý phân công giáo viên (Admin only)
 */

/**
 * @swagger
 * /api/v1/teacher-assignments:
 *   get:
 *     summary: Lấy danh sách tất cả phân công giáo viên
 *     tags: [Teacher Assignment]
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
 *         name: teacherId
 *         schema:
 *           type: integer
 *         description: Lọc theo ID giáo viên
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
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Lọc theo trạng thái hoạt động
 *     responses:
 *       200:
 *         description: Lấy danh sách phân công thành công
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
 *                   example: Lấy danh sách phân công thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     assignments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TeacherAssignment'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationInfo'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// GET /api/teacher-assignments - Lấy danh sách tất cả phân công (có phân trang, lọc)
router.get('/', 
  teacherAssignmentValidation.getAllAssignments,
  handleValidationErrors,
  teacherAssignmentController.getAllAssignments
);

/**
 * @swagger
 * /api/v1/teacher-assignments/teacher/{teacherId}:
 *   get:
 *     summary: Lấy phân công của một giáo viên cụ thể
 *     tags: [Teacher Assignment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID giáo viên
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
 *         description: Lấy phân công của giáo viên thành công
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
 *                   example: Lấy phân công của giáo viên thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     assignments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TeacherAssignment'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationInfo'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// GET /api/teacher-assignments/teacher/:teacherId - Lấy phân công của một giáo viên cụ thể
router.get('/teacher/:teacherId', 
  teacherAssignmentValidation.getTeacherAssignments,
  handleValidationErrors,
  teacherAssignmentController.getTeacherAssignments
);

/**
 * @swagger
 * /api/v1/teacher-assignments:
 *   post:
 *     summary: Tạo phân công giáo viên mới
 *     tags: [Teacher Assignment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teacherId
 *               - classId
 *               - subjectId
 *             properties:
 *               teacherId:
 *                 type: integer
 *                 example: 1
 *               classId:
 *                 type: integer
 *                 example: 1
 *               subjectId:
 *                 type: integer
 *                 example: 1
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-06-30"
 *     responses:
 *       201:
 *         description: Phân công giáo viên thành công
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
 *                   example: Phân công giáo viên thành công
 *                 data:
 *                   $ref: '#/components/schemas/TeacherAssignment'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// POST /api/teacher-assignments - Tạo phân công giáo viên mới
router.post('/', 
  teacherAssignmentValidation.assignTeacher,
  handleValidationErrors,
  teacherAssignmentController.assignTeacher
);

/**
 * @swagger
 * /api/v1/teacher-assignments/{id}:
 *   put:
 *     summary: Cập nhật phân công giáo viên
 *     tags: [Teacher Assignment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID phân công
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-02-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-07-31"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật phân công thành công
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
 *                   example: Cập nhật phân công thành công
 *                 data:
 *                   $ref: '#/components/schemas/TeacherAssignment'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// PUT /api/teacher-assignments/:id - Cập nhật phân công giáo viên
router.put('/:id', 
  teacherAssignmentValidation.updateAssignment,
  handleValidationErrors,
  teacherAssignmentController.updateAssignment
);

/**
 * @swagger
 * /api/v1/teacher-assignments/{id}:
 *   delete:
 *     summary: Xóa phân công giáo viên (soft delete)
 *     tags: [Teacher Assignment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID phân công
 *     responses:
 *       200:
 *         description: Xóa phân công thành công
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
 *                   example: Xóa phân công thành công
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// DELETE /api/teacher-assignments/:id - Xóa phân công giáo viên (soft delete)
router.delete('/:id', 
  teacherAssignmentValidation.deleteAssignment,
  handleValidationErrors,
  teacherAssignmentController.deleteAssignment
);

module.exports = router;