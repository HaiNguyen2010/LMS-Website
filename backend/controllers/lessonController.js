const { Lesson, Class, Subject, User, TeacherAssignment, ClassStudent, Attachment } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Helper function để xóa file khi có lỗi
const cleanupFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('Cleaned up file:', filePath);
        }
    } catch (error) {
        console.error('Error cleaning up file:', error);
    }
};

// Helper function để xóa nhiều files
const cleanupFiles = (filePaths) => {
    if (!filePaths || !Array.isArray(filePaths)) return;
    filePaths.forEach(filePath => {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log('Cleaned up file:', filePath);
            }
        } catch (error) {
            console.error('Error cleaning up file:', error);
        }
    });
};

// Tạo bài giảng mới
const createLesson = async (req, res) => {
    try {
        const { classId, subjectId, title, description, status = 'published' } = req.body;
        const createdBy = req.user.id;

        // Validate required fields
        if (!classId || !subjectId || !title) {
            // Cleanup uploaded files nếu có
            if (req.filesInfo && req.filesInfo.length > 0) {
                cleanupFiles(req.filesInfo.map(f => f.filePath));
            }
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin: classId, subjectId, title'
            });
        }

        // Kiểm tra class và subject có tồn tại không
        const classExists = await Class.findByPk(classId);
        const subjectExists = await Subject.findByPk(subjectId);

        if (!classExists || !subjectExists) {
            if (req.filesInfo && req.filesInfo.length > 0) {
                cleanupFiles(req.filesInfo.map(f => f.filePath));
            }
            return res.status(404).json({
                success: false,
                message: 'Lớp học hoặc môn học không tồn tại'
            });
        }

        // Nếu user là teacher, kiểm tra xem có phân công dạy lớp này không
        if (req.user.role === 'teacher') {
            const assignment = await TeacherAssignment.findOne({
                where: {
                    teacherId: req.user.id,
                    classId,
                    subjectId,
                    isActive: true
                }
            });

            if (!assignment) {
                if (req.filesInfo && req.filesInfo.length > 0) {
                    cleanupFiles(req.filesInfo.map(f => f.filePath));
                }
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền tạo bài giảng cho lớp và môn học này'
                });
            }
        }

        // Chuẩn bị dữ liệu lesson
        const lessonData = {
            classId,
            subjectId,
            title,
            description,
            createdBy,
            status
        };

        // Tạo lesson
        const lesson = await Lesson.create(lessonData);

        // Tạo attachments nếu có files được upload
        if (req.filesInfo && req.filesInfo.length > 0) {
            const attachmentsData = req.filesInfo.map((fileInfo, index) => ({
                attachableType: 'lesson',
                attachableId: lesson.id,
                fileName: fileInfo.originalName,
                fileUrl: fileInfo.uploadUrl,
                fileSize: fileInfo.fileSize,
                fileType: fileInfo.fileType,
                mimeType: fileInfo.mimeType,
                uploadedBy: createdBy,
                sortOrder: index + 1
            }));

            await Attachment.bulkCreate(attachmentsData);
        }

        // Lấy lesson với thông tin liên quan và attachments
        const createdLesson = await Lesson.findByPk(lesson.id, {
            include: [
                {
                    model: Class,
                    as: 'lessonClass',
                    attributes: ['id', 'name', 'code']
                },
                {
                    model: Subject,
                    as: 'lessonSubject',
                    attributes: ['id', 'name', 'code']
                },
                {
                    model: User,
                    as: 'lessonCreator',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Attachment,
                    as: 'attachments',
                    attributes: ['id', 'fileName', 'fileUrl', 'fileSize', 'fileType', 'mimeType', 'description', 'sortOrder', 'createdAt']
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Tạo bài giảng thành công',
            data: createdLesson
        });

    } catch (error) {
        // Cleanup uploaded files on error
        if (req.filesInfo && req.filesInfo.length > 0) {
            cleanupFiles(req.filesInfo.map(f => f.filePath));
        }
        
        console.error('Error creating lesson:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo bài giảng',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Lấy danh sách tất cả bài giảng
const getAllLessons = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            classId,
            subjectId,
            status,
            sortBy = 'createdAt',
            sortOrder = 'DESC'
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Build where conditions
        const whereConditions = {};

        if (search) {
            whereConditions[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }

        if (classId) {
            whereConditions.classId = classId;
        }

        if (subjectId) {
            whereConditions.subjectId = subjectId;
        }

        if (status) {
            whereConditions.status = status;
        }

        // Nếu user là teacher, chỉ hiển thị lessons của các lớp họ dạy
        if (req.user.role === 'teacher') {
            const assignments = await TeacherAssignment.findAll({
                where: {
                    teacherId: req.user.id,
                    isActive: true
                },
                attributes: ['classId', 'subjectId']
            });

            if (assignments.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        lessons: [],
                        pagination: {
                            currentPage: parseInt(page),
                            totalPages: 0,
                            totalItems: 0,
                            itemsPerPage: parseInt(limit)
                        }
                    }
                });
            }

            const teacherConditions = assignments.map(assignment => ({
                classId: assignment.classId,
                subjectId: assignment.subjectId
            }));

            whereConditions[Op.or] = [
                ...(whereConditions[Op.or] || []),
                ...teacherConditions
            ];
        }

        // Nếu user là student, chỉ hiển thị lessons của các lớp đã đăng ký
        if (req.user.role === 'student') {
            const { ClassStudent } = require('../models');
            const enrollments = await ClassStudent.findAll({
                where: {
                    studentId: req.user.id,
                    status: 'active'
                },
                attributes: ['classId']
            });

            if (enrollments.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        lessons: [],
                        pagination: {
                            currentPage: parseInt(page),
                            totalPages: 0,
                            totalItems: 0,
                            itemsPerPage: parseInt(limit)
                        }
                    }
                });
            }

            const enrolledClassIds = enrollments.map(e => e.classId);
            whereConditions.classId = { [Op.in]: enrolledClassIds };
        }

        // Get total count
        const totalItems = await Lesson.count({ where: whereConditions });

        // Get lessons with pagination
        const lessons = await Lesson.findAll({
            where: whereConditions,
            include: [
                {
                    model: Class,
                    as: 'lessonClass',
                    attributes: ['id', 'name', 'code']
                },
                {
                    model: Subject,
                    as: 'lessonSubject',
                    attributes: ['id', 'name', 'code']
                },
                {
                    model: User,
                    as: 'lessonCreator',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Attachment,
                    as: 'attachments',
                    attributes: ['id', 'fileName', 'fileUrl', 'fileSize', 'fileType', 'mimeType', 'description', 'sortOrder', 'createdAt']
                }
            ],
            order: [[sortBy, sortOrder.toUpperCase()]],
            limit: parseInt(limit),
            offset: offset
        });

        const totalPages = Math.ceil(totalItems / parseInt(limit));

        res.json({
            success: true,
            data: {
                lessons,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalItems,
                    itemsPerPage: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Error getting lessons:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách bài giảng',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Lấy thông tin chi tiết một bài giảng
const getLessonById = async (req, res) => {
    try {
        const { id } = req.params;

        const lesson = await Lesson.findByPk(id, {
            include: [
                {
                    model: Class,
                    as: 'lessonClass',
                    attributes: ['id', 'name', 'code']
                },
                {
                    model: Subject,
                    as: 'lessonSubject',
                    attributes: ['id', 'name', 'code']
                },
                {
                    model: User,
                    as: 'lessonCreator',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Attachment,
                    as: 'attachments',
                    attributes: ['id', 'fileName', 'fileUrl', 'fileSize', 'fileType', 'mimeType', 'description', 'sortOrder', 'createdAt'],
                    order: [['sortOrder', 'ASC']]
                }
            ]
        });

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài giảng'
            });
        }

        // Kiểm tra quyền truy cập
        if (req.user.role === 'teacher') {
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
                    message: 'Bạn không có quyền xem bài giảng này'
                });
            }
        } else if (req.user.role === 'student') {
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
                    message: 'Bạn không có quyền xem bài giảng này'
                });
            }
        }

        res.json({
            success: true,
            data: lesson
        });

    } catch (error) {
        console.error('Error getting lesson by id:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thông tin bài giảng',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Cập nhật bài giảng
const updateLesson = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, status, classId, subjectId, deleteAttachmentIds } = req.body;

        // Tìm lesson hiện tại
        const lesson = await Lesson.findByPk(id);
        if (!lesson) {
            if (req.filesInfo && req.filesInfo.length > 0) {
                cleanupFiles(req.filesInfo.map(f => f.filePath));
            }
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài giảng'
            });
        }

        // Kiểm tra quyền sửa đổi
        if (req.user.role === 'teacher') {
            const targetClassId = classId || lesson.classId;
            const targetSubjectId = subjectId || lesson.subjectId;

            const assignment = await TeacherAssignment.findOne({
                where: {
                    teacherId: req.user.id,
                    classId: targetClassId,
                    subjectId: targetSubjectId,
                    isActive: true
                }
            });

            if (!assignment) {
                if (req.filesInfo && req.filesInfo.length > 0) {
                    cleanupFiles(req.filesInfo.map(f => f.filePath));
                }
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền sửa bài giảng này'
                });
            }
        }

        // Chuẩn bị dữ liệu cập nhật
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (status !== undefined) updateData.status = status;
        if (classId !== undefined) updateData.classId = classId;
        if (subjectId !== undefined) updateData.subjectId = subjectId;

        // Cập nhật lesson
        await lesson.update(updateData);

        // Xóa attachments cũ nếu được yêu cầu
        if (deleteAttachmentIds) {
            const idsToDelete = Array.isArray(deleteAttachmentIds) 
                ? deleteAttachmentIds 
                : JSON.parse(deleteAttachmentIds);
            
            if (idsToDelete.length > 0) {
                const attachmentsToDelete = await Attachment.findAll({
                    where: {
                        id: idsToDelete,
                        attachableType: 'lesson',
                        attachableId: id
                    }
                });

                // Xóa files vật lý
                attachmentsToDelete.forEach(attachment => {
                    const filePath = path.join(__dirname, '..', attachment.fileUrl);
                    cleanupFile(filePath);
                });

                // Xóa records từ database
                await Attachment.destroy({
                    where: {
                        id: idsToDelete,
                        attachableType: 'lesson',
                        attachableId: id
                    }
                });
            }
        }

        // Thêm attachments mới nếu có files được upload
        if (req.filesInfo && req.filesInfo.length > 0) {
            // Lấy sortOrder cao nhất hiện tại
            const maxSortOrder = await Attachment.max('sortOrder', {
                where: {
                    attachableType: 'lesson',
                    attachableId: id
                }
            }) || 0;

            const attachmentsData = req.filesInfo.map((fileInfo, index) => ({
                attachableType: 'lesson',
                attachableId: id,
                fileName: fileInfo.originalName,
                fileUrl: fileInfo.uploadUrl,
                fileSize: fileInfo.fileSize,
                fileType: fileInfo.fileType,
                mimeType: fileInfo.mimeType,
                uploadedBy: req.user.id,
                sortOrder: maxSortOrder + index + 1
            }));

            await Attachment.bulkCreate(attachmentsData);
        }

        // Lấy lesson đã cập nhật với thông tin liên quan
        const updatedLesson = await Lesson.findByPk(id, {
            include: [
                {
                    model: Class,
                    as: 'lessonClass',
                    attributes: ['id', 'name', 'code']
                },
                {
                    model: Subject,
                    as: 'lessonSubject',
                    attributes: ['id', 'name', 'code']
                },
                {
                    model: User,
                    as: 'lessonCreator',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Attachment,
                    as: 'attachments',
                    attributes: ['id', 'fileName', 'fileUrl', 'fileSize', 'fileType', 'mimeType', 'description', 'sortOrder', 'createdAt'],
                    order: [['sortOrder', 'ASC']]
                }
            ]
        });

        res.json({
            success: true,
            message: 'Cập nhật bài giảng thành công',
            data: updatedLesson
        });

    } catch (error) {
        if (req.filesInfo && req.filesInfo.length > 0) {
            cleanupFiles(req.filesInfo.map(f => f.filePath));
        }
        
        console.error('Error updating lesson:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật bài giảng',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Xóa bài giảng
const deleteLesson = async (req, res) => {
    try {
        const { id } = req.params;

        const lesson = await Lesson.findByPk(id);
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài giảng'
            });
        }

        // Kiểm tra quyền xóa
        if (req.user.role === 'teacher') {
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
                    message: 'Bạn không có quyền xóa bài giảng này'
                });
            }
        }

        // Xóa file nếu có
        if (lesson.fileUrl) {
            const filePath = path.join(__dirname, '..', lesson.fileUrl);
            cleanupFile(filePath);
        }

        // Xóa lesson (soft delete)
        await lesson.destroy();

        res.json({
            success: true,
            message: 'Xóa bài giảng thành công'
        });

    } catch (error) {
        console.error('Error deleting lesson:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa bài giảng',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Lấy danh sách bài giảng theo lớp học
const getLessonsByClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const {
            page = 1,
            limit = 10,
            search = '',
            subjectId,
            status,
            sortBy = 'createdAt',
            sortOrder = 'DESC'
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Kiểm tra class có tồn tại không
        const classExists = await Class.findByPk(classId);
        if (!classExists) {
            return res.status(404).json({
                success: false,
                message: 'Lớp học không tồn tại'
            });
        }

        // Kiểm tra quyền truy cập
        if (req.user.role === 'teacher') {
            // Teacher chỉ xem được lessons của lớp họ dạy
            const assignment = await TeacherAssignment.findOne({
                where: {
                    teacherId: req.user.id,
                    classId: classId,
                    isActive: true
                }
            });

            if (!assignment) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền xem bài giảng của lớp này'
                });
            }
        } else if (req.user.role === 'student') {
            // Student chỉ xem được lessons của lớp họ học
            const enrollment = await ClassStudent.findOne({
                where: {
                    studentId: req.user.id,
                    classId: classId,
                    status: 'active'
                }
            });

            if (!enrollment) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không thuộc lớp học này'
                });
            }
        }

        // Build where conditions
        const whereConditions = { classId };

        if (search) {
            whereConditions[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }

        if (subjectId) {
            whereConditions.subjectId = subjectId;
        }

        if (status) {
            whereConditions.status = status;
        }

        // Get total count
        const totalItems = await Lesson.count({ where: whereConditions });

        // Get lessons with pagination
        const lessons = await Lesson.findAll({
            where: whereConditions,
            include: [
                {
                    model: Class,
                    as: 'lessonClass',
                    attributes: ['id', 'name', 'code']
                },
                {
                    model: Subject,
                    as: 'lessonSubject',
                    attributes: ['id', 'name', 'code']
                },
                {
                    model: User,
                    as: 'lessonCreator',
                    attributes: ['id', 'name', 'email']
                }
            ],
            order: [[sortBy, sortOrder.toUpperCase()]],
            limit: parseInt(limit),
            offset: offset
        });

        const totalPages = Math.ceil(totalItems / parseInt(limit));

        res.json({
            success: true,
            data: {
                lessons,
                classInfo: {
                    id: classExists.id,
                    name: classExists.name,
                    code: classExists.code
                },
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalItems,
                    itemsPerPage: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Error getting lessons by class:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách bài giảng theo lớp',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    createLesson,
    getAllLessons,
    getLessonById,
    updateLesson,
    deleteLesson,
    getLessonsByClass
};
