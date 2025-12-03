const express = require('express');
const router = express.Router();

// Import các route modules
const authRoutes = require('./auth');
const userRoutes = require('./users');
const classRoutes = require('./classes');
const subjectRoutes = require('./subjects');
const teacherAssignmentRoutes = require('./teacherAssignments');
const studentEnrollmentRoutes = require('./studentEnrollments');
const lessonRoutes = require('./lessons');
const assignmentRoutes = require('./assignmentRoutes');
const gradeRoutes = require('./gradeRoutes');
const forumRoutes = require('./forumRoutes');
const notificationRoutes = require('./notificationRoutes');
const dashboardRoutes = require('./dashboard');

// API prefix và versioning
const API_VERSION = '/api/v1';

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health Check]
 *     summary: Kiểm tra trạng thái server
 *     description: Endpoint để kiểm tra xem server có đang hoạt động không
 *     responses:
 *       200:
 *         description: Server đang hoạt động bình thường
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
 *                   example: "LMS Backend API is running"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-10-07T10:30:00.000Z"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 */
// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'LMS Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Đăng ký các routes
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/users`, userRoutes);
router.use(`${API_VERSION}/classes`, classRoutes);
router.use(`${API_VERSION}/subjects`, subjectRoutes);
router.use(`${API_VERSION}/teacher-assignments`, teacherAssignmentRoutes);
router.use(`${API_VERSION}/student-enrollments`, studentEnrollmentRoutes);
router.use(`${API_VERSION}/lessons`, lessonRoutes);
router.use(`${API_VERSION}/assignments`, assignmentRoutes);
router.use(`${API_VERSION}/grades`, gradeRoutes);
router.use(`${API_VERSION}/forum`, forumRoutes);
router.use(`${API_VERSION}/notifications`, notificationRoutes);
router.use(`${API_VERSION}/dashboard`, dashboardRoutes);

// 404 handler cho tất cả routes không match
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint không tồn tại',
    availableEndpoints: [
      'GET /health',
      'POST /api/v1/auth/register',
      'POST /api/v1/auth/login',
      'POST /api/v1/auth/logout',
      'GET /api/v1/auth/profile',
      'PUT /api/v1/auth/profile',
      'PUT /api/v1/auth/change-password',
      'POST /api/v1/auth/refresh-token',
      'GET /api/v1/users',
      'POST /api/v1/users',
      'GET /api/v1/users/stats',
      'GET /api/v1/users/:userId',
      'PUT /api/v1/users/:userId',
      'DELETE /api/v1/users/:userId',
      'PUT /api/v1/users/:userId/reset-password',
      // Class Management APIs
      'GET /api/v1/classes',
      'POST /api/v1/classes',
      'GET /api/v1/classes/:id',
      'PUT /api/v1/classes/:id',
      'DELETE /api/v1/classes/:id',
      'GET /api/v1/classes/:id/students',
      'POST /api/v1/classes/:id/students',
      'DELETE /api/v1/classes/:id/students/:studentId',
      // Subject Management APIs
      'GET /api/v1/subjects',
      'POST /api/v1/subjects',
      'GET /api/v1/subjects/:id',
      'PUT /api/v1/subjects/:id',
      'DELETE /api/v1/subjects/:id',
      // Teacher Assignment APIs
      'GET /api/v1/teacher-assignments',
      'POST /api/v1/teacher-assignments',
      'PUT /api/v1/teacher-assignments/:id',
      'DELETE /api/v1/teacher-assignments/:id',
      'GET /api/v1/teacher-assignments/teacher/:teacherId',
      // Student Enrollment APIs
      'GET /api/v1/student-enrollments',
      'POST /api/v1/student-enrollments',
      'POST /api/v1/student-enrollments/multiple',
      'PUT /api/v1/student-enrollments/:id',
      'DELETE /api/v1/student-enrollments/:id',
      'GET /api/v1/student-enrollments/student/:studentId',
      // Lesson Management APIs
      'GET /api/v1/lessons',
      'POST /api/v1/lessons',
      'GET /api/v1/lessons/:id',
      'PUT /api/v1/lessons/:id',
      'DELETE /api/v1/lessons/:id',
      'GET /api/v1/lessons/class/:classId',
      'GET /api/v1/lessons/files/:filename'
    ]
  });
});

module.exports = router;