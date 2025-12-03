const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');

const User = sequelize.define('User', {
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
        msg: 'Tên không được để trống'
      },
      len: {
        args: [2, 100],
        msg: 'Tên phải có từ 2-100 ký tự'
      }
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: {
      msg: 'Email đã tồn tại trong hệ thống'
    },
    validate: {
      isEmail: {
        msg: 'Email không hợp lệ'
      },
      notEmpty: {
        msg: 'Email không được để trống'
      }
    }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Mật khẩu không được để trống'
      }
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'teacher', 'student'),
    allowNull: false,
    defaultValue: 'student',
    validate: {
      isIn: {
        args: [['admin', 'teacher', 'student']],
        msg: 'Vai trò phải là admin, teacher hoặc student'
      }
    }
  },
  phoneNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: {
        args: /^[0-9+\-\s()]*$/,
        msg: 'Số điện thoại không hợp lệ'
      }
    }
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: {
      msg: 'Mã số đã tồn tại trong hệ thống'
    },
    comment: 'Mã số sinh viên hoặc mã số giáo viên'
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Trạng thái kích hoạt tài khoản, mặc định là false, admin có thể thay đổi'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    // Hash password trước khi lưu
    beforeCreate: async (user) => {
      if (user.password_hash) {
        const saltRounds = 12;
        user.password_hash = await bcrypt.hash(user.password_hash, saltRounds);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash')) {
        const saltRounds = 12;
        user.password_hash = await bcrypt.hash(user.password_hash, saltRounds);
      }
    }
  }
});

// Instance methods
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password_hash);
};

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password_hash; // Không trả về password hash
  return values;
};

// Class methods
User.findByEmail = function(email) {
  return this.findOne({
    where: { email }
  });
};

User.createWithHashedPassword = async function(userData) {
  const { password, ...otherData } = userData;
  return await this.create({
    ...otherData,
    password_hash: password
  });
};

module.exports = User;