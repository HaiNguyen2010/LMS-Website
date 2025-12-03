const { Submission, Assignment, User, Class, Subject, TeacherAssignment, Attachment } = require('../models');
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

const submissionController = {
  // Nộp bài (Student only)
  createSubmission: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Cleanup uploaded files on validation error
        if (req.files && req.files.length > 0) {
          req.files.forEach(file => {
            cleanupFile(file.path);
          });
        }
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: errors.array()
        });
      }

      const { content, mcqAnswers } = req.body;
      const { assignmentId } = req.params;
      const studentId = req.user.id;

      // Kiểm tra assignment có tồn tại
      const assignment = await Assignment.findByPk(assignmentId, {
        include: [
          {
            model: Class,
            as: 'assignmentClass',
            attributes: ['id', 'name']
          }
        ]
      });

      if (!assignment) {
        if (req.files && req.files.length > 0) {
          req.files.forEach(file => {
            cleanupFile(file.path);
          });
        }
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bài tập'
        });
      }

      // Kiểm tra assignment đã published chưa
      if (assignment.status !== 'published') {
        if (req.files && req.files.length > 0) {
          req.files.forEach(file => {
            cleanupFile(file.path);
          });
        }
        return res.status(400).json({
          success: false,
          message: 'Bài tập chưa được phát hành'
        });
      }

      // Kiểm tra học sinh có trong lớp không
      const { ClassStudent } = require('../models');
      const enrollment = await ClassStudent.findOne({
        where: {
          studentId,
          classId: assignment.classId,
          status: 'active'
        }
      });

      if (!enrollment) {
        if (req.files && req.files.length > 0) {
          req.files.forEach(file => {
            cleanupFile(file.path);
          });
        }
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền nộp bài tập này'
        });
      }

      // Kiểm tra đã nộp bài chưa
      const existingSubmission = await Submission.findOne({
        where: {
          assignmentId,
          studentId
        }
      });

      if (existingSubmission) {
        if (req.files && req.files.length > 0) {
          req.files.forEach(file => {
            cleanupFile(file.path);
          });
        }
        return res.status(400).json({
          success: false,
          message: 'Bạn đã nộp bài tập này rồi'
        });
      }

      // Kiểm tra hạn nộp bài
      const now = new Date();
      const dueDate = new Date(assignment.dueDate);
      const isLate = now > dueDate;

      // Validate dữ liệu nộp bài theo loại assignment
      let submissionData = {
        assignmentId,
        studentId,
        submittedAt: now,
        isLate,
        status: 'submitted'
      };

      if (assignment.type === 'essay') {
        if (!content) {
          if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
              cleanupFile(file.path);
            });
          }
          return res.status(400).json({
            success: false,
            message: 'Bài tự luận cần có nội dung'
          });
        }
        submissionData.content = content;
        // Essay có thể có file đính kèm (tùy chọn)
      } else if (assignment.type === 'file_upload') {
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Bài tập yêu cầu nộp file'
          });
        }
        
        // Kiểm tra loại file được phép
        if (assignment.allowedFileTypes) {
          const allowedTypes = assignment.allowedFileTypes.split(',').map(t => t.trim().toLowerCase());
          
          for (const file of req.files) {
            const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
            
            if (!allowedTypes.includes(fileExtension)) {
              // Cleanup all uploaded files
              req.files.forEach(f => cleanupFile(f.path));
              return res.status(400).json({
                success: false,
                message: `Chỉ cho phép upload file: ${assignment.allowedFileTypes}`
              });
            }
          }
        }

        submissionData.content = content; // Có thể có mô tả kèm theo
      } else if (assignment.type === 'mcq') {
        if (!mcqAnswers) {
          if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
              cleanupFile(file.path);
            });
          }
          return res.status(400).json({
            success: false,
            message: 'Bài trắc nghiệm cần có câu trả lời'
          });
        }

        try {
          const answers = JSON.parse(mcqAnswers);
          if (!Array.isArray(answers)) {
            throw new Error('Answers must be array');
          }

          submissionData.mcqAnswers = answers;

          // Tự động chấm điểm nếu được bật
          if (assignment.autoGrade && assignment.mcqQuestions) {
            const grade = calculateMCQGrade(assignment.mcqQuestions, answers, assignment.maxGrade);
            submissionData.grade = grade;
            submissionData.status = 'graded';
            submissionData.gradedAt = now;
            submissionData.gradedBy = null; // Auto graded
          }
        } catch (error) {
          if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
              cleanupFile(file.path);
            });
          }
          return res.status(400).json({
            success: false,
            message: 'Định dạng câu trả lời không hợp lệ'
          });
        }
      }

      // Tạo submission
      const submission = await Submission.create(submissionData);

      // Tạo attachments nếu có files
      if (req.files && req.files.length > 0) {
        const attachmentPromises = req.files.map(file => {
          return Attachment.create({
            attachableType: 'submission',
            attachableId: submission.id,
            fileName: file.originalname,
            fileUrl: `/uploads/submissions/${file.filename}`,
            fileSize: file.size,
            fileType: path.extname(file.originalname).substring(1).toLowerCase(),
            mimeType: file.mimetype,
            uploadedBy: studentId
          });
        });

        await Promise.all(attachmentPromises);
      }

      // Lấy submission với thông tin liên quan
      const createdSubmission = await Submission.findByPk(submission.id, {
        include: [
          {
            model: Assignment,
            as: 'submissionAssignment',
            attributes: ['id', 'title', 'type', 'maxGrade', 'dueDate'],
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
          },
          {
            model: User,
            as: 'submissionStudent',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Attachment,
            as: 'attachments',
            attributes: ['id', 'fileName', 'fileUrl', 'fileSize', 'fileType', 'mimeType']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Nộp bài thành công',
        data: createdSubmission
      });

    } catch (error) {
      // Cleanup uploaded files on error
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          cleanupFile(file.path);
        });
      }
      
      console.error('Error creating submission:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi nộp bài',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Lấy danh sách submission của assignment (Teacher only)
  getSubmissionsByAssignment: async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const {
        page = 1,
        limit = 10,
        status,
        sortBy = 'submittedAt',
        sortOrder = 'DESC'
      } = req.query;

      // Kiểm tra assignment có tồn tại
      const assignment = await Assignment.findByPk(assignmentId);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bài tập'
        });
      }

      // Kiểm tra quyền xem
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
            message: 'Bạn không có quyền xem danh sách nộp bài này'
          });
        }
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build where conditions
      const whereConditions = { assignmentId };
      if (status) {
        whereConditions.status = status;
      }

      const { count, rows } = await Submission.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: Assignment,
            as: 'submissionAssignment',
            attributes: ['id', 'title', 'type', 'maxGrade', 'dueDate']
          },
          {
            model: User,
            as: 'submissionStudent',
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: 'submissionGrader',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Attachment,
            as: 'attachments',
            attributes: ['id', 'fileName', 'fileUrl', 'fileSize', 'fileType', 'mimeType']
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
          submissions: rows,
          assignment: {
            id: assignment.id,
            title: assignment.title,
            type: assignment.type,
            maxGrade: assignment.maxGrade,
            dueDate: assignment.dueDate
          },
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error getting submissions:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách nộp bài',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Chấm điểm và nhận xét (Teacher only)
  gradeSubmission: async (req, res) => {
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
      const { grade, feedback, status, gradedBy } = req.body;

      const submission = await Submission.findByPk(id, {
        include: [
          {
            model: Assignment,
            as: 'submissionAssignment',
            attributes: ['id', 'title', 'maxGrade', 'classId', 'subjectId']
          }
        ]
      });

      if (!submission) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bài nộp'
        });
      }

      // Kiểm tra quyền chấm bài
      if (req.user.role === 'teacher') {
        const teacherAssignment = await TeacherAssignment.findOne({
          where: {
            teacherId: req.user.id,
            classId: submission.submissionAssignment.classId,
            subjectId: submission.submissionAssignment.subjectId,
            isActive: true
          }
        });

        if (!teacherAssignment) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền chấm bài này'
          });
        }
      }

      // Validate grade
      if (parseFloat(grade) < 0 || parseFloat(grade) > submission.submissionAssignment.maxGrade) {
        return res.status(400).json({
          success: false,
          message: `Điểm phải từ 0 đến ${submission.submissionAssignment.maxGrade}`
        });
      }

      // Chuẩn bị dữ liệu cập nhật
      const updateData = {
        grade: parseFloat(grade),
        feedback,
        status: status || 'graded', // Cho phép tùy chỉnh status
        gradedAt: new Date(),
        gradedBy: gradedBy || req.user.id // Cho phép admin chỉ định người chấm
      };

      // Cập nhật submission
      await submission.update(updateData);

      // Lấy submission đã cập nhật với thông tin liên quan
      const updatedSubmission = await Submission.findByPk(id, {
        include: [
          {
            model: Assignment,
            as: 'submissionAssignment',
            attributes: ['id', 'title', 'type', 'maxGrade', 'dueDate']
          },
          {
            model: User,
            as: 'submissionStudent',
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: 'submissionGrader',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Chấm bài thành công',
        data: updatedSubmission
      });

    } catch (error) {
      console.error('Error grading submission:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi chấm bài',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Lấy chi tiết submission
  getSubmissionById: async (req, res) => {
    try {
      const { id } = req.params;

      const submission = await Submission.findByPk(id, {
        include: [
          {
            model: Assignment,
            as: 'submissionAssignment',
            attributes: ['id', 'title', 'type', 'maxGrade', 'dueDate', 'classId', 'subjectId'],
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
          },
          {
            model: User,
            as: 'submissionStudent',
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: 'submissionGrader',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Attachment,
            as: 'attachments',
            attributes: ['id', 'fileName', 'fileUrl', 'fileSize', 'fileType', 'mimeType']
          }
        ]
      });

      if (!submission) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bài nộp'
        });
      }

      // Kiểm tra quyền xem
      if (req.user.role === 'student') {
        // Học sinh chỉ xem được bài nộp của mình
        if (submission.studentId !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền xem bài nộp này'
          });
        }
      } else if (req.user.role === 'teacher') {
        // Giáo viên kiểm tra quyền
        const teacherAssignment = await TeacherAssignment.findOne({
          where: {
            teacherId: req.user.id,
            classId: submission.submissionAssignment.classId,
            subjectId: submission.submissionAssignment.subjectId,
            isActive: true
          }
        });

        if (!teacherAssignment) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền xem bài nộp này'
          });
        }
      }

      res.json({
        success: true,
        data: submission
      });

    } catch (error) {
      console.error('Error getting submission:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin bài nộp',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Lấy danh sách submission của học sinh
  getMySubmissions: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        classId,
        subjectId,
        status,
        sortBy = 'submittedAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build where conditions
      const whereConditions = { studentId: req.user.id };
      if (status) {
        whereConditions.status = status;
      }

      // Build include conditions
      const includeConditions = [
        {
          model: Assignment,
          as: 'submissionAssignment',
          attributes: ['id', 'title', 'type', 'maxGrade', 'dueDate', 'classId', 'subjectId'],
          where: {},
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
        },
        {
          model: User,
          as: 'submissionGrader',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Attachment,
          as: 'attachments',
          attributes: ['id', 'fileName', 'fileUrl', 'fileSize', 'fileType', 'mimeType']
        }
      ];

      if (classId) {
        includeConditions[0].where.classId = classId;
      }
      if (subjectId) {
        includeConditions[0].where.subjectId = subjectId;
      }

      const { count, rows } = await Submission.findAndCountAll({
        where: whereConditions,
        include: includeConditions,
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: offset
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      res.json({
        success: true,
        data: {
          submissions: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error getting my submissions:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách bài nộp',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Lấy tất cả submissions (Admin only)
  getAllSubmissions: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        classId,
        subjectId,
        assignmentId,
        studentId,
        sortBy = 'submittedAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build where conditions for submissions
      const whereConditions = {};
      if (status) {
        whereConditions.status = status;
      }
      if (assignmentId) {
        whereConditions.assignmentId = assignmentId;
      }
      if (studentId) {
        whereConditions.studentId = studentId;
      }

      // Build where conditions for assignment (to filter by class/subject)
      const assignmentWhere = {};
      if (classId) {
        assignmentWhere.classId = classId;
      }
      if (subjectId) {
        assignmentWhere.subjectId = subjectId;
      }
      
      // If user is teacher, only show submissions for classes/subjects they teach
      if (req.user.role === 'teacher') {
        // Get teacher's assignments (classes and subjects they teach)
        const teacherAssignments = await TeacherAssignment.findAll({
          where: {
            teacherId: req.user.id,
            isActive: true
          },
          attributes: ['classId', 'subjectId']
        });

        // Extract classIds and subjectIds
        const teacherClassIds = [...new Set(teacherAssignments.map(ta => ta.classId))];
        const teacherSubjectIds = [...new Set(teacherAssignments.map(ta => ta.subjectId))];

        // Filter assignments by teacher's classes and subjects
        if (teacherClassIds.length > 0 && teacherSubjectIds.length > 0) {
          assignmentWhere[Op.or] = [
            { classId: { [Op.in]: teacherClassIds } },
            { subjectId: { [Op.in]: teacherSubjectIds } }
          ];
        } else if (teacherClassIds.length > 0) {
          assignmentWhere.classId = { [Op.in]: teacherClassIds };
        } else if (teacherSubjectIds.length > 0) {
          assignmentWhere.subjectId = { [Op.in]: teacherSubjectIds };
        } else {
          // Teacher has no assignments, return empty result
          return res.json({
            success: true,
            data: {
              submissions: [],
              pagination: {
                currentPage: parseInt(page),
                totalPages: 0,
                totalItems: 0,
                itemsPerPage: parseInt(limit)
              }
            }
          });
        }
      }

      // Build include conditions
      const includeConditions = [
        {
          model: Assignment,
          as: 'submissionAssignment',
          attributes: ['id', 'title', 'type', 'maxGrade', 'dueDate', 'classId', 'subjectId'],
          where: Object.keys(assignmentWhere).length > 0 ? assignmentWhere : undefined,
          required: true, // INNER JOIN to filter submissions
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
        },
        {
          model: User,
          as: 'submissionStudent',
          attributes: ['id', 'name', 'email', 'code']
        },
        {
          model: User,
          as: 'submissionGrader',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Attachment,
          as: 'attachments',
          attributes: ['id', 'fileName', 'fileUrl', 'fileSize', 'fileType', 'mimeType']
        }
      ];

      const { count, rows } = await Submission.findAndCountAll({
        where: whereConditions,
        include: includeConditions,
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: offset,
        distinct: true
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      res.json({
        success: true,
        data: {
          submissions: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error getting all submissions:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách bài nộp',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Lấy submissions của teacher (dựa trên TeacherAssignment)
  getTeacherSubmissions: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        classId,
        subjectId,
        sortBy = 'submittedAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Get teacher's assignments (classes and subjects they teach)
      const teacherAssignments = await TeacherAssignment.findAll({
        where: {
          teacherId: req.user.id,
          isActive: true
        },
        attributes: ['classId', 'subjectId']
      });

      if (teacherAssignments.length === 0) {
        // Teacher has no assignments, return empty result
        return res.json({
          success: true,
          data: {
            submissions: [],
            pagination: {
              currentPage: parseInt(page),
              totalPages: 0,
              totalItems: 0,
              itemsPerPage: parseInt(limit)
            }
          }
        });
      }

      // Build where conditions for submissions
      const whereConditions = {};
      if (status) {
        whereConditions.status = status;
      }

      // Build where conditions for assignment (to filter by class/subject)
      const assignmentWhere = {};
      
      // Build OR conditions for each (classId, subjectId) pair
      // This ensures teacher only sees submissions for exact class+subject combinations they teach
      const teacherConditions = teacherAssignments.map(ta => ({
        classId: ta.classId,
        subjectId: ta.subjectId
      }));

      // If user specifies classId or subjectId, add them as additional filters
      if (classId) {
        assignmentWhere.classId = parseInt(classId);
      }
      if (subjectId) {
        assignmentWhere.subjectId = parseInt(subjectId);
      }

      // Combine teacher conditions with user filters
      if (classId || subjectId) {
        // If user filters by class or subject, add to where clause
        assignmentWhere[Op.or] = teacherConditions;
      } else {
        // No user filters, just use teacher conditions
        assignmentWhere[Op.or] = teacherConditions;
      }

      // Build include conditions
      const includeConditions = [
        {
          model: Assignment,
          as: 'submissionAssignment',
          attributes: ['id', 'title', 'type', 'maxGrade', 'dueDate', 'classId', 'subjectId'],
          where: assignmentWhere,
          required: true, // INNER JOIN to filter submissions
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
        },
        {
          model: User,
          as: 'submissionStudent',
          attributes: ['id', 'name', 'email', 'code']
        },
        {
          model: User,
          as: 'submissionGrader',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Attachment,
          as: 'attachments',
          attributes: ['id', 'fileName', 'fileUrl', 'fileSize', 'fileType', 'mimeType']
        }
      ];

      const { count, rows } = await Submission.findAndCountAll({
        where: whereConditions,
        include: includeConditions,
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: offset,
        distinct: true
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      res.json({
        success: true,
        data: {
          submissions: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error getting teacher submissions:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách bài nộp',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Xóa bài nộp (Admin only)
  deleteSubmission: async (req, res) => {
    try {
      const submissionId = req.params.id;

      // Find submission with attachments
      const submission = await Submission.findByPk(submissionId, {
        include: [
          {
            model: Attachment,
            as: 'attachments'
          }
        ]
      });

      if (!submission) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bài nộp'
        });
      }

      // Delete associated files
      if (submission.attachments && submission.attachments.length > 0) {
        submission.attachments.forEach(attachment => {
          const filePath = path.join(__dirname, '..', attachment.fileUrl);
          cleanupFile(filePath);
        });
      }

      // Delete submission (will cascade delete attachments due to foreign key)
      await submission.destroy();

      return res.status(200).json({
        success: true,
        message: 'Xóa bài nộp thành công'
      });
    } catch (error) {
      console.error('Error deleting submission:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa bài nộp',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = submissionController;
