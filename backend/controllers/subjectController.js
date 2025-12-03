const { Subject, TeacherAssignment, Class, User } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

const subjectController = {
  // GET /subjects - Lấy danh sách tất cả môn học
  getAllSubjects: async (req, res) => {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const offset = (page - 1) * limit;

      // Build where condition
      const whereCondition = {};
      if (search) {
        whereCondition[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { code: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows: subjects } = await Subject.findAndCountAll({
        where: whereCondition,
        include: [
          {
            model: TeacherAssignment,
            as: 'subjectTeacherAssignments',
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
              }
            ]
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['name', 'ASC']]
      });

      // Format response data
      const formattedSubjects = subjects.map(subject => {
        const subjectData = subject.toJSON();
        return {
          ...subjectData,
          assignmentCount: subjectData.subjectTeacherAssignments?.length || 0,
          classes: subjectData.subjectTeacherAssignments?.map(assignment => ({
            class: assignment.assignmentClass,
            teacher: assignment.teacher
          })) || []
        };
      });

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách môn học thành công',
        data: {
          subjects: formattedSubjects,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error in getAllSubjects:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách môn học',
        errors: [{ field: 'server', message: error.message }]
      });
    }
  },

  // GET /subjects/:id - Lấy thông tin chi tiết một môn học
  getSubjectById: async (req, res) => {
    try {
      const { id } = req.params;

      const subject = await Subject.findByPk(id, {
        include: [
          {
            model: TeacherAssignment,
            as: 'subjectTeacherAssignments',
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
              }
            ]
          }
        ]
      });

      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy môn học',
          errors: [{ field: 'id', message: 'Môn học không tồn tại' }]
        });
      }

      const subjectData = subject.toJSON();
      const formattedSubject = {
        ...subjectData,
        assignmentCount: subjectData.subjectTeacherAssignments?.length || 0,
        assignments: subjectData.subjectTeacherAssignments?.map(assignment => ({
          id: assignment.id,
          teacher: assignment.teacher,
          class: assignment.assignmentClass,
          startDate: assignment.startDate,
          endDate: assignment.endDate,
          isActive: assignment.isActive
        })) || []
      };

      return res.status(200).json({
        success: true,
        message: 'Lấy thông tin môn học thành công',
        data: formattedSubject
      });
    } catch (error) {
      console.error('Error in getSubjectById:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin môn học',
        errors: [{ field: 'server', message: error.message }]
      });
    }
  },

  // POST /subjects - Tạo môn học mới (Admin only)
  createSubject: async (req, res) => {
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

      const { name, code, description, credits } = req.body;

      // Check if subject code already exists (only code must be unique)
      const existingSubject = await Subject.findOne({ 
        where: { code } 
      });
      
      if (existingSubject) {
        return res.status(400).json({
          success: false,
          message: 'Mã môn học đã tồn tại',
          errors: [{ field: 'code', message: 'Mã môn học đã tồn tại' }]
        });
      }

      const newSubject = await Subject.create({
        name,
        code,
        description,
        credits: credits || 1
      });

      return res.status(201).json({
        success: true,
        message: 'Tạo môn học thành công',
        data: newSubject
      });
    } catch (error) {
      console.error('Error in createSubject:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo môn học',
        errors: [{ field: 'server', message: error.message }]
      });
    }
  },

  // PUT /subjects/:id - Cập nhật môn học (Admin only)
  updateSubject: async (req, res) => {
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
      const { name, code, description, credits } = req.body;

      const subject = await Subject.findByPk(id);
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy môn học',
          errors: [{ field: 'id', message: 'Môn học không tồn tại' }]
        });
      }

      // Check if new code already exists (only code must be unique, name can be duplicated)
      const updateData = {};
      if (name !== undefined) {
        updateData.name = name;
      }

      if (code && code !== subject.code) {
        const existingByCode = await Subject.findOne({ 
          where: { 
            code,
            id: { [Op.ne]: id }
          } 
        });
        if (existingByCode) {
          return res.status(400).json({
            success: false,
            message: 'Mã môn học đã tồn tại',
            errors: [{ field: 'code', message: 'Mã môn học này đã được sử dụng' }]
          });
        }
        updateData.code = code;
      }

      if (description !== undefined) updateData.description = description;
      if (credits) updateData.credits = credits;

      await subject.update(updateData);

      return res.status(200).json({
        success: true,
        message: 'Cập nhật môn học thành công',
        data: subject
      });
    } catch (error) {
      console.error('Error in updateSubject:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật môn học',
        errors: [{ field: 'server', message: error.message }]
      });
    }
  },

  // DELETE /subjects/:id - Xóa môn học (Admin only)
  deleteSubject: async (req, res) => {
    try {
      const { id } = req.params;

      const subject = await Subject.findByPk(id);
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy môn học',
          errors: [{ field: 'id', message: 'Môn học không tồn tại' }]
        });
      }

      // Check if subject has teacher assignments
      const assignmentCount = await TeacherAssignment.count({ where: { subjectId: id } });
      if (assignmentCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Không thể xóa môn học có phân công giáo viên',
          errors: [{ field: 'assignments', message: `Môn học có ${assignmentCount} phân công giáo viên, không thể xóa` }]
        });
      }

      await subject.destroy();

      return res.status(200).json({
        success: true,
        message: 'Xóa môn học thành công',
        data: { id: parseInt(id) }
      });
    } catch (error) {
      console.error('Error in deleteSubject:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa môn học',
        errors: [{ field: 'server', message: error.message }]
      });
    }
  }
};

module.exports = subjectController;