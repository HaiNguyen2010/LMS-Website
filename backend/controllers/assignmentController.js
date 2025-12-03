const { Assignment, Submission, Class, Subject, User, TeacherAssignment, Attachment } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Helper function để xóa file khi có lỗi
const cleanupFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

// Helper function để tính điểm trắc nghiệm
const calculateMCQGrade = (questions, answers, maxGrade) => {
  if (!questions || !answers || questions.length === 0) return 0;
  
  let correctCount = 0;
  questions.forEach((question, index) => {
    if (answers[index] === question.correctAnswer) {
      correctCount++;
    }
  });
  
  return (correctCount / questions.length) * maxGrade;
};

const assignmentController = {
  // Lấy danh sách bài tập với filter và pagination
  getAssignments: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        classId,
        subjectId,
        type,
        status,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build where conditions
      const whereConditions = {};
      if (classId) whereConditions.classId = classId;
      if (subjectId) whereConditions.subjectId = subjectId;
      if (type) whereConditions.type = type;
      if (status) whereConditions.status = status;

      // For students, only show published assignments in enrolled classes
      if (req.user.role === 'student') {
        whereConditions.status = 'published';
        
        // Get enrolled classes
        const { ClassStudent } = require('../models');
        const enrolledClasses = await ClassStudent.findAll({
          where: { studentId: req.user.id, status: 'active' },
          attributes: ['classId']
        });
        
        const classIds = enrolledClasses.map(ec => ec.classId);
        if (classIds.length === 0) {
          return res.json({
            success: true,
            data: {
              assignments: [],
              pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: parseInt(limit) }
            }
          });
        }
        
        whereConditions.classId = { [Op.in]: classIds };
      }

      // For teachers, only show assignments they created or assigned to their classes
      if (req.user.role === 'teacher') {
        const teacherAssignments = await TeacherAssignment.findAll({
          where: { teacherId: req.user.id, isActive: true },
          attributes: ['classId', 'subjectId']
        });

        if (teacherAssignments.length === 0) {
          return res.json({
            success: true,
            data: {
              assignments: [],
              pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: parseInt(limit) }
            }
          });
        }

        const teacherFilter = teacherAssignments.map(ta => ({
          classId: ta.classId,
          subjectId: ta.subjectId
        }));

        whereConditions[Op.or] = teacherFilter;
      }

      const { count, rows } = await Assignment.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: Class,
            as: 'assignmentClass',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Subject,
            as: 'assignmentSubject',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Attachment,
            as: 'attachments',
            required: false
          }
        ],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: offset
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      res.json({
        success: true,
        data: {
          assignments: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error getting assignments:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách bài tập',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Tạo bài tập mới (Teacher only)
  createAssignment: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Cleanup uploaded files if validation fails
        if (req.files && req.files.length > 0) {
          req.files.forEach(file => cleanupFile(file.path));
        }
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: errors.array()
        });
      }

      const {
        title,
        description,
        type,
        dueDate,
        classId,
        subjectId,
        maxGrade,
        instructions,
        allowedFileTypes,
        maxFileSize,
        mcqQuestions,
        status,
        autoGrade
      } = req.body;

      const createdBy = req.user.id;

      // Kiểm tra quyền giáo viên
      if (req.user.role !== 'admin') {
        const assignment = await TeacherAssignment.findOne({
          where: {
            teacherId: createdBy,
            classId,
            subjectId,
            isActive: true
          }
        });

        if (!assignment) {
          // Cleanup uploaded files
          if (req.files && req.files.length > 0) {
            req.files.forEach(file => cleanupFile(file.path));
          }
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền tạo bài tập cho lớp và môn học này'
          });
        }
      }

      // Kiểm tra class và subject có tồn tại
      const classExists = await Class.findByPk(classId);
      const subjectExists = await Subject.findByPk(subjectId);

      if (!classExists || !subjectExists) {
        // Cleanup uploaded files
        if (req.files && req.files.length > 0) {
          req.files.forEach(file => cleanupFile(file.path));
        }
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lớp học hoặc môn học'
        });
      }

      // Validate MCQ questions nếu type là mcq
      if (type === 'mcq' && mcqQuestions) {
        try {
          const questions = JSON.parse(mcqQuestions);
          if (!Array.isArray(questions) || questions.length === 0) {
            // Cleanup uploaded files
            if (req.files && req.files.length > 0) {
              req.files.forEach(file => cleanupFile(file.path));
            }
            return res.status(400).json({
              success: false,
              message: 'Câu hỏi trắc nghiệm phải là một mảng không rỗng'
            });
          }

          // Validate từng câu hỏi
          for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.question || !q.options || !Array.isArray(q.options) || 
                q.options.length < 2 || typeof q.correctAnswer !== 'number' ||
                q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
              // Cleanup uploaded files
              if (req.files && req.files.length > 0) {
                req.files.forEach(file => cleanupFile(file.path));
              }
              return res.status(400).json({
                success: false,
                message: `Câu hỏi ${i + 1} không hợp lệ. Mỗi câu hỏi cần có question, options (ít nhất 2 đáp án), và correctAnswer hợp lệ`
              });
            }
          }
        } catch (error) {
          // Cleanup uploaded files
          if (req.files && req.files.length > 0) {
            req.files.forEach(file => cleanupFile(file.path));
          }
          return res.status(400).json({
            success: false,
            message: 'Định dạng câu hỏi trắc nghiệm không hợp lệ'
          });
        }
      }

      // Tạo assignment
      const assignmentData = {
        title,
        description,
        type,
        dueDate,
        classId,
        subjectId,
        createdBy,
        maxGrade: maxGrade || 10,
        instructions,
        allowedFileTypes,
        maxFileSize: maxFileSize ? Number(maxFileSize) : 10, // Store as MB, not bytes
        mcqQuestions: mcqQuestions ? JSON.parse(mcqQuestions) : null,
        status: status || 'draft',
        autoGrade: autoGrade || false
      };

      const assignment = await Assignment.create(assignmentData);

      // Xử lý multiple files nếu có
      if (req.filesInfo && req.filesInfo.length > 0) {
        const attachments = req.filesInfo.map(fileInfo => ({
          attachableType: 'assignment',
          attachableId: assignment.id,
          fileName: fileInfo.originalName,
          fileUrl: fileInfo.uploadUrl,
          fileSize: fileInfo.fileSize,
          fileType: fileInfo.fileType,
          mimeType: fileInfo.mimeType,
          uploadedBy: createdBy
        }));

        await Attachment.bulkCreate(attachments);
      }

      // Lấy assignment với thông tin liên quan
      const createdAssignment = await Assignment.findByPk(assignment.id, {
        include: [
          {
            model: Class,
            as: 'assignmentClass',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Subject,
            as: 'assignmentSubject',
            attributes: ['id', 'name', 'code']
          },
          {
            model: User,
            as: 'assignmentCreator',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Attachment,
            as: 'attachments',
            required: false
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Tạo bài tập thành công',
        data: createdAssignment
      });

    } catch (error) {
      console.error('Error creating assignment:', error);
      // Cleanup uploaded files on error
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => cleanupFile(file.path));
      }
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo bài tập',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Lấy danh sách bài tập theo lớp
  getAssignmentsByClass: async (req, res) => {
    try {
      const { classId } = req.query;
      const {
        page = 1,
        limit = 10,
        status,
        type,
        sortBy = 'dueDate',
        sortOrder = 'ASC'
      } = req.query;

      if (!classId) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin classId'
        });
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build where conditions
      const whereConditions = { classId };

      if (status) {
        whereConditions.status = status;
      }

      if (type) {
        whereConditions.type = type;
      }

      // Nếu là học sinh, chỉ hiển thị bài tập đã published
      if (req.user.role === 'student') {
        whereConditions.status = 'published';
      }

      // Kiểm tra quyền truy cập
      if (req.user.role === 'teacher') {
        const assignment = await TeacherAssignment.findOne({
          where: {
            teacherId: req.user.id,
            classId,
            isActive: true
          }
        });

        if (!assignment) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền xem bài tập của lớp này'
          });
        }
      } else if (req.user.role === 'student') {
        // Kiểm tra học sinh có trong lớp không
        const { ClassStudent } = require('../models');
        const enrollment = await ClassStudent.findOne({
          where: {
            studentId: req.user.id,
            classId,
            status: 'active'
          }
        });

        if (!enrollment) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền xem bài tập của lớp này'
          });
        }
      }

      const { count, rows } = await Assignment.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: Class,
            as: 'assignmentClass',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Subject,
            as: 'assignmentSubject',
            attributes: ['id', 'name', 'code']
          },
          {
            model: User,
            as: 'assignmentCreator',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Attachment,
            as: 'attachments',
            required: false
          }
        ],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: offset
      });

      // Nếu là học sinh, thêm thông tin submission
      let assignmentsWithSubmissions = rows;
      if (req.user.role === 'student') {
        assignmentsWithSubmissions = await Promise.all(
          rows.map(async (assignment) => {
            const submission = await Submission.findOne({
              where: {
                assignmentId: assignment.id,
                studentId: req.user.id
              }
            });

            const assignmentData = assignment.toJSON();
            return {
              ...assignmentData,
              userSubmission: submission,
              isOverdue: new Date() > new Date(assignment.dueDate),
              timeRemaining: new Date(assignment.dueDate) - new Date()
            };
          })
        );
      }

      const totalPages = Math.ceil(count / parseInt(limit));

      res.json({
        success: true,
        data: {
          assignments: assignmentsWithSubmissions,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error getting assignments:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách bài tập',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Lấy chi tiết bài tập
  getAssignmentById: async (req, res) => {
    try {
      const { id } = req.params;

      const assignment = await Assignment.findByPk(id, {
        include: [
          {
            model: Class,
            as: 'assignmentClass',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Subject,
            as: 'assignmentSubject',
            attributes: ['id', 'name', 'code']
          },
          {
            model: User,
            as: 'assignmentCreator',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Attachment,
            as: 'attachments',
            required: false
          }
        ]
      });

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bài tập'
        });
      }

      // Kiểm tra quyền truy cập
      if (req.user.role === 'teacher' && req.user.role !== 'admin') {
        const teacherAssignment = await TeacherAssignment.findOne({
          where: {
            teacherId: req.user.id,
            classId: assignment.classId,
            subjectId: assignment.subjectId,
            isActive: true
          }
        });

        if (!teacherAssignment) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền xem bài tập này'
          });
        }
      } else if (req.user.role === 'student') {
        // Kiểm tra học sinh có trong lớp không
        const { ClassStudent } = require('../models');
        const enrollment = await ClassStudent.findOne({
          where: {
            studentId: req.user.id,
            classId: assignment.classId,
            status: 'active'
          }
        });

        if (!enrollment) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền xem bài tập này'
          });
        }

        // Nếu bài tập chưa published, không cho xem
        if (assignment.status !== 'published') {
          return res.status(403).json({
            success: false,
            message: 'Bài tập chưa được phát hành'
          });
        }
      }

      let assignmentData = assignment.toJSON();

      // Nếu là học sinh, thêm thông tin submission và ẩn đáp án đúng
      if (req.user.role === 'student') {
        const submission = await Submission.findOne({
          where: {
            assignmentId: id,
            studentId: req.user.id
          }
        });

        // Ẩn đáp án đúng cho câu hỏi trắc nghiệm
        if (assignmentData.mcqQuestions) {
          assignmentData.mcqQuestions = assignmentData.mcqQuestions.map(q => ({
            question: q.question,
            options: q.options
            // Không trả về correctAnswer
          }));
        }

        assignmentData.userSubmission = submission;
        assignmentData.isOverdue = new Date() > new Date(assignment.dueDate);
        assignmentData.timeRemaining = new Date(assignment.dueDate) - new Date();
      }

      res.json({
        success: true,
        data: assignmentData
      });

    } catch (error) {
      console.error('Error getting assignment:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin bài tập',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Cập nhật bài tập (Teacher only)
  updateAssignment: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Cleanup uploaded files if validation fails
        if (req.files && req.files.length > 0) {
          req.files.forEach(file => cleanupFile(file.path));
        }
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const {
        title,
        description,
        type,
        dueDate,
        maxGrade,
        instructions,
        allowedFileTypes,
        maxFileSize,
        mcqQuestions,
        status,
        autoGrade,
        deleteAttachmentIds // Array of attachment IDs to delete
      } = req.body;

      const assignment = await Assignment.findByPk(id);
      if (!assignment) {
        // Cleanup uploaded files
        if (req.files && req.files.length > 0) {
          req.files.forEach(file => cleanupFile(file.path));
        }
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bài tập'
        });
      }

      // Kiểm tra quyền sửa
      if (req.user.role !== 'admin' && assignment.createdBy !== req.user.id) {
        // Cleanup uploaded files
        if (req.files && req.files.length > 0) {
          req.files.forEach(file => cleanupFile(file.path));
        }
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền sửa bài tập này'
        });
      }

      // Validate MCQ questions nếu có
      if (type === 'mcq' && mcqQuestions) {
        try {
          const questions = JSON.parse(mcqQuestions);
          if (!Array.isArray(questions) || questions.length === 0) {
            // Cleanup uploaded files
            if (req.files && req.files.length > 0) {
              req.files.forEach(file => cleanupFile(file.path));
            }
            return res.status(400).json({
              success: false,
              message: 'Câu hỏi trắc nghiệm phải là một mảng không rỗng'
            });
          }
        } catch (error) {
          // Cleanup uploaded files
          if (req.files && req.files.length > 0) {
            req.files.forEach(file => cleanupFile(file.path));
          }
          return res.status(400).json({
            success: false,
            message: 'Định dạng câu hỏi trắc nghiệm không hợp lệ'
          });
        }
      }

      // Xử lý xóa attachments cũ nếu có
      if (deleteAttachmentIds) {
        try {
          const idsToDelete = JSON.parse(deleteAttachmentIds);
          if (Array.isArray(idsToDelete) && idsToDelete.length > 0) {
            const attachmentsToDelete = await Attachment.findAll({
              where: {
                id: { [Op.in]: idsToDelete },
                attachableType: 'assignment',
                attachableId: id
              }
            });

            // Xóa file vật lý
            attachmentsToDelete.forEach(att => {
              const filePath = path.join(__dirname, '..', att.fileUrl);
              cleanupFile(filePath);
            });

            // Xóa record trong database
            await Attachment.destroy({
              where: {
                id: { [Op.in]: idsToDelete },
                attachableType: 'assignment',
                attachableId: id
              }
            });
          }
        } catch (error) {
          console.error('Error deleting attachments:', error);
        }
      }

      // Cập nhật assignment
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (type !== undefined) updateData.type = type;
      if (dueDate !== undefined) updateData.dueDate = dueDate;
      if (maxGrade !== undefined) updateData.maxGrade = maxGrade;
      if (instructions !== undefined) updateData.instructions = instructions;
      if (allowedFileTypes !== undefined) updateData.allowedFileTypes = allowedFileTypes;
      if (maxFileSize !== undefined) updateData.maxFileSize = Number(maxFileSize); // Store as MB
      if (mcqQuestions !== undefined) updateData.mcqQuestions = JSON.parse(mcqQuestions);
      if (status !== undefined) updateData.status = status;
      if (autoGrade !== undefined) updateData.autoGrade = autoGrade;

      await assignment.update(updateData);

      // Xử lý thêm multiple files mới nếu có
      if (req.filesInfo && req.filesInfo.length > 0) {
        const attachments = req.filesInfo.map(fileInfo => ({
          attachableType: 'assignment',
          attachableId: id,
          fileName: fileInfo.originalName,
          fileUrl: fileInfo.uploadUrl,
          fileSize: fileInfo.fileSize,
          fileType: fileInfo.fileType,
          mimeType: fileInfo.mimeType,
          uploadedBy: req.user.id
        }));

        await Attachment.bulkCreate(attachments);
      }

      // Lấy assignment đã cập nhật với thông tin liên quan
      const updatedAssignment = await Assignment.findByPk(id, {
        include: [
          {
            model: Class,
            as: 'assignmentClass',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Subject,
            as: 'assignmentSubject',
            attributes: ['id', 'name', 'code']
          },
          {
            model: User,
            as: 'assignmentCreator',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Attachment,
            as: 'attachments',
            required: false
          }
        ]
      });

      res.json({
        success: true,
        message: 'Cập nhật bài tập thành công',
        data: updatedAssignment
      });

    } catch (error) {
      console.error('Error updating assignment:', error);
      // Cleanup uploaded files on error
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => cleanupFile(file.path));
      }
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật bài tập',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Xóa bài tập (Teacher only)
  deleteAssignment: async (req, res) => {
    try {
      const { id } = req.params;

      const assignment = await Assignment.findByPk(id);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bài tập'
        });
      }

      // Kiểm tra quyền xóa
      if (req.user.role !== 'admin' && assignment.createdBy !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xóa bài tập này'
        });
      }

      await assignment.destroy();

      res.json({
        success: true,
        message: 'Xóa bài tập thành công'
      });

    } catch (error) {
      console.error('Error deleting assignment:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa bài tập',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Cập nhật trạng thái bài tập (Admin/Teacher)
  updateAssignmentStatus: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { status } = req.body;

      const assignment = await Assignment.findByPk(id);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bài tập'
        });
      }

      // Kiểm tra quyền cập nhật (Teacher chỉ được cập nhật assignment của lớp được phân công)
      if (req.user.role === 'teacher') {
        const teacherAssignment = await TeacherAssignment.findOne({
          where: {
            teacherId: req.user.id,
            classId: assignment.classId,
            subjectId: assignment.subjectId,
            isActive: true
          }
        });

        if (!teacherAssignment) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền cập nhật bài tập này'
          });
        }
      }

      // Cập nhật trạng thái
      await assignment.update({ status });

      // Lấy assignment đã cập nhật với thông tin liên quan
      const updatedAssignment = await Assignment.findByPk(id, {
        include: [
          {
            model: Class,
            as: 'assignmentClass',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Subject,
            as: 'assignmentSubject',
            attributes: ['id', 'name', 'code']
          }
        ]
      });

      res.json({
        success: true,
        message: `Đã ${status === 'published' ? 'xuất bản' : status === 'archived' ? 'lưu trữ' : 'chuyển về nháp'} bài tập`,
        data: updatedAssignment
      });

    } catch (error) {
      console.error('Error updating assignment status:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật trạng thái bài tập',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = assignmentController;
