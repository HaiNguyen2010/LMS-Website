const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ForumLike = sequelize.define('ForumLike', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    validate: {
      notNull: { msg: 'ID người dùng không được để trống' }
    }
  },
  targetType: {
    type: DataTypes.ENUM('post', 'comment'),
    allowNull: false,
    validate: {
      isIn: {
        args: [['post', 'comment']],
        msg: 'Loại đối tượng like không hợp lệ'
      }
    }
  },
  targetId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: { msg: 'ID đối tượng like không được để trống' }
    }
  },
  likeType: {
    type: DataTypes.ENUM('like', 'love', 'laugh', 'wow', 'sad', 'angry'),
    allowNull: false,
    defaultValue: 'like',
    validate: {
      isIn: {
        args: [['like', 'love', 'laugh', 'wow', 'sad', 'angry']],
        msg: 'Loại reaction không hợp lệ'
      }
    }
  }
}, {
  tableName: 'forum_likes',
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['targetType', 'targetId']
    },
    {
      fields: ['userId', 'targetType', 'targetId'],
      unique: true // Một user chỉ like một lần cho mỗi đối tượng
    }
  ],
  hooks: {
    afterCreate: async (like, options) => {
      // Tự động tăng like count
      if (like.targetType === 'post') {
        const ForumPost = require('./ForumPost');
        await ForumPost.increment('likeCount', {
          where: { id: like.targetId },
          transaction: options.transaction
        });
      } else if (like.targetType === 'comment') {
        const ForumComment = require('./ForumComment');
        await ForumComment.increment('likeCount', {
          where: { id: like.targetId },
          transaction: options.transaction
        });
      }
    },
    afterDestroy: async (like, options) => {
      // Tự động giảm like count
      if (like.targetType === 'post') {
        const ForumPost = require('./ForumPost');
        await ForumPost.decrement('likeCount', {
          where: { id: like.targetId },
          transaction: options.transaction
        });
      } else if (like.targetType === 'comment') {
        const ForumComment = require('./ForumComment');
        await ForumComment.decrement('likeCount', {
          where: { id: like.targetId },
          transaction: options.transaction
        });
      }
    }
  }
});

// Class methods
ForumLike.getLikesByTarget = async function(targetType, targetId) {
  return await this.findAll({
    where: { targetType, targetId },
    include: [{
      model: require('./User'),
      as: 'user',
      attributes: ['id', 'fullName', 'avatar']
    }],
    order: [['createdAt', 'DESC']]
  });
};

ForumLike.getLikeStats = async function(targetType, targetId) {
  const likes = await this.findAll({
    where: { targetType, targetId },
    attributes: ['likeType', [sequelize.fn('COUNT', '*'), 'count']],
    group: ['likeType'],
    raw: true
  });
  
  const stats = {};
  likes.forEach(like => {
    stats[like.likeType] = parseInt(like.count);
  });
  
  return stats;
};

ForumLike.toggleLike = async function(userId, targetType, targetId, likeType = 'like') {
  const existingLike = await this.findOne({
    where: { userId, targetType, targetId }
  });
  
  if (existingLike) {
    if (existingLike.likeType === likeType) {
      // Unlike nếu cùng loại
      await existingLike.destroy();
      return { action: 'unliked', like: null };
    } else {
      // Update loại like
      existingLike.likeType = likeType;
      await existingLike.save();
      return { action: 'updated', like: existingLike };
    }
  } else {
    // Tạo like mới
    const newLike = await this.create({
      userId,
      targetType,
      targetId,
      likeType
    });
    return { action: 'liked', like: newLike };
  }
};

module.exports = ForumLike;