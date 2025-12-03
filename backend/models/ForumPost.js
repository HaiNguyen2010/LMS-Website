const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ForumPost = sequelize.define('ForumPost', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Tiêu đề không được để trống' },
      len: {
        args: [5, 200],
        msg: 'Tiêu đề phải có từ 5-200 ký tự'
      }
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Nội dung không được để trống' },
      len: {
        args: [10, 10000],
        msg: 'Nội dung phải có từ 10-10000 ký tự'
      }
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
  isPinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Bài viết được ghim lên đầu'
  },
  isLocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Bài viết bị khóa, không thể comment'
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Số lượt xem không thể âm' }
    }
  },
  likeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Số lượt thích không thể âm' }
    }
  },
  commentCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Số lượt comment không thể âm' }
    }
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Danh sách tags của bài viết'
  },
  attachments: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Danh sách file đính kèm'
  }
}, {
  tableName: 'forum_posts',
  timestamps: true,
  paranoid: true, // Soft delete
  indexes: [
    {
      fields: ['classId']
    },
    {
      fields: ['authorId']
    },
    {
      fields: ['isPinned', 'createdAt']
    },
    {
      fields: ['classId', 'isPinned', 'createdAt']
    }
  ],
  hooks: {
    // afterCreate: async (post, options) => {
    //   // Tự động tăng post count cho user
    //   const User = require('./User');
    //   await User.increment('postCount', {
    //     where: { id: post.authorId },
    //     transaction: options.transaction
    //   });
    // },
    // afterDestroy: async (post, options) => {
    //   // Giảm post count khi xóa
    //   const User = require('./User');
    //   await User.decrement('postCount', {
    //     where: { id: post.authorId },
    //     transaction: options.transaction
    //   });
    // }
  }
});

// Instance methods
ForumPost.prototype.incrementView = async function() {
  await this.increment('viewCount');
  return this.reload();
};

ForumPost.prototype.incrementLike = async function() {
  await this.increment('likeCount');
  return this.reload();
};

ForumPost.prototype.decrementLike = async function() {
  await this.decrement('likeCount');
  return this.reload();
};

ForumPost.prototype.incrementComment = async function() {
  await this.increment('commentCount');
  return this.reload();
};

ForumPost.prototype.decrementComment = async function() {
  await this.decrement('commentCount');
  return this.reload();
};

// Class methods
ForumPost.getPopularPosts = async function(classId, limit = 10) {
  return await this.findAll({
    where: { classId },
    order: [
      ['isPinned', 'DESC'],
      ['likeCount', 'DESC'],
      ['viewCount', 'DESC'],
      ['createdAt', 'DESC']
    ],
    limit,
    include: [
      {
        model: require('./User'),
        as: 'author',
        attributes: ['id', 'fullName', 'email', 'avatar']
      }
    ]
  });
};

ForumPost.getRecentPosts = async function(classId, limit = 20) {
  return await this.findAll({
    where: { classId },
    order: [
      ['isPinned', 'DESC'],
      ['createdAt', 'DESC']
    ],
    limit,
    include: [
      {
        model: require('./User'),
        as: 'author',
        attributes: ['id', 'fullName', 'email', 'avatar']
      }
    ]
  });
};

module.exports = ForumPost;