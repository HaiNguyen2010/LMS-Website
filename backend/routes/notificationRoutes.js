const express = require('express');
const { body, param, query } = require('express-validator');
const notificationController = require('../controllers/notificationController');
const { verifyToken: auth } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - title
 *         - message
 *         - senderId
 *         - receiverRole
 *       properties:
 *         id:
 *           type: integer
 *           description: ID thông báo
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 200
 *           description: Tiêu đề thông báo
 *         message:
 *           type: string
 *           minLength: 1
 *           maxLength: 5000
 *           description: Nội dung thông báo
 *         senderId:
 *           type: integer
 *           description: ID người gửi
 *         receiverRole:
 *           type: string
 *           enum: [student, teacher, admin, all]
 *           description: Vai trò người nhận
 *         classId:
 *           type: integer
 *           nullable: true
 *           description: ID lớp học
 *         subjectId:
 *           type: integer
 *           nullable: true
 *           description: ID môn học
 *         type:
 *           type: string
 *           enum: [announcement, assignment, grade, forum, system, reminder]
 *           default: announcement
 *           description: Loại thông báo
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *           default: medium
 *           description: Mức độ ưu tiên
 *         isRead:
 *           type: boolean
 *           default: false
 *           description: Trạng thái đã đọc
 *         readCount:
 *           type: integer
 *           description: Số lượt đọc
 *         targetCount:
 *           type: integer
 *           description: Tổng số người nhận
 *         scheduledAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Thời gian lên lịch
 *         sentAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Thời gian gửi
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Thời gian hết hạn
 *         metadata:
 *           type: object
 *           description: Dữ liệu bổ sung
 *         attachments:
 *           type: array
 *           items:
 *             type: object
 *           description: File đính kèm
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/notifications:
 *   post:
 *     summary: Tạo thông báo mới (Admin/Teacher)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *               - receiverRole
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *                 description: Tiêu đề thông báo
 *               message:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 5000
 *                 description: Nội dung thông báo
 *               receiverRole:
 *                 type: string
 *                 enum: [student, teacher, admin, all]
 *                 description: Vai trò người nhận
 *               classId:
 *                 type: integer
 *                 description: ID lớp học (tùy chọn)
 *               subjectId:
 *                 type: integer
 *                 description: ID môn học (tùy chọn)
 *               type:
 *                 type: string
 *                 enum: [announcement, assignment, grade, forum, system, reminder]
 *                 default: announcement
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 default: medium
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *                 description: Thời gian lên lịch gửi
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Thời gian hết hạn
 *               metadata:
 *                 type: object
 *                 description: Dữ liệu bổ sung
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: File đính kèm
 *           example:
 *             title: "Thông báo nghỉ học"
 *             message: "Lớp 10A1 nghỉ học vào thứ 2 tuần tới do giáo viên có việc đột xuất"
 *             receiverRole: "student"
 *             classId: 1
 *             type: "announcement"
 *             priority: "high"
 *     responses:
 *       201:
 *         description: Tạo thông báo thành công
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
 *                   $ref: '#/components/schemas/Notification'
 *       403:
 *         description: Không có quyền tạo thông báo
 */
router.post('/',
  auth,
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Tiêu đề phải có từ 1-200 ký tự'),
  body('message')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Nội dung phải có từ 1-5000 ký tự'),
  body('receiverRole')
    .isIn(['student', 'teacher', 'admin', 'all'])
    .withMessage('Vai trò người nhận không hợp lệ'),
  body('classId')
    .optional()
    .isInt()
    .withMessage('ID lớp học phải là số nguyên'),
  body('subjectId')
    .optional()
    .isInt()
    .withMessage('ID môn học phải là số nguyên'),
  body('type')
    .optional()
    .isIn(['announcement', 'assignment', 'grade', 'forum', 'system', 'reminder'])
    .withMessage('Loại thông báo không hợp lệ'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Mức độ ưu tiên không hợp lệ'),
  body('scheduledAt')
    .optional()
    .isISO8601()
    .withMessage('Thời gian lên lịch không hợp lệ'),
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Thời gian hết hạn không hợp lệ'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata phải là object'),
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments phải là mảng'),
  notificationController.createNotification
);

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Lấy tất cả thông báo (Admin only)
 *     tags: [Notifications]
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
 *           default: 100
 *         description: Số thông báo mỗi trang
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Lọc theo loại thông báo
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: Lọc theo mức độ ưu tiên
 *       - in: query
 *         name: receiverRole
 *         schema:
 *           type: string
 *         description: Lọc theo vai trò người nhận
 *     responses:
 *       200:
 *         description: Lấy danh sách thông báo thành công
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
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *                     pagination:
 *                       type: object
 *       403:
 *         description: Không có quyền truy cập
 */
router.get('/',
  auth,
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Trang phải là số nguyên dương'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit phải từ 1-100'),
  notificationController.getAllNotifications
);

/**
 * @swagger
 * /api/v1/notifications/my:
 *   get:
 *     summary: Lấy danh sách thông báo của tôi
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số thông báo mỗi trang
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [announcement, assignment, grade, forum, system, reminder]
 *         description: Lọc theo loại thông báo
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Lọc theo mức độ ưu tiên
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *         description: Chỉ lấy thông báo chưa đọc
 *     responses:
 *       200:
 *         description: Lấy danh sách thông báo thành công
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
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/my',
  auth,
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Trang phải là số nguyên dương'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit phải từ 1-100'),
  query('type')
    .optional()
    .isIn(['announcement', 'assignment', 'grade', 'forum', 'system', 'reminder'])
    .withMessage('Loại thông báo không hợp lệ'),
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Mức độ ưu tiên không hợp lệ'),
  query('unreadOnly')
    .optional()
    .isBoolean()
    .withMessage('unreadOnly phải là boolean'),
  notificationController.getMyNotifications
);

/**
 * @swagger
 * /api/v1/notifications/unread-count:
 *   get:
 *     summary: Lấy số lượng thông báo chưa đọc
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy số lượng thông báo chưa đọc thành công
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
 *                     unreadCount:
 *                       type: integer
 */
router.get('/unread-count',
  auth,
  notificationController.getUnreadCount
);

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   get:
 *     summary: Lấy chi tiết thông báo
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID thông báo
 *     responses:
 *       200:
 *         description: Lấy thông báo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       404:
 *         description: Không tìm thấy thông báo
 */
router.get('/:id',
  auth,
  param('id').isInt().withMessage('ID thông báo phải là số nguyên'),
  notificationController.getNotificationById
);

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   put:
 *     summary: Đánh dấu thông báo đã đọc
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID thông báo
 *     responses:
 *       200:
 *         description: Đánh dấu thông báo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.put('/:id/read',
  auth,
  param('id').isInt().withMessage('ID thông báo phải là số nguyên'),
  notificationController.markAsRead
);

/**
 * @swagger
 * /api/v1/notifications/mark-all-read:
 *   put:
 *     summary: Đánh dấu tất cả thông báo đã đọc
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đánh dấu tất cả thông báo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.put('/mark-all-read',
  auth,
  notificationController.markAllAsRead
);

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   put:
 *     summary: Cập nhật thông báo (Admin/Teacher)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID thông báo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *               message:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 5000
 *               type:
 *                 type: string
 *                 enum: [announcement, assignment, grade, forum, system, reminder]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *               metadata:
 *                 type: object
 *               attachments:
 *                 type: array
 *     responses:
 *       200:
 *         description: Cập nhật thông báo thành công
 *       403:
 *         description: Không có quyền cập nhật thông báo
 */
router.put('/:id',
  auth,
  param('id').isInt().withMessage('ID thông báo phải là số nguyên'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Tiêu đề phải có từ 1-200 ký tự'),
  body('message')
    .optional()
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Nội dung phải có từ 1-5000 ký tự'),
  body('type')
    .optional()
    .isIn(['announcement', 'assignment', 'grade', 'forum', 'system', 'reminder'])
    .withMessage('Loại thông báo không hợp lệ'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Mức độ ưu tiên không hợp lệ'),
  body('scheduledAt')
    .optional()
    .isISO8601()
    .withMessage('Thời gian lên lịch không hợp lệ'),
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Thời gian hết hạn không hợp lệ'),
  notificationController.updateNotification
);

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   delete:
 *     summary: Xóa thông báo (Admin/Teacher)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID thông báo
 *     responses:
 *       200:
 *         description: Xóa thông báo thành công
 *       403:
 *         description: Không có quyền xóa thông báo
 */
router.delete('/:id',
  auth,
  param('id').isInt().withMessage('ID thông báo phải là số nguyên'),
  notificationController.deleteNotification
);

/**
 * @swagger
 * /api/v1/notifications/stats:
 *   get:
 *     summary: Lấy thống kê thông báo (Admin/Teacher)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc
 *       - in: query
 *         name: classId
 *         schema:
 *           type: integer
 *         description: ID lớp học
 *     responses:
 *       200:
 *         description: Lấy thống kê thành công
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
 *                     totalNotifications:
 *                       type: integer
 *                     averageReadRate:
 *                       type: number
 *                     statsByTypeAndPriority:
 *                       type: array
 *                       items:
 *                         type: object
 *       403:
 *         description: Không có quyền xem thống kê
 */
router.get('/stats',
  auth,
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Ngày bắt đầu không hợp lệ'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Ngày kết thúc không hợp lệ'),
  query('classId')
    .optional()
    .isInt()
    .withMessage('ID lớp học phải là số nguyên'),
  notificationController.getNotificationStats
);

module.exports = router;