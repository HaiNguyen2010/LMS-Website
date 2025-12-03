const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChatMessage = sequelize.define('ChatMessage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  classId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Classes',
      key: 'id'
    },
    validate: {
      notNull: { msg: 'ID lớp học không được để trống' }
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Nội dung tin nhắn không được để trống' },
      len: {
        args: [1, 2000],
        msg: 'Tin nhắn phải có từ 1-2000 ký tự'
      }
    }
  },
  messageType: {
    type: DataTypes.ENUM('text', 'image', 'file', 'voice', 'system'),
    allowNull: false,
    defaultValue: 'text',
    validate: {
      isIn: {
        args: [['text', 'image', 'file', 'voice', 'system']],
        msg: 'Loại tin nhắn không hợp lệ'
      }
    }
  },
  replyToId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'chat_messages',
      key: 'id'
    },
    comment: 'ID tin nhắn được reply'
  },
  attachments: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Danh sách file đính kèm'
  },
  isEdited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Tin nhắn đã được chỉnh sửa'
  },
  editedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Thời gian chỉnh sửa lần cuối'
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Tin nhắn đã bị xóa'
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Thời gian xóa tin nhắn'
  },
  readBy: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Danh sách user đã đọc tin nhắn này [{userId, readAt}]'
  },
  reactions: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Reactions của tin nhắn {emoji: [userId1, userId2]}'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Dữ liệu bổ sung (file size, duration, etc.)'
  }
}, {
  tableName: 'chat_messages',
  timestamps: true,
  paranoid: false, // Sử dụng soft delete custom
  indexes: [
    {
      fields: ['classId']
    },
    {
      fields: ['senderId']
    },
    {
      fields: ['replyToId']
    },
    {
      fields: ['classId', 'createdAt']
    },
    {
      fields: ['classId', 'isDeleted', 'createdAt']
    }
  ],
  hooks: {
    beforeUpdate: (message, options) => {
      // Đánh dấu đã chỉnh sửa khi update message
      if (options.fields.includes('message')) {
        message.isEdited = true;
        message.editedAt = new Date();
      }
    }
  }
});

// Instance methods
ChatMessage.prototype.markAsRead = async function(userId) {
  const readBy = this.readBy || [];
  const existingRead = readBy.find(r => r.userId === userId);
  
  if (!existingRead) {
    readBy.push({
      userId: userId,
      readAt: new Date()
    });
    
    this.readBy = readBy;
    await this.save();
  }
  
  return this;
};

ChatMessage.prototype.addReaction = async function(userId, emoji) {
  const reactions = this.reactions || {};
  
  if (!reactions[emoji]) {
    reactions[emoji] = [];
  }
  
  if (!reactions[emoji].includes(userId)) {
    reactions[emoji].push(userId);
    this.reactions = reactions;
    await this.save();
  }
  
  return this;
};

ChatMessage.prototype.removeReaction = async function(userId, emoji) {
  const reactions = this.reactions || {};
  
  if (reactions[emoji]) {
    reactions[emoji] = reactions[emoji].filter(id => id !== userId);
    
    if (reactions[emoji].length === 0) {
      delete reactions[emoji];
    }
    
    this.reactions = reactions;
    await this.save();
  }
  
  return this;
};

ChatMessage.prototype.softDelete = async function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.message = 'Tin nhắn đã bị xóa';
  this.attachments = [];
  await this.save();
  return this;
};

// Class methods
ChatMessage.getClassMessages = async function(classId, page = 1, limit = 50) {
  const offset = (page - 1) * limit;
  
  return await this.findAndCountAll({
    where: { 
      classId,
      isDeleted: false
    },
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    include: [
      {
        model: require('./User'),
        as: 'sender',
        attributes: ['id', 'fullName', 'email', 'avatar', 'role']
      },
      {
        model: ChatMessage,
        as: 'replyTo',
        attributes: ['id', 'message', 'senderId', 'messageType'],
        include: [{
          model: require('./User'),
          as: 'sender',
          attributes: ['id', 'fullName']
        }]
      }
    ]
  });
};

ChatMessage.getUnreadCount = async function(classId, userId, lastReadAt) {
  return await this.count({
    where: {
      classId,
      isDeleted: false,
      senderId: { [sequelize.Op.ne]: userId },
      createdAt: { [sequelize.Op.gt]: lastReadAt }
    }
  });
};

ChatMessage.searchMessages = async function(classId, query, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  
  return await this.findAndCountAll({
    where: {
      classId,
      isDeleted: false,
      message: { [sequelize.Op.like]: `%${query}%` }
    },
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    include: [{
      model: require('./User'),
      as: 'sender',
      attributes: ['id', 'fullName', 'avatar']
    }]
  });
};

ChatMessage.getMessagesByType = async function(classId, messageType, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  
  return await this.findAndCountAll({
    where: {
      classId,
      messageType,
      isDeleted: false
    },
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    include: [{
      model: require('./User'),
      as: 'sender',
      attributes: ['id', 'fullName', 'avatar']
    }]
  });
};

module.exports = ChatMessage;