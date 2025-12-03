const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Tiêu đề thông báo không được để trống' },
      len: {
        args: [1, 200],
        msg: 'Tiêu đề phải có từ 1-200 ký tự'
      }
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Nội dung thông báo không được để trống' },
      len: {
        args: [1, 5000],
        msg: 'Nội dung phải có từ 1-5000 ký tự'
      }
    }
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    validate: {
      notNull: { msg: 'ID người gửi không được để trống' }
    }
  },
  receiverRole: {
    type: DataTypes.ENUM('student', 'teacher', 'admin', 'all'),
    allowNull: false,
    validate: {
      notNull: { msg: 'Vai trò người nhận không được để trống' },
      isIn: {
        args: [['student', 'teacher', 'admin', 'all']],
        msg: 'Vai trò người nhận không hợp lệ'
      }
    }
  },
  classId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Classes',
      key: 'id'
    },
    comment: 'ID lớp học (null nếu gửi toàn trường)'
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Subjects',
      key: 'id'
    },
    comment: 'ID môn học (null nếu không liên quan môn học)'
  },
  type: {
    type: DataTypes.ENUM('announcement', 'assignment', 'grade', 'forum', 'system', 'reminder'),
    allowNull: false,
    defaultValue: 'announcement',
    validate: {
      isIn: {
        args: [['announcement', 'assignment', 'grade', 'forum', 'system', 'reminder']],
        msg: 'Loại thông báo không hợp lệ'
      }
    }
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium',
    validate: {
      isIn: {
        args: [['low', 'medium', 'high', 'urgent']],
        msg: 'Mức độ ưu tiên không hợp lệ'
      }
    }
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Trạng thái đã đọc (cho thông báo cá nhân)'
  },
  readCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Số lượt đọc không thể âm' }
    }
  },
  targetCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Số người nhận không thể âm' }
    },
    comment: 'Tổng số người cần nhận thông báo này'
  },
  scheduledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Thời gian lên lịch gửi thông báo'
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Thời gian đã gửi thông báo'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Thời gian hết hạn thông báo'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Dữ liệu bổ sung (link, attachment, etc.)'
  },
  attachments: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Danh sách file đính kèm'
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  paranoid: false, // Không cần soft delete cho notification
  indexes: [
    {
      fields: ['senderId']
    },
    {
      fields: ['receiverRole']
    },
    {
      fields: ['classId']
    },
    {
      fields: ['type']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['scheduledAt']
    },
    {
      fields: ['sentAt']
    },
    {
      fields: ['expiresAt']
    },
    {
      fields: ['receiverRole', 'classId', 'sentAt']
    }
  ],
  hooks: {
    beforeCreate: async (notification, options) => {
      // Tự động set sentAt nếu không có scheduledAt
      if (!notification.scheduledAt) {
        notification.sentAt = new Date();
      }
      
      // Tính toán targetCount dựa trên receiverRole và classId
      if (!notification.targetCount) {
        const User = require('./User');
        const ClassStudent = require('./ClassStudent');
        const TeacherAssignment = require('./TeacherAssignment');
        
        let count = 0;
        
        if (notification.receiverRole === 'all') {
          count = await User.count();
        } else if (notification.receiverRole === 'admin') {
          count = await User.count({ where: { role: 'admin' } });
        } else if (notification.classId) {
          if (notification.receiverRole === 'student') {
            count = await ClassStudent.count({ where: { classId: notification.classId } });
          } else if (notification.receiverRole === 'teacher') {
            count = await TeacherAssignment.count({ where: { classId: notification.classId } });
          }
        } else {
          count = await User.count({ where: { role: notification.receiverRole } });
        }
        
        notification.targetCount = count;
      }
    }
  }
});

// Instance methods
Notification.prototype.markAsRead = async function() {
  this.isRead = true;
  await this.increment('readCount');
  return this.save();
};

Notification.prototype.getReadPercentage = function() {
  if (this.targetCount === 0) return 0;
  return Math.round((this.readCount / this.targetCount) * 100);
};

// Class methods
Notification.getByRole = async function(role, classId = null, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const whereClause = {
    [sequelize.Op.or]: [
      { receiverRole: role },
      { receiverRole: 'all' }
    ],
    [sequelize.Op.or]: [
      { expiresAt: null },
      { expiresAt: { [sequelize.Op.gt]: new Date() } }
    ],
    sentAt: { [sequelize.Op.not]: null }
  };
  
  if (classId) {
    whereClause[sequelize.Op.or] = [
      { classId: classId },
      { classId: null }
    ];
  }
  
  return await this.findAndCountAll({
    where: whereClause,
    order: [
      ['priority', 'DESC'],
      ['sentAt', 'DESC']
    ],
    limit,
    offset,
    include: [{
      model: require('./User'),
      as: 'sender',
      attributes: ['id', 'name', 'email', 'code']
    }]
  });
};

Notification.getUnreadCount = async function(role, classId = null) {
  const whereClause = {
    [sequelize.Op.or]: [
      { receiverRole: role },
      { receiverRole: 'all' }
    ],
    [sequelize.Op.or]: [
      { expiresAt: null },
      { expiresAt: { [sequelize.Op.gt]: new Date() } }
    ],
    sentAt: { [sequelize.Op.not]: null },
    isRead: false
  };
  
  if (classId) {
    whereClause[sequelize.Op.or] = [
      { classId: classId },
      { classId: null }
    ];
  }
  
  return await this.count({ where: whereClause });
};

Notification.getScheduledNotifications = async function() {
  return await this.findAll({
    where: {
      scheduledAt: { [sequelize.Op.lte]: new Date() },
      sentAt: null
    },
    order: [['scheduledAt', 'ASC']]
  });
};

module.exports = Notification;