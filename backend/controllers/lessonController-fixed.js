const { Lesson, Class, Subject, User } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const { cleanupFile } = require('../middlewares/upload');

// Tạo bài giảng mới
const createLesson = async (req, res) => {
    try {
        const { classId, subjectId, title, description, status = 'active' } = req.body;
        const createdBy = req.user.id;

        // Validate required fields
        if (!classId || !subjectId || !title) {
            // Cleanup uploaded file if validation fails
            if (req.fileInfo) {
                cleanupFile(req.fileInfo.filePath);
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
            if (req.fileInfo) {
                cleanupFile(req.fileInfo.filePath);
            }
            return res.status(404).json({
                success: false,
                message: 'Lớp học hoặc môn học không tồn tại'
            });
        }

        // Kiểm tra quyền: Admin hoặc Teacher được phân công dạy môn này trong lớp này
        if (req.user.role !== 'admin') {
            const { TeacherAssignment } = require('../models');
            const assignment = await TeacherAssignment.findOne({
                where: {
                    teacherId: req.user.id,
                    classId: classId,
                    subjectId: subjectId,
                    isActive: true
                }
            });

            if (!assignment) {
                if (req.fileInfo) {
                    cleanupFile(req.fileInfo.filePath);
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

        // Thêm thông tin file nếu có
        if (req.fileInfo) {
            lessonData.fileUrl = req.fileInfo.uploadUrl;
            lessonData.fileName = req.fileInfo.originalName;
            lessonData.fileSize = req.fileInfo.fileSize;
            lessonData.fileType = req.fileInfo.fileType;
        }

        // Tạo lesson
        const lesson = await Lesson.create(lessonData);

        // Lấy lesson với thông tin liên quan
        const createdLesson = await Lesson.findByPk(lesson.id, {
            include: [
                {
                    model: Class,
                    as: 'lessonClass',
                    attributes: ['id', 'name', 'grade']
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
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Tạo bài giảng thành công',
            data: createdLesson
        });

    } catch (error) {
        // Cleanup uploaded file on error
        if (req.fileInfo) {
            cleanupFile(req.fileInfo.filePath);
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
            const { TeacherAssignment } = require('../models');
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

        // Get total count
        const totalItems = await Lesson.count({ where: whereConditions });

        // Get lessons with pagination
        const lessons = await Lesson.findAll({
            where: whereConditions,
            include: [
                {
                    model: Class,
                    as: 'lessonClass',
                    attributes: ['id', 'name', 'grade']
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
                    attributes: ['id', 'name', 'grade']
                },
                {
                    model: Subject,
                    as: 'lessonSubject',
                    attributes: ['id', 'name', 'code', 'credits']
                },
                {
                    model: User,
                    as: 'lessonCreator',
                    attributes: ['id', 'name', 'email']
                }
            ]
        });

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài giảng'
            });
        }

        // Kiểm tra quyền xem: Admin, Teacher của môn học, hoặc Student của lớp
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
                    message: 'Bạn không có quyền xem bài giảng này'
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
                    message: 'Bạn không có quyền xem bài giảng này'
                });
            }
        }

        res.json({
            success: true,
            data: lesson
        });

    } catch (error) {
        console.error('Error getting lesson:', error);
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
        const { title, description, status } = req.body;

        const lesson = await Lesson.findByPk(id);

        if (!lesson) {
            // Cleanup uploaded file if lesson not found
            if (req.fileInfo) {
                cleanupFile(req.fileInfo.filePath);
            }
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài giảng'
            });
        }

        // Kiểm tra quyền: Admin hoặc Teacher tạo bài giảng này
        if (req.user.role !== 'admin' && lesson.createdBy !== req.user.id) {
            if (req.fileInfo) {
                cleanupFile(req.fileInfo.filePath);
            }
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền chỉnh sửa bài giảng này'
            });
        }

        // Chuẩn bị dữ liệu cập nhật
        const updateData = {};
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (status) updateData.status = status;

        // Xử lý file mới nếu có
        if (req.fileInfo) {
            // Xóa file cũ nếu có
            if (lesson.fileUrl) {
                const oldFilePath = path.join(__dirname, '..', lesson.fileUrl);
                cleanupFile(oldFilePath);
            }

            // Cập nhật thông tin file mới
            updateData.fileUrl = req.fileInfo.uploadUrl;
            updateData.fileName = req.fileInfo.originalName;
            updateData.fileSize = req.fileInfo.fileSize;
            updateData.fileType = req.fileInfo.fileType;
        }

        // Cập nhật lesson
        await lesson.update(updateData);

        // Lấy lesson đã cập nhật với thông tin liên quan
        const updatedLesson = await Lesson.findByPk(id, {
            include: [
                {
                    model: Class,
                    as: 'lessonClass',
                    attributes: ['id', 'name', 'grade']
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
            ]
        });

        res.json({
            success: true,
            message: 'Cập nhật bài giảng thành công',
            data: updatedLesson
        });

    } catch (error) {
        // Cleanup uploaded file on error
        if (req.fileInfo) {
            cleanupFile(req.fileInfo.filePath);
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

        // Kiểm tra quyền: Admin hoặc Teacher tạo bài giảng này
        if (req.user.role !== 'admin' && lesson.createdBy !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xóa bài giảng này'
            });
        }

        // Xóa file nếu có
        if (lesson.fileUrl) {
            const filePath = path.join(__dirname, '..', lesson.fileUrl);
            cleanupFile(filePath);
        }

        // Soft delete
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
            subjectId,
            status = 'active',
            sortBy = 'createdAt',
            sortOrder = 'DESC'
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Kiểm tra class có tồn tại không
        const classExists = await Class.findByPk(classId);
        if (!classExists) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lớp học'
            });
        }

        // Kiểm tra quyền: Admin, Teacher, hoặc Student của lớp
        if (req.user.role === 'teacher') {
            const { TeacherAssignment } = require('../models');
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
            const { ClassStudent } = require('../models');
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
                    message: 'Bạn không có quyền xem bài giảng của lớp này'
                });
            }
        }

        // Build where conditions
        const whereConditions = {
            classId: classId,
            status: status
        };

        if (subjectId) {
            whereConditions.subjectId = subjectId;
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
                    attributes: ['id', 'name', 'grade']
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