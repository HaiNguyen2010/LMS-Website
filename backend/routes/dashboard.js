const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { verifyToken: auth } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/v1/dashboard/admin/stats:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *         description: Time range for growth calculation
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/admin/stats', auth, dashboardController.getAdminStats);

/**
 * @swagger
 * /api/v1/dashboard/teacher/stats:
 *   get:
 *     summary: Get teacher dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/teacher/stats', auth, dashboardController.getTeacherStats);

/**
 * @swagger
 * /api/v1/dashboard/student/stats:
 *   get:
 *     summary: Get student dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/student/stats', auth, dashboardController.getStudentStats);

/**
 * @swagger
 * /api/v1/dashboard/grades/school-stats:
 *   get:
 *     summary: Get school-wide grade statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: Academic year (e.g., 2024-2025)
 *       - in: query
 *         name: term
 *         schema:
 *           type: string
 *           enum: [1, 2, final]
 *         description: Term (1, 2, or final)
 *     responses:
 *       200:
 *         description: Grade statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/grades/school-stats', auth, dashboardController.getSchoolGradeStats);

/**
 * @swagger
 * /api/v1/dashboard/grades/class-stats/{classId}:
 *   get:
 *     summary: Get grade statistics for a specific class
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: Academic year (e.g., 2024-2025)
 *       - in: query
 *         name: term
 *         schema:
 *           type: string
 *           enum: [1, 2, final]
 *         description: Term (1, 2, or final)
 *       - in: query
 *         name: gradeType
 *         schema:
 *           type: string
 *           enum: [homework, quiz, midterm, final, assignment]
 *         description: Grade type filter
 *     responses:
 *       200:
 *         description: Class grade statistics retrieved successfully
 *       404:
 *         description: Class not found
 *       401:
 *         description: Unauthorized
 */
router.get('/grades/class-stats/:classId', auth, dashboardController.getClassGradeStats);

/**
 * @swagger
 * /api/v1/dashboard/admin/class-statistics:
 *   get:
 *     summary: Get class statistics for admin
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Class statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/admin/class-statistics', auth, dashboardController.getClassStatistics);

/**
 * @swagger
 * /api/v1/dashboard/admin/teacher-statistics:
 *   get:
 *     summary: Get teacher statistics for admin
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Teacher statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/admin/teacher-statistics', auth, dashboardController.getTeacherStatistics);

/**
 * @swagger
 * /api/v1/dashboard/admin/academic-performance:
 *   get:
 *     summary: Get academic performance statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: viewType
 *         schema:
 *           type: string
 *           enum: [class, subject]
 *         description: View type (class or subject)
 *       - in: query
 *         name: term
 *         schema:
 *           type: integer
 *         description: Term (1, 2, or 3 for final)
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: Academic year (e.g., 2024-2025)
 *     responses:
 *       200:
 *         description: Academic performance statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/admin/academic-performance', auth, dashboardController.getAcademicPerformance);

/**
 * @swagger
 * /api/v1/dashboard/academic-years:
 *   get:
 *     summary: Get available academic years
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Academic years retrieved successfully
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
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["2024-2025", "2023-2024", "2022-2023"]
 *       401:
 *         description: Unauthorized
 */
router.get('/academic-years', auth, dashboardController.getAcademicYears);

/**
 * @swagger
 * /api/v1/dashboard/teacher/grade-statistics:
 *   get:
 *     summary: Get grade statistics for teacher's classes
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: Academic year to filter (e.g., "2024-2025")
 *       - in: query
 *         name: term
 *         schema:
 *           type: integer
 *           enum: [1, 2]
 *         description: Term to filter (1 or 2)
 *     responses:
 *       200:
 *         description: Teacher grade statistics retrieved successfully
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
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                     summary:
 *                       type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/teacher/grade-statistics', auth, dashboardController.getTeacherGradeStatistics);

module.exports = router;
