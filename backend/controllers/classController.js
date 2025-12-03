const { Class, User, Subject, TeacherAssignment, ClassStudent } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

const classController = {
  // GET /classes - Lấy danh sách tất cả lớp học
  getAllClasses: async (req, res) => {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const offset = (page - 1) * limit;

      // Build where condition
      const whereCondition = {};
      if (search) {
        whereCondition.name = {
          [Op.like]: `%${search}%`
        };
      }

      const { count, rows: classes } = await Class.findAndCountAll({
        where: whereCondition,
        include: [
          {
            model: ClassStudent,
            as: 'students',
            include: [
              {
                model: User,
                as: 'student',
                attributes: ['id', 'name', 'email']
              }
            ]
          },
          {
            model: TeacherAssignment,
            as: 'classTeacherAssignments',
            include: [
              {
                model: User,
                as: 'teacher',
                attributes: ['id', 'name', 'email']
              },
              {
                model: Subject,
                as: 'assignmentSubject',
                attributes: ['id', 'name', 'code']
              }
            ]
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['name', 'ASC']]
      });

      // Format response data
      const formattedClasses = classes.map(classItem => {
        const classData = classItem.toJSON();
        return {
          ...classData,
          studentCount: classData.students?.length || 0,
          teachers: classData.classTeacherAssignments?.map(assignment => ({
            teacher: assignment.teacher,
            subject: assignment.assignmentSubject
          })) || []
        };
      });

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách lớp học thành công',
        data: {
          classes: formattedClasses,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error in getAllClasses:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách lớp học',
        errors: [{ field: 'server', message: error.message }]
      });
    }
  },

  // GET /classes/:id - Lấy thông tin chi tiết một lớp học
  getClassById: async (req, res) => {
    try {
      const { id } = req.params;

      const classItem = await Class.findByPk(id, {
        include: [
          {
            model: ClassStudent,
            as: 'students',
            include: [
              {
                model: User,
                as: 'student',
                attributes: ['id', 'name', 'email', 'createdAt']
              }
            ]
          },
          {
            model: TeacherAssignment,
            as: 'classTeacherAssignments',
            include: [
              {
                model: User,
                as: 'teacher',
                attributes: ['id', 'name', 'email']
              },
              {
                model: Subject,
                as: 'assignmentSubject',
                attributes: ['id', 'name', 'code', 'credits']
              }
            ]
          }
        ]
      });

      if (!classItem) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lớp học',
          errors: [{ field: 'id', message: 'Lớp học không tồn tại' }]
        });
      }

      const classData = classItem.toJSON();
      const formattedClass = {
        ...classData,
        studentCount: classData.students?.length || 0,
        teachers: classData.classTeacherAssignments?.map(assignment => ({
          id: assignment.id,
          teacher: assignment.teacher,
          subject: assignment.assignmentSubject,
          startDate: assignment.startDate,
          endDate: assignment.endDate,
          isActive: assignment.isActive
        })) || [],
        students: classData.students?.map(enrollment => ({
          id: enrollment.id,
          student: enrollment.student,
          enrolledAt: enrollment.enrolledAt,
          status: enrollment.status
        })) || []
      };

      return res.status(200).json({
        success: true,
        message: 'Lấy thông tin lớp học thành công',
        data: formattedClass
      });
    } catch (error) {
      console.error('Error in getClassById:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin lớp học',
        errors: [{ field: 'server', message: error.message }]
      });
    }
  },

  // POST /classes - Tạo lớp học mới (Admin only)
  createClass: async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ',
          errors: errors.array()
        });
      }

      const { name, code, maxStudents, description } = req.body;

      // Check if class code already exists (only code must be unique)
      if (code) {
        const existingClass = await Class.findOne({ where: { code } });
        if (existingClass) {
          return res.status(400).json({
            success: false,
            message: 'Mã lớp học đã tồn tại',
            errors: [{ field: 'code', message: 'Mã lớp học này đã được sử dụng' }]
          });
        }
      }

      const newClass = await Class.create({
        name,
        code,
        maxStudents,
        description
      });

      return res.status(201).json({
        success: true,
        message: 'Tạo lớp học thành công',
        data: newClass
      });
    } catch (error) {
      console.error('Error in createClass:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo lớp học',
        errors: [{ field: 'server', message: error.message }]
      });
    }
  },

  // PUT /classes/:id - Cập nhật lớp học (Admin only)
  updateClass: async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { name, code, maxStudents, description } = req.body;

      const classItem = await Class.findByPk(id);
      if (!classItem) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lớp học',
          errors: [{ field: 'id', message: 'Lớp học không tồn tại' }]
        });
      }

      // Check if new code already exists (only code must be unique, name can be duplicated)
      if (code && code !== classItem.code) {
        const existingClass = await Class.findOne({ 
          where: { 
            code,
            id: { [Op.ne]: id }
          } 
        });
        if (existingClass) {
          return res.status(400).json({
            success: false,
            message: 'Mã lớp học đã tồn tại',
            errors: [{ field: 'code', message: 'Mã lớp học này đã được sử dụng' }]
          });
        }
      }

      await classItem.update({
        name: name || classItem.name,
        code: code || classItem.code,
        maxStudents: maxStudents !== undefined ? maxStudents : classItem.maxStudents,
        description: description !== undefined ? description : classItem.description
      });

      return res.status(200).json({
        success: true,
        message: 'Cập nhật lớp học thành công',
        data: classItem
      });
    } catch (error) {
      console.error('Error in updateClass:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật lớp học',
        errors: [{ field: 'server', message: error.message }]
      });
    }
  },

  // DELETE /classes/:id - Xóa lớp học (Admin only)
  deleteClass: async (req, res) => {
    try {
      const { id } = req.params;

      const classItem = await Class.findByPk(id);
      if (!classItem) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lớp học',
          errors: [{ field: 'id', message: 'Lớp học không tồn tại' }]
        });
      }

      // Check if class has students
      const studentCount = await ClassStudent.count({ where: { classId: id } });
      if (studentCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Không thể xóa lớp học có học sinh',
          errors: [{ field: 'students', message: `Lớp có ${studentCount} học sinh, không thể xóa` }]
        });
      }

      // Check if class has teacher assignments
      const assignmentCount = await TeacherAssignment.count({ where: { classId: id } });
      if (assignmentCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Không thể xóa lớp học có phân công giáo viên',
          errors: [{ field: 'assignments', message: `Lớp có ${assignmentCount} phân công giáo viên, không thể xóa` }]
        });
      }

      await classItem.destroy();

      return res.status(200).json({
        success: true,
        message: 'Xóa lớp học thành công',
        data: { id: parseInt(id) }
      });
    } catch (error) {
      console.error('Error in deleteClass:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa lớp học',
        errors: [{ field: 'server', message: error.message }]
      });
    }
  },

  // GET /classes/:id/students - Lấy danh sách học sinh trong lớp
  getClassStudents: async (req, res) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      // Check if class exists
      const classItem = await Class.findByPk(id);
      if (!classItem) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lớp học',
          errors: [{ field: 'id', message: 'Lớp học không tồn tại' }]
        });
      }

      const { count, rows: enrollments } = await ClassStudent.findAndCountAll({
        where: { classId: id },
        include: [
          {
            model: User,
            as: 'student',
            attributes: ['id', 'name', 'email', 'createdAt'],
            where: { role: 'student' }
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['enrolledAt', 'DESC']]
      });

      const students = enrollments.map(enrollment => ({
        enrollmentId: enrollment.id,
        student: enrollment.student,
        enrolledAt: enrollment.enrolledAt,
        status: enrollment.status
      }));

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách học sinh thành công',
        data: {
          class: {
            id: classItem.id,
            name: classItem.name
          },
          students,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error in getClassStudents:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách học sinh',
        errors: [{ field: 'server', message: error.message }]
      });
    }
  },

  // Thêm học sinh vào lớp
  addStudentsToClass: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      const { studentIds } = req.body;

      // Kiểm tra lớp học có tồn tại
      const classExists = await Class.findByPk(id);
      if (!classExists) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lớp học',
          errors: [{ field: 'classId', message: 'Lớp học không tồn tại' }]
        });
      }

      // Kiểm tra tất cả học sinh có tồn tại và có role là Student
      const students = await User.findAll({
        where: { 
          id: studentIds, 
          role: 'Student' 
        }
      });

      if (students.length !== studentIds.length) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Một số học sinh không tồn tại hoặc không có quyền học sinh',
          errors: [{ field: 'studentIds', message: 'Học sinh không hợp lệ' }]
        });
      }

      // Kiểm tra học sinh nào đã được ghi danh
      const existingEnrollments = await ClassStudent.findAll({
        where: {
          studentId: studentIds,
          classId: id
        }
      });

      const existingStudentIds = existingEnrollments.map(e => e.studentId);
      const newStudentIds = studentIds.filter(studentId => !existingStudentIds.includes(studentId));

      if (newStudentIds.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Tất cả học sinh đã được ghi danh vào lớp này',
          errors: [{ field: 'studentIds', message: 'Học sinh đã tồn tại trong lớp' }]
        });
      }

      // Tạo các bản ghi ghi danh mới
      const enrollmentData = newStudentIds.map(studentId => ({
        studentId,
        classId: id,
        enrollmentDate: new Date(),
        isActive: true
      }));

      await ClassStudent.bulkCreate(enrollmentData, { transaction });
      await transaction.commit();

      return res.status(201).json({
        success: true,
        message: `Thêm thành công ${newStudentIds.length} học sinh vào lớp`,
        data: {
          enrolledCount: newStudentIds.length,
          skippedCount: existingStudentIds.length
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Error in addStudentsToClass:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi thêm học sinh vào lớp',
        errors: [{ field: 'server', message: error.message }]
      });
    }
  },

  // Xóa học sinh khỏi lớp
  removeStudentFromClass: async (req, res) => {
    try {
      const { id, studentId } = req.params;

      // Kiểm tra lớp học có tồn tại
      const classExists = await Class.findByPk(id);
      if (!classExists) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lớp học',
          errors: [{ field: 'classId', message: 'Lớp học không tồn tại' }]
        });
      }

      // Kiểm tra học sinh có tồn tại và có role là Student
      const student = await User.findOne({
        where: { 
          id: studentId, 
          role: 'Student' 
        }
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy học sinh',
          errors: [{ field: 'studentId', message: 'Học sinh không tồn tại' }]
        });
      }

      // Tìm và xóa bản ghi ghi danh
      const enrollment = await ClassStudent.findOne({
        where: {
          studentId,
          classId: id
        }
      });

      if (!enrollment) {
        return res.status(404).json({
          success: false,
          message: 'Học sinh không có trong lớp này',
          errors: [{ field: 'enrollment', message: 'Không tìm thấy bản ghi ghi danh' }]
        });
      }

      await enrollment.destroy();

      return res.json({
        success: true,
        message: 'Xóa học sinh khỏi lớp thành công',
        data: {
          studentName: student.fullName,
          className: classExists.name
        }
      });

    } catch (error) {
      console.error('Error in removeStudentFromClass:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa học sinh khỏi lớp',
        errors: [{ field: 'server', message: error.message }]
      });
    }
  }
};

module.exports = classController;