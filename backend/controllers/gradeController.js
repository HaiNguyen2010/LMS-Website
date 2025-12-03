const { Grade, User, Subject, Class, TeacherAssignment, ClassStudent } = require('../models');
const { validationResult } = require('express-validator');
const { Op, Sequelize } = require('sequelize');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const gradeController = {
  // Nhập điểm mới (Admin, Teacher)
  createGrade: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: errors.array()
        });
      }

      const {
        studentId,
        subjectId,
        classId,
        gradeValue,
        gradeType,
        weight,
        term,
        academicYear,
        remarks
      } = req.body;

      // Kiểm tra quyền của teacher
      if (req.user.role === 'teacher') {
        const teacherAssignment = await TeacherAssignment.findOne({
          where: {
            teacherId: req.user.id,
            classId,
            subjectId,
            isActive: true
          }
        });

        if (!teacherAssignment) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền nhập điểm cho lớp và môn học này'
          });
        }
      }

      // Kiểm tra học sinh có trong lớp không
      const enrollment = await ClassStudent.findOne({
        where: {
          studentId,
          classId,
          status: 'active'
        }
      });

      if (!enrollment) {
        return res.status(400).json({
          success: false,
          message: 'Học sinh không có trong lớp này'
        });
      }

      // Kiểm tra điểm đã tồn tại cho học sinh, môn, lớp, loại điểm, học kỳ
      const existingGrade = await Grade.findOne({
        where: {
          studentId,
          subjectId,
          classId,
          gradeType,
          term,
          academicYear: academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
          isActive: true
        }
      });

      if (existingGrade) {
        return res.status(400).json({
          success: false,
          message: `Điểm ${gradeType} cho học sinh này trong học kỳ ${term} đã tồn tại. Vui lòng cập nhật thay vì tạo mới.`
        });
      }

      // Tạo điểm mới
      const grade = await Grade.create({
        studentId,
        subjectId,
        classId,
        gradeValue,
        gradeType,
        weight,
        term,
        academicYear,
        remarks,
        recordedBy: req.user.id
      });

      // Lấy thông tin chi tiết của grade vừa tạo
      const createdGrade = await Grade.findByPk(grade.id, {
        include: [
          {
            model: User,
            as: 'gradeStudent',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Subject,
            as: 'gradeSubject',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Class,
            as: 'gradeClass',
            attributes: ['id', 'name', 'code']
          },
          {
            model: User,
            as: 'gradeRecorder',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Nhập điểm thành công',
        data: createdGrade
      });

    } catch (error) {
      console.error('Error creating grade:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi nhập điểm',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Lấy tất cả danh sách điểm (Admin, Teacher)
  getAllGrades: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        classId,
        subjectId,
        studentId,
        term,
        academicYear,
        gradeType,
        sortBy = 'recordedAt',
        sortOrder = 'DESC'
      } = req.query;

      // Kiểm tra quyền truy cập của teacher
      if (req.user.role === 'teacher') {
        // Teacher chỉ xem được điểm của các lớp và môn họ dạy
        const teacherAssignments = await TeacherAssignment.findAll({
          where: {
            teacherId: req.user.id,
            isActive: true
          },
          attributes: ['classId', 'subjectId']
        });

        if (teacherAssignments.length === 0) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền xem điểm'
          });
        }

        // Build conditions cho teacher
        const teacherConditions = teacherAssignments.map(assignment => ({
          classId: assignment.classId,
          subjectId: assignment.subjectId
        }));

        // Filter based on teacher's assignments
        const whereConditions = {
          isActive: true,
          [Op.or]: teacherConditions
        };

        if (classId) whereConditions.classId = classId;
        if (subjectId) whereConditions.subjectId = subjectId;
        if (studentId) whereConditions.studentId = studentId;
        if (term) whereConditions.term = term;
        if (academicYear) whereConditions.academicYear = academicYear;
        if (gradeType) whereConditions.gradeType = gradeType;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await Grade.findAndCountAll({
          where: whereConditions,
          include: [
            {
              model: User,
              as: 'gradeStudent',
              attributes: ['id', 'name', 'email', 'code']
            },
            {
              model: Subject,
              as: 'gradeSubject',
              attributes: ['id', 'name', 'code']
            },
            {
              model: Class,
              as: 'gradeClass',
              attributes: ['id', 'name', 'code']
            },
            {
              model: User,
              as: 'gradeRecorder',
              attributes: ['id', 'name', 'email']
            }
          ],
          order: [[sortBy, sortOrder.toUpperCase()]],
          limit: parseInt(limit),
          offset: offset
        });

        const totalPages = Math.ceil(count / parseInt(limit));

        return res.json({
          success: true,
          data: {
            items: rows,
            pagination: {
              currentPage: parseInt(page),
              totalPages,
              totalItems: count,
              itemsPerPage: parseInt(limit)
            }
          }
        });
      }

      // Admin có thể xem tất cả
      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build where conditions for admin
      const whereConditions = {
        isActive: true
      };

      if (classId) whereConditions.classId = classId;
      if (subjectId) whereConditions.subjectId = subjectId;
      if (studentId) whereConditions.studentId = studentId;
      if (term) whereConditions.term = term;
      if (academicYear) whereConditions.academicYear = academicYear;
      if (gradeType) whereConditions.gradeType = gradeType;

      const { count, rows } = await Grade.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: User,
            as: 'gradeStudent',
            attributes: ['id', 'name', 'email', 'code']
          },
          {
            model: Subject,
            as: 'gradeSubject',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Class,
            as: 'gradeClass',
            attributes: ['id', 'name', 'code']
          },
          {
            model: User,
            as: 'gradeRecorder',
            attributes: ['id', 'name', 'email']
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
          items: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error getting all grades:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách điểm',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Lấy danh sách điểm theo lớp
  getGradesByClass: async (req, res) => {
    try {
      const { classId } = req.query;
      const {
        page = 1,
        limit = 20,
        subjectId,
        term,
        academicYear,
        gradeType,
        sortBy = 'recordedAt',
        sortOrder = 'DESC'
      } = req.query;

      if (!classId) {
        return res.status(400).json({
          success: false,
          message: 'Class ID là bắt buộc'
        });
      }

      // Kiểm tra quyền truy cập
      if (req.user.role === 'teacher') {
        const hasAccess = await TeacherAssignment.findOne({
          where: {
            teacherId: req.user.id,
            classId,
            ...(subjectId && { subjectId }),
            isActive: true
          }
        });

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền xem điểm của lớp này'
          });
        }
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build where conditions
      const whereConditions = {
        classId,
        isActive: true
      };

      if (subjectId) whereConditions.subjectId = subjectId;
      if (term) whereConditions.term = term;
      if (academicYear) whereConditions.academicYear = academicYear;
      if (gradeType) whereConditions.gradeType = gradeType;

      const { count, rows } = await Grade.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: User,
            as: 'gradeStudent',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Subject,
            as: 'gradeSubject',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Class,
            as: 'gradeClass',
            attributes: ['id', 'name', 'code']
          },
          {
            model: User,
            as: 'gradeRecorder',
            attributes: ['id', 'name', 'email']
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
          grades: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error getting grades by class:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách điểm',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Xem điểm cá nhân học sinh
  getStudentGrades: async (req, res) => {
    try {
      const { id: studentId } = req.params;
      const {
        page = 1,
        limit = 20,
        subjectId,
        classId,
        term,
        academicYear,
        gradeType,
        sortBy = 'recordedAt',
        sortOrder = 'DESC'
      } = req.query;

      // Kiểm tra quyền truy cập
      if (req.user.role === 'student' && req.user.id !== parseInt(studentId)) {
        return res.status(403).json({
          success: false,
          message: 'Bạn chỉ có thể xem điểm của chính mình'
        });
      }

      if (req.user.role === 'teacher') {
        // Teacher chỉ xem được điểm của học sinh trong lớp mình dạy
        const hasAccess = await TeacherAssignment.findOne({
          where: {
            teacherId: req.user.id,
            ...(classId && { classId }),
            ...(subjectId && { subjectId }),
            isActive: true
          },
          include: [{
            model: Class,
            as: 'assignmentClass',
            include: [{
              model: ClassStudent,
              as: 'students',
              where: { studentId, status: 'active' }
            }]
          }]
        });

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền xem điểm của học sinh này'
          });
        }
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build where conditions
      const whereConditions = {
        studentId,
        isActive: true
      };

      if (subjectId) whereConditions.subjectId = subjectId;
      if (classId) whereConditions.classId = classId;
      if (term) whereConditions.term = term;
      if (academicYear) whereConditions.academicYear = academicYear;
      if (gradeType) whereConditions.gradeType = gradeType;

      const { count, rows } = await Grade.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: User,
            as: 'gradeStudent',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Subject,
            as: 'gradeSubject',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Class,
            as: 'gradeClass',
            attributes: ['id', 'name', 'code']
          },
          {
            model: User,
            as: 'gradeRecorder',
            attributes: ['id', 'name', 'email']
          }
        ],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: offset
      });

      // Tính điểm trung bình theo môn và học kỳ
      const averages = await Grade.sequelize.query(`
        SELECT 
          subjectId,
          term,
          SUM(gradeValue * weight) / SUM(weight) as averageGrade,
          COUNT(*) as totalGrades
        FROM Grades 
        WHERE studentId = :studentId 
          AND isActive = true 
          ${classId ? 'AND classId = :classId' : ''}
          ${academicYear ? 'AND academicYear = :academicYear' : ''}
          AND deletedAt IS NULL
        GROUP BY subjectId, term
      `, {
        replacements: { 
          studentId,
          ...(classId && { classId }),
          ...(academicYear && { academicYear })
        },
        type: Sequelize.QueryTypes.SELECT
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      res.json({
        success: true,
        data: {
          grades: rows,
          averages: averages,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error getting student grades:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy điểm học sinh',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Cập nhật điểm
  updateGrade: async (req, res) => {
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
      const { gradeValue, weight, remarks } = req.body;

      const grade = await Grade.findByPk(id);
      if (!grade || !grade.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy điểm'
        });
      }

      // Kiểm tra quyền cập nhật
      if (req.user.role === 'teacher') {
        const teacherAssignment = await TeacherAssignment.findOne({
          where: {
            teacherId: req.user.id,
            classId: grade.classId,
            subjectId: grade.subjectId,
            isActive: true
          }
        });

        if (!teacherAssignment && grade.recordedBy !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền cập nhật điểm này'
          });
        }
      }

      // Cập nhật điểm
      await grade.update({
        gradeValue: gradeValue || grade.gradeValue,
        weight: weight || grade.weight,
        remarks: remarks !== undefined ? remarks : grade.remarks,
        recordedBy: req.user.id, // Cập nhật người sửa
        recordedAt: new Date()
      });

      // Lấy thông tin chi tiết sau khi cập nhật
      const updatedGrade = await Grade.findByPk(id, {
        include: [
          {
            model: User,
            as: 'gradeStudent',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Subject,
            as: 'gradeSubject',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Class,
            as: 'gradeClass',
            attributes: ['id', 'name', 'code']
          },
          {
            model: User,
            as: 'gradeRecorder',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Cập nhật điểm thành công',
        data: updatedGrade
      });

    } catch (error) {
      console.error('Error updating grade:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật điểm',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Xóa điểm (soft delete)
  deleteGrade: async (req, res) => {
    try {
      const { id } = req.params;

      const grade = await Grade.findByPk(id);
      if (!grade || !grade.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy điểm'
        });
      }

      // Kiểm tra quyền xóa
      if (req.user.role === 'teacher') {
        const teacherAssignment = await TeacherAssignment.findOne({
          where: {
            teacherId: req.user.id,
            classId: grade.classId,
            subjectId: grade.subjectId,
            isActive: true
          }
        });

        if (!teacherAssignment && grade.recordedBy !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền xóa điểm này'
          });
        }
      }

      // Soft delete
      await grade.update({ isActive: false });
      await grade.destroy(); // Paranoid delete

      res.json({
        success: true,
        message: 'Xóa điểm thành công'
      });

    } catch (error) {
      console.error('Error deleting grade:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa điểm',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Xuất báo cáo điểm CSV
  exportGradesCSV: async (req, res) => {
    try {
      const { classId, subjectId, term, academicYear } = req.query;

      if (!classId) {
        return res.status(400).json({
          success: false,
          message: 'Class ID là bắt buộc'
        });
      }

      // Kiểm tra quyền
      if (req.user.role === 'teacher') {
        const hasAccess = await TeacherAssignment.findOne({
          where: {
            teacherId: req.user.id,
            classId,
            ...(subjectId && { subjectId }),
            isActive: true
          }
        });

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền xuất báo cáo của lớp này'
          });
        }
      }

      // Build where conditions
      const whereConditions = { classId, isActive: true };
      if (subjectId) whereConditions.subjectId = subjectId;
      if (term) whereConditions.term = term;
      if (academicYear) whereConditions.academicYear = academicYear;

      const grades = await Grade.findAll({
        where: whereConditions,
        include: [
          {
            model: User,
            as: 'gradeStudent',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Subject,
            as: 'gradeSubject',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Class,
            as: 'gradeClass',
            attributes: ['id', 'name', 'code']
          }
        ],
        order: [['gradeStudent', 'name'], ['gradeSubject', 'name'], ['gradeType']]
      });

      // Tạo workbook Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Bảng Điểm');

      // Header
      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 5 },
        { header: 'Mã HS', key: 'studentId', width: 10 },
        { header: 'Tên học sinh', key: 'studentName', width: 25 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Môn học', key: 'subject', width: 20 },
        { header: 'Loại điểm', key: 'gradeType', width: 15 },
        { header: 'Điểm', key: 'gradeValue', width: 10 },
        { header: 'Trọng số', key: 'weight', width: 10 },
        { header: 'Học kỳ', key: 'term', width: 10 },
        { header: 'Năm học', key: 'academicYear', width: 15 },
        { header: 'Ghi chú', key: 'remarks', width: 30 }
      ];

      // Data
      grades.forEach((grade, index) => {
        worksheet.addRow({
          stt: index + 1,
          studentId: grade.gradeStudent.id,
          studentName: grade.gradeStudent.name,
          email: grade.gradeStudent.email,
          subject: `${grade.gradeSubject.code} - ${grade.gradeSubject.name}`,
          gradeType: grade.gradeType,
          gradeValue: grade.gradeValue,
          weight: grade.weight,
          term: grade.term,
          academicYear: grade.academicYear,
          remarks: grade.remarks || ''
        });
      });

      // Style header
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Set response headers
      const filename = `grades_class_${classId}_${Date.now()}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Write to response
      await workbook.xlsx.write(res);
      res.end();

    } catch (error) {
      console.error('Error exporting grades CSV:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xuất báo cáo',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Tính toán thống kê điểm
  getGradeStatistics: async (req, res) => {
    try {
      const { classId, subjectId, term, academicYear } = req.query;

      if (!classId) {
        return res.status(400).json({
          success: false,
          message: 'Class ID là bắt buộc'
        });
      }

      // Kiểm tra quyền
      if (req.user.role === 'teacher') {
        const hasAccess = await TeacherAssignment.findOne({
          where: {
            teacherId: req.user.id,
            classId,
            ...(subjectId && { subjectId }),
            isActive: true
          }
        });

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền xem thống kê của lớp này'
          });
        }
      }

      // Build where conditions
      const whereConditions = { classId, isActive: true };
      if (subjectId) whereConditions.subjectId = subjectId;
      if (term) whereConditions.term = term;
      if (academicYear) whereConditions.academicYear = academicYear;

      // Thống kê tổng quan
      const statistics = await Grade.findAll({
        attributes: [
          'subjectId',
          [Sequelize.fn('AVG', Sequelize.col('gradeValue')), 'averageGrade'],
          [Sequelize.fn('MIN', Sequelize.col('gradeValue')), 'minGrade'],
          [Sequelize.fn('MAX', Sequelize.col('gradeValue')), 'maxGrade'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalGrades'],
          [Sequelize.fn('COUNT', Sequelize.literal('CASE WHEN gradeValue >= 5 THEN 1 END')), 'passingGrades']
        ],
        where: whereConditions,
        group: ['subjectId'],
        include: [
          {
            model: Subject,
            as: 'gradeSubject',
            attributes: ['id', 'name', 'code']
          }
        ],
        raw: false
      });

      // Thống kê phân loại điểm
      const gradeDistribution = await Grade.sequelize.query(`
        SELECT 
          subjectId,
          SUM(CASE WHEN gradeValue >= 9 THEN 1 ELSE 0 END) as excellent,
          SUM(CASE WHEN gradeValue >= 8 AND gradeValue < 9 THEN 1 ELSE 0 END) as good,
          SUM(CASE WHEN gradeValue >= 6.5 AND gradeValue < 8 THEN 1 ELSE 0 END) as fair,
          SUM(CASE WHEN gradeValue >= 5 AND gradeValue < 6.5 THEN 1 ELSE 0 END) as average,
          SUM(CASE WHEN gradeValue < 5 THEN 1 ELSE 0 END) as poor
        FROM Grades 
        WHERE classId = :classId 
          AND isActive = true 
          ${subjectId ? 'AND subjectId = :subjectId' : ''}
          ${term ? 'AND term = :term' : ''}
          ${academicYear ? 'AND academicYear = :academicYear' : ''}
          AND deletedAt IS NULL
        GROUP BY subjectId
      `, {
        replacements: { 
          classId,
          ...(subjectId && { subjectId }),
          ...(term && { term }),
          ...(academicYear && { academicYear })
        },
        type: Sequelize.QueryTypes.SELECT
      });

      res.json({
        success: true,
        data: {
          statistics,
          gradeDistribution
        }
      });

    } catch (error) {
      console.error('Error getting grade statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thống kê điểm',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = gradeController;
