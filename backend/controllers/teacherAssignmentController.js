const { TeacherAssignment, User, Class, Subject } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

const teacherAssignmentController = {
  // Phân công giáo viên dạy môn (Admin only)
  assignTeacher: async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: errors.array()
        });
      }

      const { teacherId, classId, subjectId, startDate, endDate } = req.body;

      // Check if teacher exists
      const teacher = await User.findOne({
        where: { id: teacherId, role: 'teacher' }
      });

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy giáo viên'
        });
      }

      // Check if class exists
      const classExists = await Class.findByPk(classId);
      if (!classExists) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lớp học'
        });
      }

      // Check if subject exists
      const subject = await Subject.findByPk(subjectId);
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy môn học'
        });
      }

      // Check if assignment already exists (including soft-deleted ones for unique constraint)
      const existingAssignment = await TeacherAssignment.findOne({
        where: {
          teacherId,
          classId,
          subjectId
        },
        paranoid: false // Include soft-deleted records
      });

      if (existingAssignment) {
        // If found a soft-deleted one, restore it instead of creating new
        if (existingAssignment.deletedAt) {
          await existingAssignment.restore();
          await existingAssignment.update({
            startDate: startDate || new Date(),
            endDate,
            isActive: true
          });
          
          // Return restored assignment with full details
          const restoredAssignment = await TeacherAssignment.findByPk(existingAssignment.id, {
            include: [
              {
                model: User,
                as: 'teacher',
                attributes: ['id', 'name', 'email']
              },
              {
                model: Class,
                as: 'assignmentClass',
                attributes: ['id', 'name', 'code']
              },
              {
                model: Subject,
                as: 'assignmentSubject',
                attributes: ['id', 'name', 'code', 'credits']
              }
            ]
          });
          
          return res.status(200).json({
            success: true,
            message: 'Phân công giáo viên thành công',
            data: restoredAssignment
          });
        }
        
        // If it's an active assignment, return error
        return res.status(400).json({
          success: false,
          message: 'Giáo viên đã được phân công dạy môn này cho lớp này'
        });
      }

      // Create assignment
      console.log('Creating assignment with data:', {
        teacherId,
        classId,
        subjectId,
        startDate: startDate || new Date(),
        endDate,
        isActive: true
      });

      const newAssignment = await TeacherAssignment.create({
        teacherId,
        classId,
        subjectId,
        startDate: startDate || new Date(),
        endDate,
        isActive: true
      });

      // Return created assignment with full details
      const newAssignmentWithDetails = await TeacherAssignment.findByPk(newAssignment.id, {
        include: [
          {
            model: User,
            as: 'teacher',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Class,
            as: 'assignmentClass',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Subject,
            as: 'assignmentSubject',
            attributes: ['id', 'name', 'code', 'credits']
          }
        ]
      });

      return res.status(201).json({
        success: true,
        message: 'Phân công giáo viên thành công',
        data: newAssignmentWithDetails
      });
    } catch (error) {
      console.error('Error in assignTeacher:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Check if it's a Sequelize validation error
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'Phân công này đã tồn tại',
          errors: [
            {
              field: 'duplicate',
              message: 'Giáo viên đã được phân công dạy môn này cho lớp này'
            }
          ]
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi phân công giáo viên',
        errors: [
          {
            field: 'server',
            message: error.message
          }
        ]
      });
    }
  },

  // Lấy danh sách tất cả phân công (Admin only)
  getAllAssignments: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        teacherId,
        classId,
        subjectId,
        isActive
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const whereClause = {};

      if (teacherId) whereClause.teacherId = teacherId;
      if (classId) whereClause.classId = classId;
      if (subjectId) whereClause.subjectId = subjectId;
      if (isActive !== undefined) whereClause.isActive = isActive === 'true';

      const { count, rows } = await TeacherAssignment.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'teacher',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Class,
            as: 'assignmentClass',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Subject,
            as: 'assignmentSubject',
            attributes: ['id', 'name', 'code', 'credits']
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        data: {
          assignments: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error in getAllAssignments:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách phân công',
        errors: [
          {
            field: 'server',
            message: error.message
          }
        ]
      });
    }
  },

  // Cập nhật phân công (Admin only)
  updateAssignment: async (req, res) => {
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
      const { startDate, endDate, isActive } = req.body;

      const assignment = await TeacherAssignment.findByPk(id);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phân công'
        });
      }

      // Update assignment
      await assignment.update({
        startDate: startDate || assignment.startDate,
        endDate: endDate !== undefined ? endDate : assignment.endDate,
        isActive: isActive !== undefined ? isActive : assignment.isActive
      });

      // Get updated assignment with relations
      const updatedAssignment = await TeacherAssignment.findByPk(id, {
        include: [
          {
            model: User,
            as: 'teacher',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Class,
            as: 'assignmentClass',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Subject,
            as: 'assignmentSubject',
            attributes: ['id', 'name', 'code', 'credits']
          }
        ]
      });

      return res.status(200).json({
        success: true,
        message: 'Cập nhật phân công thành công',
        data: updatedAssignment
      });
    } catch (error) {
      console.error('Error in updateAssignment:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật phân công',
        errors: [
          {
            field: 'server',
            message: error.message
          }
        ]
      });
    }
  },

  // Xóa phân công (Admin only)
  deleteAssignment: async (req, res) => {
    try {
      const { id } = req.params;

      const assignment = await TeacherAssignment.findByPk(id);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phân công'
        });
      }

      await assignment.destroy();

      return res.status(200).json({
        success: true,
        message: 'Xóa phân công thành công'
      });
    } catch (error) {
      console.error('Error in deleteAssignment:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa phân công',
        errors: [
          {
            field: 'server',
            message: error.message
          }
        ]
      });
    }
  },

  // Lấy danh sách phân công của một giáo viên (Teacher only)
  getTeacherAssignments: async (req, res) => {
    try {
      const teacherId = req.user.role === 'teacher' ? req.user.id : req.params.teacherId;
      
      if (!teacherId) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin giáo viên'
        });
      }

      const assignments = await TeacherAssignment.findAll({
        where: {
          teacherId,
          isActive: true
        },
        include: [
          {
            model: User,
            as: 'teacher',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Class,
            as: 'assignmentClass',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Subject,
            as: 'assignmentSubject',
            attributes: ['id', 'name', 'code', 'credits']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        data: {
          assignments,
          total: assignments.length
        }
      });
    } catch (error) {
      console.error('Error in getTeacherAssignments:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách phân công của giáo viên',
        errors: [
          {
            field: 'server',
            message: error.message
          }
        ]
      });
    }
  },

  // Lấy danh sách phân công giáo viên theo lớp học (Student, Teacher, Admin có thể truy cập)
  getByClassId: async (req, res) => {
    try {
      const { classId } = req.params;

      if (!classId) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin lớp học'
        });
      }

      // Check if class exists
      const classExists = await Class.findByPk(classId);
      if (!classExists) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lớp học'
        });
      }

      const assignments = await TeacherAssignment.findAll({
        where: {
          classId,
          isActive: true
        },
        include: [
          {
            model: User,
            as: 'teacher',
            attributes: ['id', 'name', 'email', 'code']
          },
          {
            model: Class,
            as: 'assignmentClass',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Subject,
            as: 'assignmentSubject',
            attributes: ['id', 'name', 'code', 'description', 'credits']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        data: assignments,
        message: 'Lấy danh sách phân công giáo viên thành công'
      });
    } catch (error) {
      console.error('Error in getByClassId:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách phân công giáo viên theo lớp',
        errors: [
          {
            field: 'server',
            message: error.message
          }
        ]
      });
    }
  },

  // Lấy danh sách lớp của giáo viên (Teacher only)
  getTeacherClasses: async (req, res) => {
    try {
      const teacherId = req.user.id; // Get from authenticated user

      // Get all classes where this teacher is assigned
      const assignments = await TeacherAssignment.findAll({
        where: {
          teacherId: teacherId,
          isActive: true
        },
        include: [
          {
            model: Class,
            as: 'assignmentClass',
            attributes: ['id', 'name', 'code', 'description', 'createdAt', 'updatedAt'],
          },
          {
            model: Subject,
            as: 'assignmentSubject',
            attributes: ['id', 'name', 'code']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      // Extract unique classes
      const classesMap = new Map();
      assignments.forEach(assignment => {
        if (assignment.assignmentClass && !classesMap.has(assignment.assignmentClass.id)) {
          classesMap.set(assignment.assignmentClass.id, assignment.assignmentClass);
        }
      });

      const classes = Array.from(classesMap.values());

      return res.status(200).json({
        success: true,
        data: classes,
        message: 'Lấy danh sách lớp học thành công'
      });
    } catch (error) {
      console.error('Error in getTeacherClasses:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách lớp học của giáo viên',
        errors: [
          {
            field: 'server',
            message: error.message
          }
        ]
      });
    }
  }
};

module.exports = teacherAssignmentController;