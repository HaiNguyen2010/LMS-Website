const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Submission = sequelize.define('Submission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  assignmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'assignments',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Nội dung bài làm cho bài tự luận'
  },
  mcqAnswers: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Câu trả lời trắc nghiệm dạng JSON array: [0,1,2,3,...] (index của đáp án đã chọn)'
  },
  grade: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: {
        args: [0],
        msg: 'Điểm phải lớn hơn hoặc bằng 0'
      },
      max: {
        args: [100],
        msg: 'Điểm không được vượt quá 100'
      }
    }
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Nhận xét của giáo viên'
  },
  status: {
    type: DataTypes.ENUM('draft', 'submitted', 'graded', 'returned'),
    allowNull: false,
    defaultValue: 'draft',
    comment: 'draft: nháp, submitted: đã nộp, graded: đã chấm, returned: đã trả bài'
  },
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Thời gian nộp bài'
  },
  gradedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Thời gian chấm bài'
  },
  gradedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    comment: 'Giáo viên chấm bài'
  },
  isLate: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Nộp bài có trễ hạn không'
  },
  attemptNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Lần làm bài thứ mấy (nếu cho phép làm lại)'
  }
}, {
  tableName: 'submissions',
  timestamps: true,
  paranoid: true, // Soft delete
  indexes: [
    {
      fields: ['assignmentId']
    },
    {
      fields: ['studentId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['submittedAt']
    },
    {
      fields: ['gradedBy']
    },
    {
      fields: ['assignmentId', 'studentId'],
      unique: true,
      name: 'unique_assignment_student'
    }
  ]
});

module.exports = Submission;