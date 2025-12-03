const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ClassStudent = sequelize.define('ClassStudent', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    validate: {
      notNull: {
        msg: 'studentId không được để trống'
      },
      isInt: {
        msg: 'studentId phải là số nguyên'
      }
    }
  },
  enrolledAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'transferred'),
    defaultValue: 'active',
    validate: {
      isIn: {
        args: [['active', 'inactive', 'transferred']],
        msg: 'Trạng thái phải là active, inactive hoặc transferred'
      }
    }
  }
}, {
  tableName: 'class_students',
  timestamps: true,
  paranoid: true,
  indexes: [
    {
      unique: true,
      fields: ['classId', 'studentId'], // Một học sinh chỉ có thể trong một lớp tại một thời điểm
      name: 'unique_class_student'
    },
    {
      fields: ['classId']
    },
    {
      fields: ['studentId']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = ClassStudent;