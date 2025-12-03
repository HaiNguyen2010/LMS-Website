const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { subjectValidation } = require('../middleware/classValidation');
const { verifyToken, requireAdmin, requireRole } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validationErrors');

// Middleware: Yêu cầu token hợp lệ cho tất cả routes
router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   - name: Subject Management
 *     description: Quản lý môn học
 */

/**
 * @swagger
 * /api/v1/subjects:
 *   get:
 *     summary: Lấy danh sách tất cả môn học
 *     tags: [Subject Management]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên môn học
 *     responses:
 *       200:
 *         description: Lấy danh sách môn học thành công
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
 *                   example: Lấy danh sách môn học thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     subjects:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Subject'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationInfo'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// GET /api/subjects - Lấy danh sách tất cả môn học (có phân trang, tìm kiếm)
router.get('/', 
  subjectValidation.getAllSubjects,
  handleValidationErrors,
  subjectController.getAllSubjects
);

/**
 * @swagger
 * /api/v1/subjects/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết môn học theo ID
 *     tags: [Subject Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID môn học
 *     responses:
 *       200:
 *         description: Lấy thông tin môn học thành công
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
 *                   example: Lấy thông tin môn học thành công
 *                 data:
 *                   $ref: '#/components/schemas/Subject'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// GET /api/subjects/:id - Lấy thông tin chi tiết môn học theo ID
router.get('/:id', 
  subjectValidation.getSubjectById,
  handleValidationErrors,
  subjectController.getSubjectById
);

/**
 * @swagger
 * /api/v1/subjects:
 *   post:
 *     summary: Tạo môn học mới
 *     tags: [Subject Management]
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
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: "Toán học"
 *               code:
 *                 type: string
 *                 maxLength: 20
 *                 example: "MATH"
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "Môn toán học cơ bản và nâng cao"
 *               credits:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 example: 4
 *     responses:
 *       201:
 *         description: Tạo môn học thành công
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
 *                   example: Tạo môn học thành công
 *                 data:
 *                   $ref: '#/components/schemas/Subject'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
// POST /api/subjects - Tạo môn học mới (Admin only)
router.post('/',
  requireAdmin,
  subjectValidation.createSubject,
  handleValidationErrors,
  subjectController.createSubject
);

/**
 * @swagger
 * /api/v1/subjects/{id}:
 *   put:
 *     summary: Cập nhật thông tin môn học
 *     tags: [Subject Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID môn học
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
 *                 example: "Toán học (Cập nhật)"
 *               code:
 *                 type: string
 *                 maxLength: 20
 *                 example: "MATH_UPD"
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "Môn toán học cơ bản và nâng cao (Cập nhật)"
 *               credits:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 example: 5
 *     responses:
 *       200:
 *         description: Cập nhật môn học thành công
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
 *                   example: Cập nhật môn học thành công
 *                 data:
 *                   $ref: '#/components/schemas/Subject'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// PUT /api/subjects/:id - Cập nhật thông tin môn học (Admin only)
router.put('/:id',
  requireAdmin,
  subjectValidation.updateSubject,
  handleValidationErrors,
  subjectController.updateSubject
);

/**
 * @swagger
 * /api/v1/subjects/{id}:
 *   delete:
 *     summary: Xóa môn học (soft delete)
 *     tags: [Subject Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID môn học
 *     responses:
 *       200:
 *         description: Xóa môn học thành công
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
 *                   example: Xóa môn học thành công
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// DELETE /api/subjects/:id - Xóa môn học (soft delete, Admin only)
router.delete('/:id',
  requireAdmin,
  subjectValidation.deleteSubject,
  handleValidationErrors,
  subjectController.deleteSubject
);

module.exports = router;