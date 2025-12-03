const express = require('express');
const { body, param, query } = require('express-validator');
const forumController = require('../controllers/forumController');
const { verifyToken: auth } = require('../middleware/auth');

const router = express.Router();

// ========== FORUM POSTS ROUTES ==========

/**
 * @swagger
 * /api/v1/forum/posts/all:
 *   get:
 *     summary: Lấy tất cả bài viết (Admin only)
 *     tags: [Forum]
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
 *         description: Số bài viết mỗi trang
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [recent, popular, discussed]
 *           default: recent
 *         description: Sắp xếp theo
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     posts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ForumPost'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/posts/all',
  auth,
  query('page').optional().isInt({ min: 1 }).withMessage('Trang phải là số nguyên dương'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit phải từ 1-100'),
  query('sort').optional().isIn(['recent', 'popular', 'discussed']).withMessage('Sort không hợp lệ'),
  forumController.getAllPosts
);

/**
 * @swagger
 * components:
 *   schemas:
 *     ForumPost:
 *       type: object
 *       required:
 *         - title
 *         - content
 *         - authorId
 *         - classId
 *       properties:
 *         id:
 *           type: integer
 *           description: ID của bài viết
 *         title:
 *           type: string
 *           minLength: 5
 *           maxLength: 200
 *           description: Tiêu đề bài viết
 *         content:
 *           type: string
 *           minLength: 10
 *           maxLength: 10000
 *           description: Nội dung bài viết
 *         authorId:
 *           type: integer
 *           description: ID tác giả
 *         classId:
 *           type: integer
 *           description: ID lớp học
 *         isPinned:
 *           type: boolean
 *           description: Bài viết được ghim
 *         isLocked:
 *           type: boolean
 *           description: Bài viết bị khóa
 *         viewCount:
 *           type: integer
 *           description: Số lượt xem
 *         likeCount:
 *           type: integer
 *           description: Số lượt thích
 *         commentCount:
 *           type: integer
 *           description: Số bình luận
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Danh sách tags
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
 * /api/v1/forum/classes/{classId}/posts:
 *   get:
 *     summary: Lấy danh sách bài viết theo lớp
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID lớp học
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
 *         description: Số bài viết mỗi trang
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [recent, popular, discussed]
 *           default: recent
 *         description: Cách sắp xếp
 *     responses:
 *       200:
 *         description: Lấy danh sách bài viết thành công
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
 *                     posts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ForumPost'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/classes/:classId/posts', 
  auth,
  param('classId').isInt().withMessage('ID lớp học phải là số nguyên'),
  query('page').optional().isInt({ min: 1 }).withMessage('Trang phải là số nguyên dương'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit phải từ 1-100'),
  query('sort').optional().isIn(['recent', 'popular', 'discussed']).withMessage('Sort không hợp lệ'),
  forumController.getPostsByClass
);

/**
 * @swagger
 * /api/v1/forum/posts:
 *   post:
 *     summary: Tạo bài viết mới
 *     tags: [Forum]
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
 *               - content
 *               - classId
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 200
 *               content:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 10000
 *               classId:
 *                 type: integer
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Tạo bài viết thành công
 */
router.post('/posts',
  auth,
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Tiêu đề phải có từ 5-200 ký tự'),
  body('content')
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage('Nội dung phải có từ 10-10000 ký tự'),
  body('classId')
    .isInt()
    .withMessage('ID lớp học phải là số nguyên'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags phải là mảng'),
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments phải là mảng'),
  forumController.createPost
);

/**
 * @swagger
 * /api/v1/forum/posts/{id}:
 *   get:
 *     summary: Lấy chi tiết bài viết
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID bài viết
 *     responses:
 *       200:
 *         description: Lấy bài viết thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ForumPost'
 */
router.get('/posts/:id',
  auth,
  param('id').isInt().withMessage('ID bài viết phải là số nguyên'),
  forumController.getPostById
);

/**
 * @swagger
 * /api/v1/forum/posts/{id}:
 *   put:
 *     summary: Cập nhật bài viết
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 200
 *               content:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 10000
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               attachments:
 *                 type: array
 *               isPinned:
 *                 type: boolean
 *               isLocked:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật bài viết thành công
 */
router.put('/posts/:id',
  auth,
  param('id').isInt().withMessage('ID bài viết phải là số nguyên'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Tiêu đề phải có từ 5-200 ký tự'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage('Nội dung phải có từ 10-10000 ký tự'),
  body('isPinned')
    .optional()
    .isBoolean()
    .withMessage('isPinned phải là boolean'),
  body('isLocked')
    .optional()
    .isBoolean()
    .withMessage('isLocked phải là boolean'),
  forumController.updatePost
);

/**
 * @swagger
 * /api/v1/forum/posts/{id}:
 *   delete:
 *     summary: Xóa bài viết
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa bài viết thành công
 */
router.delete('/posts/:id',
  auth,
  param('id').isInt().withMessage('ID bài viết phải là số nguyên'),
  forumController.deletePost
);

// ========== FORUM COMMENTS ROUTES ==========

/**
 * @swagger
 * components:
 *   schemas:
 *     ForumComment:
 *       type: object
 *       required:
 *         - postId
 *         - authorId
 *         - content
 *       properties:
 *         id:
 *           type: integer
 *         postId:
 *           type: integer
 *         authorId:
 *           type: integer
 *         content:
 *           type: string
 *           minLength: 1
 *           maxLength: 2000
 *         parentId:
 *           type: integer
 *           nullable: true
 *         likeCount:
 *           type: integer
 *         replyCount:
 *           type: integer
 *         attachments:
 *           type: array
 *         isEdited:
 *           type: boolean
 *         editedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 */

/**
 * @swagger
 * /api/v1/forum/posts/{postId}/comments:
 *   get:
 *     summary: Lấy bình luận của bài viết
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Lấy bình luận thành công
 */
router.get('/posts/:postId/comments',
  auth,
  param('postId').isInt().withMessage('ID bài viết phải là số nguyên'),
  query('page').optional().isInt({ min: 1 }).withMessage('Trang phải là số nguyên dương'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit phải từ 1-100'),
  forumController.getCommentsByPost
);

/**
 * @swagger
 * /api/v1/forum/posts/{postId}/comments:
 *   post:
 *     summary: Tạo bình luận cho bài viết
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *               parentId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Tạo bình luận thành công
 */
router.post('/posts/:postId/comments',
  auth,
  param('postId').isInt().withMessage('ID bài viết phải là số nguyên'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Nội dung phải có từ 1-2000 ký tự'),
  body('parentId')
    .optional()
    .isInt()
    .withMessage('ID comment cha phải là số nguyên'),
  (req, res, next) => {
    // Chuyển postId từ params sang body
    req.body.postId = parseInt(req.params.postId);
    next();
  },
  forumController.createComment
);

/**
 * @swagger
 * /api/v1/forum/comments:
 *   post:
 *     summary: Tạo bình luận mới
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postId
 *               - content
 *             properties:
 *               postId:
 *                 type: integer
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *               parentId:
 *                 type: integer
 *               attachments:
 *                 type: array
 *     responses:
 *       201:
 *         description: Tạo bình luận thành công
 */
router.post('/comments',
  auth,
  body('postId')
    .isInt()
    .withMessage('ID bài viết phải là số nguyên'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Nội dung phải có từ 1-2000 ký tự'),
  body('parentId')
    .optional()
    .isInt()
    .withMessage('ID comment cha phải là số nguyên'),
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments phải là mảng'),
  forumController.createComment
);

/**
 * @swagger
 * /api/v1/forum/comments/{id}:
 *   put:
 *     summary: Cập nhật bình luận
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *               attachments:
 *                 type: array
 *     responses:
 *       200:
 *         description: Cập nhật bình luận thành công
 */
router.put('/comments/:id',
  auth,
  param('id').isInt().withMessage('ID bình luận phải là số nguyên'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Nội dung phải có từ 1-2000 ký tự'),
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments phải là mảng'),
  forumController.updateComment
);

/**
 * @swagger
 * /api/v1/forum/comments/{id}:
 *   delete:
 *     summary: Xóa bình luận
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa bình luận thành công
 */
router.delete('/comments/:id',
  auth,
  param('id').isInt().withMessage('ID bình luận phải là số nguyên'),
  forumController.deleteComment
);

// ========== LIKES ROUTES ==========

/**
 * @swagger
 * /api/v1/forum/likes:
 *   post:
 *     summary: Toggle like/unlike
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetType
 *               - targetId
 *             properties:
 *               targetType:
 *                 type: string
 *                 enum: [post, comment]
 *               targetId:
 *                 type: integer
 *               likeType:
 *                 type: string
 *                 enum: [like, love, laugh, wow, sad, angry]
 *                 default: like
 *     responses:
 *       200:
 *         description: Toggle like thành công
 */
router.post('/likes',
  auth,
  body('targetType')
    .isIn(['post', 'comment'])
    .withMessage('Target type phải là post hoặc comment'),
  body('targetId')
    .isInt()
    .withMessage('Target ID phải là số nguyên'),
  body('likeType')
    .optional()
    .isIn(['like', 'love', 'laugh', 'wow', 'sad', 'angry'])
    .withMessage('Like type không hợp lệ'),
  forumController.toggleLike
);

/**
 * @swagger
 * /api/v1/forum/likes/{targetType}/{targetId}:
 *   get:
 *     summary: Lấy danh sách likes
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [post, comment]
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lấy danh sách likes thành công
 */
router.get('/likes/:targetType/:targetId',
  auth,
  param('targetType')
    .isIn(['post', 'comment'])
    .withMessage('Target type phải là post hoặc comment'),
  param('targetId')
    .isInt()
    .withMessage('Target ID phải là số nguyên'),
  forumController.getLikes
);

module.exports = router;