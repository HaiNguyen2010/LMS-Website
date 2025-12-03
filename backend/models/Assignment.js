const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Assignment = sequelize.define('Assignment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Tiêu đề bài tập không được để trống'
      },
      len: {
        args: [1, 200],
        msg: 'Tiêu đề bài tập phải từ 1-200 ký tự'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('essay', 'mcq', 'file_upload'),
    allowNull: false,
    defaultValue: 'essay',
    comment: 'Loại bài tập: essay (tự luận), mcq (trắc nghiệm), file_upload (nộp file)'
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: {
        msg: 'Ngày hết hạn phải là định dạng ngày hợp lệ'
      },
      isAfter: {
        args: new Date().toISOString(),
        msg: 'Ngày hết hạn phải sau thời điểm hiện tại'
      }
    }
  },
  classId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'classes',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'subjects',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  maxGrade: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 10.00,
    validate: {
      min: {
        args: [0.01],
        msg: 'Điểm tối đa phải lớn hơn 0'
      },
      max: {
        args: [100],
        msg: 'Điểm tối đa không được vượt quá 100'
      }
    }
  },
  instructions: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Hướng dẫn làm bài cho học sinh'
  },
  allowedFileTypes: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Các loại file được phép upload (cách nhau bởi dấu phẩy): pdf,doc,docx,jpg,png'
  },
  maxFileSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 10485760, // 10MB in bytes
    comment: 'Kích thước file tối đa (bytes)'
  },
  mcqQuestions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Câu hỏi trắc nghiệm dạng JSON array: [{question, options: [a,b,c,d], correctAnswer: index}]'
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'closed'),
    allowNull: false,
    defaultValue: 'draft',
    comment: 'draft: nháp, published: đã phát hành, closed: đã đóng'
  },
  autoGrade: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Tự động chấm điểm cho bài trắc nghiệm'
  }
}, {
  tableName: 'assignments',
  timestamps: true,
  paranoid: true, // Soft delete
  indexes: [
    {
      fields: ['classId']
    },
    {
      fields: ['subjectId']
    },
    {
      fields: ['createdBy']
    },
    {
      fields: ['dueDate']
    },
    {
      fields: ['status']
    },
    {
      fields: ['type']
    },
    {
      fields: ['classId', 'subjectId']
    }
  ]
});

module.exports = Assignment;