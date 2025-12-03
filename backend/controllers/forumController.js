const { 
  ForumPost, 
  ForumComment, 
  ForumLike, 
  User, 
  Class, 
  sequelize 
} = require('../models');
const { validationResult } = require('express-validator');

const forumController = {
  // ========== FORUM POSTS ==========
  
  // Lấy tất cả posts (Admin only)
  async getAllPosts(req, res) {
    try {
      console.log('getAllPosts called by user:', req.user);
      const { page = 1, limit = 20, sort = 'recent', authorId } = req.query;
      const offset = (page - 1) * limit;
      
      // Tất cả người dùng đã đăng nhập đều có thể xem posts
      if (!req.user) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền truy cập'
        });
      }

      let orderClause;
      switch (sort) {
        case 'popular':
          orderClause = [['isPinned', 'DESC'], ['likeCount', 'DESC'], ['viewCount', 'DESC']];
          break;
        case 'discussed':
          orderClause = [['isPinned', 'DESC'], ['commentCount', 'DESC'], ['createdAt', 'DESC']];
          break;
        default: // recent
          orderClause = [['isPinned', 'DESC'], ['createdAt', 'DESC']];
      }

      // Build where clause
      const whereClause = {};
      if (authorId) {
        whereClause.authorId = parseInt(authorId);
      }

      const { count, rows: posts } = await ForumPost.findAndCountAll({
        where: whereClause,
        order: orderClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'email', 'role']
          },
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          }
        ]
      });

      // Check if user has liked each post
      const postsWithLikeStatus = await Promise.all(
        posts.map(async (post) => {
          const userLike = await ForumLike.findOne({
            where: {
              userId: req.user.id,
              targetType: 'post',
              targetId: post.id
            }
          });
          
          return {
            ...post.toJSON(),
            isLikedByUser: !!userLike
          };
        })
      );

      res.json({
        success: true,
        data: {
          posts: postsWithLikeStatus,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error getting all posts:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách bài viết'
      });
    }
  },
  
  // Lấy danh sách posts theo lớp
  async getPostsByClass(req, res) {
    try {
      const { classId } = req.params;
      const { page = 1, limit = 20, sort = 'recent' } = req.query;
      const offset = (page - 1) * limit;
      
      // Kiểm tra quyền truy cập lớp
      const hasAccess = await checkClassAccess(req.user.id, classId, req.user.role);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền truy cập lớp học này'
        });
      }

      let orderClause;
      switch (sort) {
        case 'popular':
          orderClause = [['isPinned', 'DESC'], ['likeCount', 'DESC'], ['viewCount', 'DESC']];
          break;
        case 'discussed':
          orderClause = [['isPinned', 'DESC'], ['commentCount', 'DESC'], ['createdAt', 'DESC']];
          break;
        default: // recent
          orderClause = [['isPinned', 'DESC'], ['createdAt', 'DESC']];
      }

      const { count, rows: posts } = await ForumPost.findAndCountAll({
        where: { classId },
        order: orderClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'email', 'role']
          },
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          }
        ]
      });

      res.json({
        success: true,
        data: {
          posts,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error getting posts by class:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách bài viết'
      });
    }
  },

  // Tạo post mới
  async createPost(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: errors.array()
        });
      }

      const { title, content, classId, tags, attachments } = req.body;
      
      console.log('Creating post:', { 
        userId: req.user.id, 
        userRole: req.user.role,
        classId, 
        title 
      });
      
      // Kiểm tra quyền tạo post trong lớp
      const hasAccess = await checkClassAccess(req.user.id, classId, req.user.role);
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền tạo bài viết trong lớp này'
        });
      }

      const post = await ForumPost.create({
        title,
        content,
        authorId: req.user.id,
        classId,
        tags: tags || [],
        attachments: attachments || []
      });

      const postWithDetails = await ForumPost.findByPk(post.id, {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'email', 'role']
          },
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Tạo bài viết thành công',
        data: postWithDetails
      });

    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo bài viết'
      });
    }
  },

  // Lấy chi tiết post
  async getPostById(req, res) {
    try {
      const { id } = req.params;
      
      const post = await ForumPost.findByPk(id, {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'email', 'role']
          },
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          }
        ]
      });

      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bài viết'
        });
      }

      // Tăng view count
      await post.incrementView();

      res.json({
        success: true,
        data: post
      });

    } catch (error) {
      console.error('Error getting post by id:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy bài viết'
      });
    }
  },

  // Cập nhật post
  async updatePost(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { title, content, tags, attachments, isPinned, isLocked } = req.body;

      const post = await ForumPost.findByPk(id);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bài viết'
        });
      }

      // Kiểm tra quyền sửa
      const canEdit = await checkPostEditPermission(req.user.id, post, req.user.role);
      if (!canEdit) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền sửa bài viết này'
        });
      }

      const updateData = { title, content, tags, attachments };
      
      // Chỉ admin/teacher có thể pin/lock
      if (req.user.role === 'admin' || req.user.role === 'teacher') {
        if (isPinned !== undefined) updateData.isPinned = isPinned;
        if (isLocked !== undefined) updateData.isLocked = isLocked;
      }

      await post.update(updateData);

      const updatedPost = await ForumPost.findByPk(id, {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'email', 'role']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Cập nhật bài viết thành công',
        data: updatedPost
      });

    } catch (error) {
      console.error('Error updating post:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật bài viết'
      });
    }
  },

  // Xóa post
  async deletePost(req, res) {
    try {
      const { id } = req.params;

      const post = await ForumPost.findByPk(id);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bài viết'
        });
      }

      // Kiểm tra quyền xóa
      const canDelete = await checkPostDeletePermission(req.user.id, post, req.user.role);
      if (!canDelete) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền xóa bài viết này'
        });
      }

      await post.destroy();

      res.json({
        success: true,
        message: 'Xóa bài viết thành công'
      });

    } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa bài viết'
      });
    }
  },

  // ========== FORUM COMMENTS ==========

  // Lấy comments của post
  async getCommentsByPost(req, res) {
    try {
      const { postId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const post = await ForumPost.findByPk(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bài viết'
        });
      }

      const result = await ForumComment.getCommentsByPost(
        postId, 
        parseInt(page), 
        parseInt(limit)
      );

      res.json({
        success: true,
        data: {
          comments: result.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(result.count / limit),
            totalItems: result.count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error getting comments:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy bình luận'
      });
    }
  },

  // Tạo comment
  async createComment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: errors.array()
        });
      }

      const { postId, content, parentId, attachments } = req.body;

      const post = await ForumPost.findByPk(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bài viết'
        });
      }

      if (post.isLocked) {
        return res.status(403).json({
          success: false,
          message: 'Bài viết này đã bị khóa, không thể bình luận'
        });
      }

      const comment = await ForumComment.create({
        postId,
        authorId: req.user.id,
        content,
        parentId: parentId || null,
        attachments: attachments || []
      });

      const commentWithDetails = await ForumComment.findByPk(comment.id, {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'email', 'role']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Tạo bình luận thành công',
        data: commentWithDetails
      });

    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo bình luận'
      });
    }
  },

  // Cập nhật comment
  async updateComment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { content, attachments } = req.body;

      const comment = await ForumComment.findByPk(id);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bình luận'
        });
      }

      // Kiểm tra quyền sửa
      const canEdit = comment.authorId === req.user.id || 
                      req.user.role === 'admin' || 
                      req.user.role === 'teacher';
      
      if (!canEdit) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền sửa bình luận này'
        });
      }

      await comment.update({
        content,
        attachments: attachments || comment.attachments
      });

      const updatedComment = await ForumComment.findByPk(id, {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'email', 'role']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Cập nhật bình luận thành công',
        data: updatedComment
      });

    } catch (error) {
      console.error('Error updating comment:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật bình luận'
      });
    }
  },

  // Xóa comment
  async deleteComment(req, res) {
    try {
      const { id } = req.params;

      const comment = await ForumComment.findByPk(id);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bình luận'
        });
      }

      // Kiểm tra quyền xóa
      const canDelete = comment.authorId === req.user.id || 
                        req.user.role === 'admin' || 
                        req.user.role === 'teacher';
      
      if (!canDelete) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền xóa bình luận này'
        });
      }

      await comment.destroy();

      res.json({
        success: true,
        message: 'Xóa bình luận thành công'
      });

    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa bình luận'
      });
    }
  },

  // ========== LIKES ==========

  // Toggle like/unlike
  async toggleLike(req, res) {
    try {
      const { targetType, targetId, likeType = 'like' } = req.body;

      if (!['post', 'comment'].includes(targetType)) {
        return res.status(400).json({
          success: false,
          message: 'Loại đối tượng không hợp lệ'
        });
      }

      // Kiểm tra đối tượng tồn tại
      let target;
      if (targetType === 'post') {
        target = await ForumPost.findByPk(targetId);
      } else {
        target = await ForumComment.findByPk(targetId, {
          include: [{ model: ForumPost, as: 'post' }]
        });
      }

      if (!target) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy ${targetType === 'post' ? 'bài viết' : 'bình luận'}`
        });
      }

      // Không cần kiểm tra quyền truy cập cho like
      // User đã có thể xem posts thì có thể like
      // Admin và teacher có thể like mọi post
      // Student có thể like post nếu họ có thể xem được

      const result = await ForumLike.toggleLike(req.user.id, targetType, targetId, likeType);

      res.json({
        success: true,
        message: result.action === 'liked' ? 'Đã thích' : 
                result.action === 'updated' ? 'Đã cập nhật reaction' : 'Đã bỏ thích',
        data: {
          action: result.action,
          like: result.like
        }
      });

    } catch (error) {
      console.error('Error toggling like:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xử lý like'
      });
    }
  },

  // Lấy danh sách likes
  async getLikes(req, res) {
    try {
      const { targetType, targetId } = req.params;

      const likes = await ForumLike.getLikesByTarget(targetType, targetId);
      const stats = await ForumLike.getLikeStats(targetType, targetId);

      res.json({
        success: true,
        data: {
          likes,
          stats,
          total: likes.length
        }
      });

    } catch (error) {
      console.error('Error getting likes:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách likes'
      });
    }
  }
};

// ========== HELPER FUNCTIONS ==========

// Kiểm tra quyền truy cập lớp học
async function checkClassAccess(userId, classId, userRole) {
  if (userRole === 'admin') return true;
  
  if (userRole === 'teacher') {
    const { TeacherAssignment } = require('../models');
    const assignment = await TeacherAssignment.findOne({
      where: { teacherId: userId, classId }
    });
    return !!assignment;
  }
  
  if (userRole === 'student') {
    const { ClassStudent } = require('../models');
    const enrollment = await ClassStudent.findOne({
      where: { studentId: userId, classId }
    });
    return !!enrollment;
  }
  
  return false;
}

// Kiểm tra quyền sửa post
async function checkPostEditPermission(userId, post, userRole) {
  console.log('Check edit permission:', {
    userId,
    userIdType: typeof userId,
    postAuthorId: post.authorId,
    postAuthorIdType: typeof post.authorId,
    userRole,
    postClassId: post.classId
  });
  
  if (userRole === 'admin') return true;
  
  // Ensure both are numbers for comparison
  if (Number(post.authorId) === Number(userId)) return true;
  
  if (userRole === 'teacher') {
    const { TeacherAssignment } = require('../models');
    const assignment = await TeacherAssignment.findOne({
      where: { teacherId: userId, classId: post.classId }
    });
    return !!assignment;
  }
  
  return false;
}

// Kiểm tra quyền xóa post
async function checkPostDeletePermission(userId, post, userRole) {
  if (userRole === 'admin') return true;
  
  // Ensure both are numbers for comparison
  if (Number(post.authorId) === Number(userId)) return true;
  
  if (userRole === 'teacher') {
    const { TeacherAssignment } = require('../models');
    const assignment = await TeacherAssignment.findOne({
      where: { teacherId: userId, classId: post.classId }
    });
    return !!assignment;
  }
  
  return false;
}

module.exports = forumController;
