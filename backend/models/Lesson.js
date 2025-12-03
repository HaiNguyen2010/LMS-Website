const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Lesson = sequelize.define('Lesson', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  classId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'class_id',
    validate: {
      notNull: {
        msg: 'ID lớp học là bắt buộc'
      },
      isInt: {
        msg: 'ID lớp học phải là số nguyên'
      }
    }
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'subject_id',
    validate: {
      notNull: {
        msg: 'ID môn học là bắt buộc'
      },
      isInt: {
        msg: 'ID môn học phải là số nguyên'
      }
    }
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Tiêu đề bài giảng không được để trống'
      },
      len: {
        args: [1, 200],
        msg: 'Tiêu đề bài giảng phải từ 1-200 ký tự'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 2000],
        msg: 'Mô tả không được quá 2000 ký tự'
      }
    }
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'created_by',
    validate: {
      notNull: {
        msg: 'Người tạo là bắt buộc'
      },
      isInt: {
        msg: 'ID người tạo phải là số nguyên'
      }
    }
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    defaultValue: 'published',
    validate: {
      isIn: {
        args: [['draft', 'published', 'archived']],
        msg: 'Trạng thái không hợp lệ'
      }
    }
  }
}, {
  tableName: 'lessons',
  timestamps: true,
  paranoid: true, // Soft delete
  indexes: [
    {
      fields: ['class_id'],
      name: 'lessons_class_id_index'
    },
    {
      fields: ['subject_id'],
      name: 'lessons_subject_id_index'
    },
    {
      fields: ['created_by'],
      name: 'lessons_created_by_index'
    },
    {
      fields: ['class_id', 'subject_id'],
      name: 'lessons_class_subject_index'
    },
    {
      fields: ['status'],
      name: 'lessons_status_index'
    }
  ]
});

module.exports = Lesson;