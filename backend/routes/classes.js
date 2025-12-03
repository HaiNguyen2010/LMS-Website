const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const classController = require('../controllers/classController');
const { classValidation } = require('../middleware/classValidation');
const { verifyToken, requireAdmin, authorizeRole } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validationErrors');

// Middleware: Yêu cầu token hợp lệ cho tất cả routes
router.use(verifyToken);

// Routes cho cả Admin và Teacher
// GET /api/classes/:id/students - Lấy danh sách học sinh trong lớp (Admin & Teacher)
router.get('/:id/students', 
  authorizeRole(['admin', 'teacher']),
  classValidation.getClassStudents,
  handleValidationErrors,
  classController.getClassStudents
);

// Middleware: Yêu cầu quyền Admin cho các routes còn lại
router.use(requireAdmin);

/**
 * @swagger
 * tags:
 *   - name: Class Management
 *     description: Quản lý lớp học (Admin only)
 */

/**
 * @swagger
 * /api/v1/classes:
 *   get:
 *     summary: Lấy danh sách tất cả lớp học
 *     tags: [Class Management]
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
 *         name: grade
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Lọc theo khối
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên lớp
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
 *                   type: object
 *                   properties:
 *                     classes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Class'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationInfo'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// GET /api/classes - Lấy danh sách tất cả lớp học (có phân trang, tìm kiếm, lọc)
router.get('/', 
  classValidation.getAllClasses,
  handleValidationErrors,
  classController.getAllClasses
);

/**
 * @swagger
 * /api/v1/classes/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết lớp học theo ID
 *     tags: [Class Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID lớp học
 *     responses:
 *       200:
 *         description: Lấy thông tin lớp học thành công
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
 *                   example: Lấy thông tin lớp học thành công
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// GET /api/classes/:id - Lấy thông tin chi tiết lớp học theo ID
router.get('/:id', 
  classValidation.getClassById,
  handleValidationErrors,
  classController.getClassById
);

/**
 * @swagger
 * /api/v1/classes:
 *   post:
 *     summary: Tạo lớp học mới
 *     tags: [Class Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - grade
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: "Lớp 10A1"
 *               grade:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 example: 10
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "Lớp chuyên Toán - Tin"
 *     responses:
 *       201:
 *         description: Tạo lớp học thành công
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
 *                   example: Tạo lớp học thành công
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
// POST /api/classes - Tạo lớp học mới
router.post('/', 
  classValidation.createClass,
  handleValidationErrors,
  classController.createClass
);

/**
 * @swagger
 * /api/v1/classes/{id}:
 *   put:
 *     summary: Cập nhật thông tin lớp học
 *     tags: [Class Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID lớp học
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: "Lớp 10A1 (Cập nhật)"
 *               grade:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 example: 10
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "Lớp chuyên Toán - Tin (Cập nhật)"
 *     responses:
 *       200:
 *         description: Cập nhật lớp học thành công
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
 *                   example: Cập nhật lớp học thành công
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// PUT /api/classes/:id - Cập nhật thông tin lớp học
router.put('/:id', 
  classValidation.updateClass,
  handleValidationErrors,
  classController.updateClass
);

/**
 * @swagger
 * /api/v1/classes/{id}:
 *   delete:
 *     summary: Xóa lớp học (soft delete)
 *     tags: [Class Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID lớp học
 *     responses:
 *       200:
 *         description: Xóa lớp học thành công
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
 *                   example: Xóa lớp học thành công
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// DELETE /api/classes/:id - Xóa lớp học (soft delete)
router.delete('/:id', 
  classValidation.deleteClass,
  handleValidationErrors,
  classController.deleteClass
);

/**
 * @swagger
 * /api/v1/classes/{id}/students:
 *   get:
 *     summary: Lấy danh sách học sinh trong lớp (Admin & Teacher)
 *     description: Admin và Teacher có thể xem danh sách học sinh trong lớp
 *     tags: [Class Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID lớp học
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
 *     responses:
 *       200:
 *         description: Lấy danh sách học sinh trong lớp thành công
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
 *                   example: Lấy danh sách học sinh trong lớp thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     students:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationInfo'
       404:
         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /api/v1/classes/{id}/students:
 *   post:
 *     summary: Thêm học sinh vào lớp
 *     tags: [Class Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID lớp học
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentIds
 *             properties:
 *               studentIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 minItems: 1
 *                 example: [1, 2, 3]
 *     responses:
 *       201:
 *         description: Thêm học sinh vào lớp thành công
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
 *                   example: Thêm học sinh vào lớp thành công
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// POST /api/classes/:id/students - Thêm học sinh vào lớp
router.post('/:id/students', 
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID lớp học phải là số nguyên dương'),
    body('studentIds')
      .isArray({ min: 1 })
      .withMessage('Danh sách học sinh phải là mảng và không được rỗng'),
    body('studentIds.*')
      .isInt({ min: 1 })
      .withMessage('ID học sinh phải là số nguyên dương')
  ],
  handleValidationErrors,
  classController.addStudentsToClass
);

/**
 * @swagger
 * /api/v1/classes/{id}/students/{studentId}:
 *   delete:
 *     summary: Xóa học sinh khỏi lớp
 *     tags: [Class Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID lớp học
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID học sinh
 *     responses:
 *       200:
 *         description: Xóa học sinh khỏi lớp thành công
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
 *                   example: Xóa học sinh khỏi lớp thành công
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// DELETE /api/classes/:id/students/:studentId - Xóa học sinh khỏi lớp
router.delete('/:id/students/:studentId', 
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID lớp học phải là số nguyên dương'),
    param('studentId')
      .isInt({ min: 1 })
      .withMessage('ID học sinh phải là số nguyên dương')
  ],
  handleValidationErrors,
  classController.removeStudentFromClass
);

module.exports = router;