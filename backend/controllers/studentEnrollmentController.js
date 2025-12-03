const { ClassStudent, Class, User } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

const studentEnrollmentController = {
  // Ghi danh học sinh vào lớp
  enrollStudent: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { studentId, classId, enrollmentDate, isActive } = req.body;

      // Kiểm tra học sinh có tồn tại và có role là Student
      const student = await User.findOne({
        where: { 
          id: studentId, 
          role: 'student' 
        }
      });

      if (!student) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy học sinh hoặc người dùng không có quyền học sinh'
        });
      }

      // Kiểm tra lớp học có tồn tại
      const classExists = await Class.findByPk(classId);
      if (!classExists) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lớp học'
        });
      }

      // Kiểm tra học sinh đã được ghi danh vào lớp này chưa
      const existingEnrollment = await ClassStudent.findOne({
        where: {
          studentId,
          classId
        }
      });

      if (existingEnrollment) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Học sinh đã được ghi danh vào lớp này'
        });
      }

      // Xác định status dựa trên isActive
      const status = isActive === false ? 'inactive' : 'active';

      // Tạo bản ghi ghi danh mới
      const enrollment = await ClassStudent.create({
        studentId,
        classId,
        enrolledAt: enrollmentDate || new Date(),
        status: status
      }, { transaction });

      await transaction.commit();

      // Lấy thông tin chi tiết để trả về
      const enrollmentDetail = await ClassStudent.findByPk(enrollment.id, {
        include: [
          {
            model: User,
            as: 'student',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Class,
            as: 'enrollmentClass',
            attributes: ['id', 'name', 'code']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Ghi danh học sinh vào lớp thành công',
        data: enrollmentDetail
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Error enrolling student:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi ghi danh học sinh',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Ghi danh nhiều học sinh vào lớp
  enrollMultipleStudents: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { studentIds, classId, enrollmentDate } = req.body;

      // Kiểm tra lớp học có tồn tại
      const classExists = await Class.findByPk(classId);
      if (!classExists) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lớp học'
        });
      }

      // Kiểm tra tất cả học sinh có tồn tại và có role là Student
      const students = await User.findAll({
        where: { 
          id: studentIds, 
          role: 'student' 
        }
      });

      if (students.length !== studentIds.length) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Một số học sinh không tồn tại hoặc không có quyền học sinh'
        });
      }

      // Kiểm tra học sinh nào đã được ghi danh
      const existingEnrollments = await ClassStudent.findAll({
        where: {
          studentId: studentIds,
          classId
        }
      });

      const existingStudentIds = existingEnrollments.map(e => e.studentId);
      const newStudentIds = studentIds.filter(id => !existingStudentIds.includes(id));

      if (newStudentIds.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Tất cả học sinh đã được ghi danh vào lớp này'
        });
      }

      // Tạo các bản ghi ghi danh mới
      const enrollmentData = newStudentIds.map(studentId => ({
        studentId,
        classId,
        enrolledAt: enrollmentDate || new Date(),
        status: 'active'
      }));

      const enrollments = await ClassStudent.bulkCreate(enrollmentData, { transaction });
      await transaction.commit();

      res.status(201).json({
        success: true,
        message: `Ghi danh thành công ${newStudentIds.length} học sinh vào lớp`,
        data: {
          enrolledCount: newStudentIds.length,
          skippedCount: existingStudentIds.length,
          enrollments
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Error enrolling multiple students:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi ghi danh học sinh',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Lấy danh sách tất cả ghi danh
  getAllEnrollments: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        classId,
        studentId,
        status,
        search
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Lọc theo lớp học
      if (classId) {
        whereClause.classId = classId;
      }

      // Lọc theo học sinh
      if (studentId) {
        whereClause.studentId = studentId;
      }

      // Lọc theo trạng thái
      if (status !== undefined) {
        whereClause.status = status;
      }

      // Điều kiện include cho tìm kiếm
      const includeClause = [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email', 'code'],
          where: search ? {
            [Op.or]: [
              { name: { [Op.iLike]: `%${search}%` } },
              { email: { [Op.iLike]: `%${search}%` } }
            ]
          } : undefined
        },
        {
          model: Class,
          as: 'enrollmentClass',
          attributes: ['id', 'name', 'code', 'description'],
          where: search ? {
            [Op.or]: [
              { name: { [Op.iLike]: `%${search}%` } },
              { description: { [Op.iLike]: `%${search}%` } }
            ]
          } : undefined
        }
      ];

      const { count, rows } = await ClassStudent.findAndCountAll({
        where: whereClause,
        include: includeClause,
        limit: parseInt(limit),
        offset: offset,
        order: [['createdAt', 'DESC']]
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        message: 'Lấy danh sách ghi danh thành công',
        data: {
          enrollments: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error getting enrollments:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách ghi danh',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Cập nhật trạng thái ghi danh
  updateEnrollment: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, enrollmentDate, isActive } = req.body;

      const enrollment = await ClassStudent.findByPk(id);
      if (!enrollment) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bản ghi ghi danh'
        });
      }

      // Cập nhật thông tin
      const updateData = {};
      
      // Xử lý isActive nếu được gửi từ frontend
      if (isActive !== undefined) {
        updateData.status = isActive ? 'active' : 'inactive';
      } else if (status !== undefined) {
        // Fallback về status trực tiếp nếu không có isActive
        updateData.status = status;
      }
      
      if (enrollmentDate) updateData.enrolledAt = enrollmentDate;

      await enrollment.update(updateData);

      // Lấy thông tin chi tiết sau khi cập nhật
      const updatedEnrollment = await ClassStudent.findByPk(id, {
        include: [
          {
            model: User,
            as: 'student',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Class,
            as: 'enrollmentClass',
            attributes: ['id', 'name', 'code']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Cập nhật ghi danh thành công',
        data: updatedEnrollment
      });

    } catch (error) {
      console.error('Error updating enrollment:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật ghi danh',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Xóa ghi danh (soft delete)
  deleteEnrollment: async (req, res) => {
    try {
      const { id } = req.params;

      const enrollment = await ClassStudent.findByPk(id);
      if (!enrollment) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bản ghi ghi danh'
        });
      }

      await enrollment.destroy();

      res.json({
        success: true,
        message: 'Xóa ghi danh thành công'
      });

    } catch (error) {
      console.error('Error deleting enrollment:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa ghi danh',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Lấy lớp học của một học sinh
  getStudentClasses: async (req, res) => {
    try {
      const { studentId } = req.params;
      const { page = 1, limit = 10, status } = req.query;

      // Kiểm tra học sinh có tồn tại
      const student = await User.findOne({
        where: { id: studentId, role: 'student' }
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy học sinh'
        });
      }

      const offset = (page - 1) * limit;
      const whereClause = { studentId };

      if (status !== undefined) {
        whereClause.status = status;
      }

      const { count, rows } = await ClassStudent.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Class,
            as: 'enrollmentClass',
            attributes: ['id', 'name', 'code', 'description']
          }
        ],
        limit: parseInt(limit),
        offset: offset,
        order: [['createdAt', 'DESC']]
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        message: 'Lấy danh sách lớp học của học sinh thành công',
        data: {
          student: {
            id: student.id,
            fullName: student.fullName,
            email: student.email
          },
          enrollments: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error getting student classes:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách lớp học của học sinh',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Lấy danh sách sinh viên của một lớp
  getByClassId: async (req, res) => {
    try {
      const { classId } = req.params;

      // Kiểm tra lớp học có tồn tại
      const classExists = await Class.findByPk(classId);
      if (!classExists) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lớp học'
        });
      }

      // Lấy danh sách sinh viên trong lớp
      const enrollments = await ClassStudent.findAll({
        where: { classId },
        include: [
          {
            model: User,
            as: 'student',
            attributes: ['id', 'name', 'email', 'code', 'role']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        message: 'Lấy danh sách sinh viên của lớp thành công',
        data: enrollments
      });

    } catch (error) {
      console.error('Error getting class students:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách sinh viên của lớp',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = studentEnrollmentController;