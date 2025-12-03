const express = require('express');
const router = express.Router();
const {
    createLesson,
    getAllLessons,
    getLessonById,
    updateLesson,
    deleteLesson,
    getLessonsByClass
} = require('../controllers/lessonController');
const { verifyToken } = require('../middleware/auth');
const { lessonUploadMultiple, handleUploadError, validateUploadedFiles } = require('../middlewares/upload');

/**
 * @swagger
 * /api/v1/lessons:
 *   get:
 *     tags: [Lesson Management]
 *     summary: Lấy danh sách tất cả bài giảng
 *     description: Lấy danh sách bài giảng với phân trang và tìm kiếm. Admin xem tất cả, Teacher xem bài giảng của lớp mình dạy.
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
 *         description: Số lượng bài giảng mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tiêu đề hoặc mô tả
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
 *           enum: [draft, published, archived]
 *         description: Lọc theo trạng thái
 *     responses:
 *       200:
 *         description: Lấy danh sách bài giảng thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LessonListResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   post:
 *     tags: [Lesson Management]
 *     summary: Tạo bài giảng mới
 *     description: Tạo bài giảng mới với nhiều file đính kèm (Admin hoặc Teacher được phân công). Hỗ trợ tối đa 10 files, mỗi file tối đa 100MB.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [classId, subjectId, title]
 *             properties:
 *               classId:
 *                 type: integer
 *                 description: ID lớp học
 *                 example: 1
 *               subjectId:
 *                 type: integer
 *                 description: ID môn học
 *                 example: 1
 *               title:
 *                 type: string
 *                 description: Tiêu đề bài giảng
 *                 example: "Bài 1: Giới thiệu về Toán học"
 *               description:
 *                 type: string
 *                 description: Mô tả bài giảng
 *                 example: "Bài giảng giới thiệu các khái niệm cơ bản về toán học, bao gồm số học, đại số và hình học"
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 default: published
 *                 description: Trạng thái bài giảng
 *                 example: published
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: |
 *                   Danh sách file đính kèm (tối đa 10 files). 
 *                   
 *                   **Hỗ trợ các loại file:**
 *                   - Documents: pdf, docx, doc, pptx, ppt, xlsx, xls, txt
 *                   - Media: mp4, avi, mkv, jpg, jpeg, png
 *                   - Archive: zip, rar
 *                   
 *                   **Giới hạn:**
 *                   - Tối đa 10 files
 *                   - Mỗi file tối đa 100MB
 *                   
 *                   **Ví dụ upload 3 files:**
 *                   - bai-giang-toan-hoc.pdf (Giáo trình)
 *                   - slide-bai-giang.pptx (Slide thuyết trình)
 *                   - bai-tap-thuc-hanh.docx (Bài tập)
 *                 maxItems: 10
 *     responses:
 *       201:
 *         description: Tạo bài giảng thành công với danh sách attachments
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
 *                   example: "Tạo bài giảng thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     classId:
 *                       type: integer
 *                       example: 1
 *                     subjectId:
 *                       type: integer
 *                       example: 1
 *                     title:
 *                       type: string
 *                       example: "Bài 1: Giới thiệu về Toán học"
 *                     description:
 *                       type: string
 *                       example: "Bài giảng giới thiệu các khái niệm cơ bản"
 *                     status:
 *                       type: string
 *                       example: "published"
 *                     createdBy:
 *                       type: integer
 *                       example: 2
 *                     attachments:
 *                       type: array
 *                       example:
 *                         - id: 1
 *                           attachableType: "lesson"
 *                           attachableId: 1
 *                           fileName: "bai-giang-toan-hoc.pdf"
 *                           fileUrl: "/uploads/lessons/1730300000000-bai-giang-toan-hoc.pdf"
 *                           fileSize: 1048576
 *                           fileType: "pdf"
 *                           mimeType: "application/pdf"
 *                           sortOrder: 0
 *                           uploadedBy: 2
 *                         - id: 2
 *                           attachableType: "lesson"
 *                           attachableId: 1
 *                           fileName: "slide-bai-giang.pptx"
 *                           fileUrl: "/uploads/lessons/1730300000001-slide-bai-giang.pptx"
 *                           fileSize: 2097152
 *                           fileType: "pptx"
 *                           mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
 *                           sortOrder: 1
 *                           uploadedBy: 2
 *                         - id: 3
 *                           attachableType: "lesson"
 *                           attachableId: 1
 *                           fileName: "bai-tap-thuc-hanh.docx"
 *                           fileUrl: "/uploads/lessons/1730300000002-bai-tap-thuc-hanh.docx"
 *                           fileSize: 524288
 *                           fileType: "docx"
 *                           mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
 *                           sortOrder: 2
 *                           uploadedBy: 2
 *                     createdAt:
 *                       type: string
 *                       example: "2024-10-30T10:00:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       example: "2024-10-30T10:00:00.000Z"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 * /api/v1/lessons/{id}:
 *   get:
 *     tags: [Lesson Management]
 *     summary: Lấy thông tin chi tiết bài giảng
 *     description: Lấy thông tin chi tiết một bài giảng (Admin, Teacher được phân công, Student của lớp)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID bài giảng
 *     responses:
 *       200:
 *         description: Lấy thông tin bài giảng thành công
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
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     classId:
 *                       type: integer
 *                       example: 1
 *                     subjectId:
 *                       type: integer
 *                       example: 1
 *                     title:
 *                       type: string
 *                       example: "Bài 1: Giới thiệu về Toán học"
 *                     description:
 *                       type: string
 *                       example: "Bài giảng giới thiệu các khái niệm cơ bản"
 *                     status:
 *                       type: string
 *                       example: "published"
 *                     createdBy:
 *                       type: integer
 *                       example: 2
 *                     attachments:
 *                       type: array
 *                       example:
 *                         - id: 1
 *                           fileName: "bai-giang-toan-hoc.pdf"
 *                           fileUrl: "/uploads/lessons/1730300000000-bai-giang-toan-hoc.pdf"
 *                           fileSize: 1048576
 *                           fileType: "pdf"
 *                           mimeType: "application/pdf"
 *                           sortOrder: 0
 *                           description: "Giáo trình chính"
 *                         - id: 2
 *                           fileName: "slide-bai-giang.pptx"
 *                           fileUrl: "/uploads/lessons/1730300000001-slide-bai-giang.pptx"
 *                           fileSize: 2097152
 *                           fileType: "pptx"
 *                           mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
 *                           sortOrder: 1
 *                     class:
 *                       type: object
 *                       example:
 *                         id: 1
 *                         name: "Lớp 10A1"
 *                         code: "10A1"
 *                     subject:
 *                       type: object
 *                       example:
 *                         id: 1
 *                         name: "Toán học"
 *                         code: "MATH"
 *                     createdAt:
 *                       type: string
 *                       example: "2024-10-30T10:00:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       example: "2024-10-30T10:00:00.000Z"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   put:
 *     tags: [Lesson Management]
 *     summary: Cập nhật bài giảng
 *     description: Cập nhật thông tin bài giảng, thêm files mới và/hoặc xóa files cũ (Admin hoặc Teacher tạo bài giảng)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID bài giảng
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Tiêu đề bài giảng
 *                 example: "Bài 1: Giới thiệu về Toán học (Cập nhật)"
 *               description:
 *                 type: string
 *                 description: Mô tả bài giảng
 *                 example: "Bài giảng đã được cập nhật với tài liệu mới hơn"
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 description: Trạng thái bài giảng
 *                 example: published
 *               deleteAttachmentIds:
 *                 type: string
 *                 description: |
 *                   JSON array chứa IDs của các attachments cần xóa.
 *                   
 *                   **Lưu ý:** Phải là chuỗi JSON hợp lệ, không phải array thuần.
 *                   
 *                   **Ví dụ:**
 *                   - Xóa 2 files: "[1, 2]"
 *                   - Xóa 1 file: "[5]"
 *                   - Không xóa: "" hoặc bỏ trống
 *                 example: "[1, 2]"
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: |
 *                   Danh sách file mới cần thêm (tối đa 10 files).
 *                   
 *                   **Hành vi:**
 *                   1. Files trong deleteAttachmentIds sẽ bị xóa khỏi DB và filesystem
 *                   2. Files mới sẽ được thêm với sortOrder tiếp theo
 *                   3. Files cũ không nằm trong deleteAttachmentIds sẽ được giữ nguyên
 *                   
 *                   **Ví dụ kịch bản:**
 *                   - Có 3 files cũ: [id:1, id:2, id:3]
 *                   - deleteAttachmentIds: "[1, 2]" → Xóa file 1, 2
 *                   - Thêm 2 files mới → Kết quả: [id:3 (cũ), id:4 (mới), id:5 (mới)]
 *                 maxItems: 10
 *     responses:
 *       200:
 *         description: Cập nhật bài giảng thành công
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
 *                   example: "Cập nhật bài giảng thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     title:
 *                       type: string
 *                       example: "Bài 1: Giới thiệu về Toán học (Đã cập nhật)"
 *                     description:
 *                       type: string
 *                       example: "Bài giảng đã được cập nhật với tài liệu mới"
 *                     status:
 *                       type: string
 *                       example: "published"
 *                     attachments:
 *                       type: array
 *                       description: "Danh sách attachments sau khi xóa [1,2] và thêm mới"
 *                       example:
 *                         - id: 3
 *                           fileName: "bai-tap-cu.docx"
 *                           fileUrl: "/uploads/lessons/1730300000002-bai-tap-cu.docx"
 *                           fileSize: 524288
 *                           fileType: "docx"
 *                           sortOrder: 0
 *                           description: "File cũ không bị xóa"
 *                         - id: 4
 *                           fileName: "giao-trinh-moi.pdf"
 *                           fileUrl: "/uploads/lessons/1730305000000-giao-trinh-moi.pdf"
 *                           fileSize: 3145728
 *                           fileType: "pdf"
 *                           sortOrder: 1
 *                           description: "File mới được thêm"
 *                         - id: 5
 *                           fileName: "video-huong-dan.mp4"
 *                           fileUrl: "/uploads/lessons/1730305000001-video-huong-dan.mp4"
 *                           fileSize: 10485760
 *                           fileType: "mp4"
 *                           sortOrder: 2
 *                           description: "File mới được thêm"
 *                     updatedAt:
 *                       type: string
 *                       example: "2024-10-30T12:00:00.000Z"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   delete:
 *     tags: [Lesson Management]
 *     summary: Xóa bài giảng
 *     description: Xóa bài giảng và tất cả file đính kèm (Admin hoặc Teacher tạo bài giảng)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID bài giảng
 *     responses:
 *       200:
 *         description: Xóa bài giảng thành công
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
 *                   example: "Xóa bài giảng thành công"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 * /api/v1/lessons/class/{classId}:
 *   get:
 *     tags: [Lesson Management]
 *     summary: Lấy danh sách bài giảng theo lớp học
 *     description: Lấy danh sách bài giảng của một lớp học cụ thể
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
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng bài giảng mỗi trang
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: integer
 *         description: Lọc theo ID môn học
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *           default: active
 *         description: Lọc theo trạng thái
 *     responses:
 *       200:
 *         description: Lấy danh sách bài giảng theo lớp thành công
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
 *                     lessons:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Lesson'
 *                     classInfo:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         name:
 *                           type: string
 *                           example: "Lớp 10A1"
 *                         grade:
 *                           type: integer
 *                           example: 10
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
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 * /api/v1/lessons/files/{filename}:
 *   get:
 *     tags: [Lesson Management]
 *     summary: Tải xuống file bài giảng
 *     description: Tải xuống file tài liệu của bài giảng (Admin, Teacher được phân công, Student của lớp)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Tên file
 *         example: "1234567890-bai-giang-toan.pdf"
 *     responses:
 *       200:
 *         description: File được tải xuống thành công
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           application/vnd.openxmlformats-officedocument.wordprocessingml.document:
 *             schema:
 *               type: string
 *               format: binary
 *           video/mp4:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

// Middleware để serve static files
const path = require('path');
const fs = require('fs');

// Route để serve uploaded files
router.get('/files/:filename', verifyToken, async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(__dirname, '../uploads/lessons', filename);

        // Kiểm tra file có tồn tại không
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File không tồn tại'
            });
        }

        // Tìm lesson có file này để kiểm tra quyền
        const { Lesson } = require('../models');
        const lesson = await Lesson.findOne({
            where: {
                fileUrl: `/uploads/lessons/${filename}`
            }
        });

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'File không hợp lệ'
            });
        }

        // Kiểm tra quyền truy cập file
        if (req.user.role === 'teacher') {
            const { TeacherAssignment } = require('../models');
            const assignment = await TeacherAssignment.findOne({
                where: {
                    teacherId: req.user.id,
                    classId: lesson.classId,
                    subjectId: lesson.subjectId,
                    isActive: true
                }
            });

            if (!assignment) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền truy cập file này'
                });
            }
        } else if (req.user.role === 'student') {
            const { ClassStudent } = require('../models');
            const enrollment = await ClassStudent.findOne({
                where: {
                    studentId: req.user.id,
                    classId: lesson.classId,
                    status: 'active'
                }
            });

            if (!enrollment) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền truy cập file này'
                });
            }
        }

        // Set appropriate headers
        const stat = fs.statSync(filePath);
        const fileExtension = path.extname(filename).toLowerCase();
        
        let contentType = 'application/octet-stream';
        switch (fileExtension) {
            case '.pdf':
                contentType = 'application/pdf';
                break;
            case '.docx':
                contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                break;
            case '.doc':
                contentType = 'application/msword';
                break;
            case '.mp4':
                contentType = 'video/mp4';
                break;
            case '.avi':
                contentType = 'video/x-msvideo';
                break;
            case '.mov':
                contentType = 'video/quicktime';
                break;
            case '.pptx':
                contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
                break;
            case '.ppt':
                contentType = 'application/vnd.ms-powerpoint';
                break;
            case '.xlsx':
                contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                break;
            case '.xls':
                contentType = 'application/vnd.ms-excel';
                break;
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Content-Disposition', `inline; filename="${lesson.fileName}"`);
        
        // Stream file
        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);

    } catch (error) {
        console.error('Error serving file:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tải file'
        });
    }
});

// GET /api/v1/lessons - Lấy danh sách tất cả bài giảng
router.get('/', verifyToken, getAllLessons);

// GET /api/v1/lessons/:id - Lấy thông tin chi tiết một bài giảng
router.get('/:id', verifyToken, getLessonById);

// GET /api/v1/lessons/class/:classId - Lấy danh sách bài giảng theo lớp học
router.get('/class/:classId', verifyToken, getLessonsByClass);

// POST /api/v1/lessons - Tạo bài giảng mới (có thể kèm nhiều files)
router.post('/', 
    verifyToken,
    lessonUploadMultiple,
    handleUploadError,
    validateUploadedFiles,
    createLesson
);

// PUT /api/v1/lessons/:id - Cập nhật bài giảng (có thể kèm nhiều files mới)
router.put('/:id',
    verifyToken,
    lessonUploadMultiple,
    handleUploadError,
    validateUploadedFiles,
    updateLesson
);

// DELETE /api/v1/lessons/:id - Xóa bài giảng
router.delete('/:id', verifyToken, deleteLesson);

module.exports = router;