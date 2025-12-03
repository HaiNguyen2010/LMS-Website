const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Subject = sequelize.define('Subject', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Tên môn học không được để trống'
      },
      len: {
        args: [1, 100],
        msg: 'Tên môn học phải từ 1-100 ký tự'
      }
    }
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true,
    validate: {
      len: {
        args: [0, 20],
        msg: 'Mã môn học không được quá 20 ký tự'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  credits: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      isInt: {
        msg: 'Số tín chỉ phải là số nguyên'
      },
      min: {
        args: [1],
        msg: 'Số tín chỉ phải lớn hơn 0'
      },
      max: {
        args: [10],
        msg: 'Số tín chỉ không được lớn hơn 10'
      }
    }
  }
}, {
  tableName: 'subjects',
  timestamps: true,
  paranoid: true // Soft delete
  // Removed duplicate indexes - unique constraints already defined in field definitions
});

module.exports = Subject;