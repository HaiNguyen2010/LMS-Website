const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TeacherAssignment = sequelize.define('TeacherAssignment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    validate: {
      notNull: {
        msg: 'teacherId không được để trống'
      },
      isInt: {
        msg: 'teacherId phải là số nguyên'
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
    validate: {
      notNull: {
        msg: 'classId không được để trống'
      },
      isInt: {
        msg: 'classId phải là số nguyên'
      }
    }
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'subjects',
      key: 'id'
    },
    validate: {
      notNull: {
        msg: 'subjectId không được để trống'
      },
      isInt: {
        msg: 'subjectId phải là số nguyên'
      }
    }
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
    validate: {
      isAfterStartDate(value) {
        if (value && this.startDate && value <= this.startDate) {
          throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
        }
      }
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'teacher_assignments',
  timestamps: true,
  paranoid: true,
  indexes: [
    {
      unique: true,
      fields: ['teacherId', 'classId', 'subjectId'], // Một giáo viên chỉ có thể dạy một môn cho một lớp
      name: 'unique_teacher_class_subject'
    },
    {
      fields: ['teacherId']
    },
    {
      fields: ['classId']
    },
    {
      fields: ['subjectId']
    }
  ]
});

module.exports = TeacherAssignment;