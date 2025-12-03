const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ForumComment = sequelize.define('ForumComment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'forum_posts',
      key: 'id'
    },
    validate: {
      notNull: { msg: 'ID bài viết không được để trống' }
    }
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    validate: {
      notNull: { msg: 'ID tác giả không được để trống' }
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Nội dung comment không được để trống' },
      len: {
        args: [1, 2000],
        msg: 'Nội dung comment phải có từ 1-2000 ký tự'
      }
    }
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'forum_comments',
      key: 'id'
    },
    comment: 'ID comment cha (để reply)'
  },
  likeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Số lượt thích không thể âm' }
    }
  },
  replyCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Số lượt reply không thể âm' }
    }
  },
  attachments: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Danh sách file đính kèm'
  },
  isEdited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Comment đã được chỉnh sửa'
  },
  editedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Thời gian chỉnh sửa lần cuối'
  }
}, {
  tableName: 'forum_comments',
  timestamps: true,
  paranoid: true, // Soft delete
  indexes: [
    {
      fields: ['postId']
    },
    {
      fields: ['authorId']
    },
    {
      fields: ['parentId']
    },
    {
      fields: ['postId', 'createdAt']
    },
    {
      fields: ['postId', 'parentId', 'createdAt']
    }
  ],
  hooks: {
    afterCreate: async (comment, options) => {
      // Tự động tăng comment count cho post và user
      const ForumPost = require('./ForumPost');
      // const User = require('./User');
      
      const transaction = options.transaction;
      
      // Tăng comment count cho post
      await ForumPost.increment('commentCount', {
        where: { id: comment.postId },
        transaction
      });
      
      // Tăng comment count cho user
      // await User.increment('commentCount', {
      //   where: { id: comment.authorId },
      //   transaction
      // });
      
      // Nếu là reply, tăng reply count cho comment cha
      if (comment.parentId) {
        await ForumComment.increment('replyCount', {
          where: { id: comment.parentId },
          transaction
        });
      }
    },
    afterDestroy: async (comment, options) => {
      // Giảm các count khi xóa
      const ForumPost = require('./ForumPost');
      // const User = require('./User');
      
      const transaction = options.transaction;
      
      await ForumPost.decrement('commentCount', {
        where: { id: comment.postId },
        transaction
      });
      
      // await User.decrement('commentCount', {
      //   where: { id: comment.authorId },
      //   transaction
      // });
      
      if (comment.parentId) {
        await ForumComment.decrement('replyCount', {
          where: { id: comment.parentId },
          transaction
        });
      }
    },
    beforeUpdate: (comment, options) => {
      // Đánh dấu đã chỉnh sửa
      if (options.fields.includes('content')) {
        comment.isEdited = true;
        comment.editedAt = new Date();
      }
    }
  }
});

// Instance methods
ForumComment.prototype.incrementLike = async function() {
  await this.increment('likeCount');
  return this.reload();
};

ForumComment.prototype.decrementLike = async function() {
  await this.decrement('likeCount');
  return this.reload();
};

// Class methods
ForumComment.getCommentsByPost = async function(postId, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  
  return await this.findAndCountAll({
    where: { 
      postId,
      parentId: null // Chỉ lấy comment gốc
    },
    order: [['createdAt', 'ASC']],
    limit,
    offset,
    include: [
      {
        model: require('./User'),
        as: 'author',
        attributes: ['id', 'name', 'email', 'code', 'role']
      },
      {
        model: ForumComment,
        as: 'replies',
        limit: 5, // Chỉ lấy 5 reply đầu tiên
        order: [['createdAt', 'ASC']],
        include: [{
          model: require('./User'),
          as: 'author',
          attributes: ['id', 'name', 'email', 'code', 'role']
        }]
      }
    ]
  });
};

ForumComment.getRepliesByComment = async function(parentId, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  
  return await this.findAndCountAll({
    where: { parentId },
    order: [['createdAt', 'ASC']],
    limit,
    offset,
    include: [{
      model: require('./User'),
      as: 'author',
      attributes: ['id', 'name', 'email', 'code', 'role']
    }]
  });
};

module.exports = ForumComment;