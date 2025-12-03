const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Class = sequelize.define('Class', {
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
        msg: 'Tên lớp không được để trống'
      },
      len: {
        args: [1, 100],
        msg: 'Tên lớp phải từ 1-100 ký tự'
      }
    }
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'Mã lớp không được để trống'
      },
      len: {
        args: [1, 20],
        msg: 'Mã lớp phải từ 1-20 ký tự'
      }
    }
  },
  maxStudents: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      isInt: {
        msg: 'Sĩ số tối đa phải là số nguyên'
      },
      min: {
        args: [1],
        msg: 'Sĩ số tối đa phải lớn hơn 0'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'classes',
  timestamps: true,
  paranoid: true, // Soft delete
  indexes: [
    {
      unique: true,
      fields: ['code']
    }
  ]
});

module.exports = Class;