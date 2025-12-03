const { Notification, User, Class, Subject, sequelize } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

const notificationController = {
  // Tạo thông báo mới
  async createNotification(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: errors.array()
        });
      }

      const {
        title,
        message,
        receiverRole,
        classId,
        subjectId,
        type,
        priority,
        scheduledAt,
        expiresAt,
        metadata,
        attachments
      } = req.body;

      // Chỉ admin và teacher có thể tạo thông báo
      if (!['admin', 'teacher'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền tạo thông báo'
        });
      }

      // Nếu là teacher thì chỉ có thể gửi cho lớp/môn mình dạy
      if (req.user.role === 'teacher' && classId) {
        const hasPermission = await checkTeacherClassPermission(req.user.id, classId);
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: 'Không có quyền gửi thông báo cho lớp này'
          });
        }
      }

      const notification = await Notification.create({
        title,
        message,
        senderId: req.user.id,
        receiverRole,
        classId: classId || null,
        subjectId: subjectId || null,
        type: type || 'announcement',
        priority: priority || 'medium',
        scheduledAt: scheduledAt || null,
        expiresAt: expiresAt || null,
        metadata: metadata || {},
        attachments: attachments || []
      });

      const notificationWithDetails = await Notification.findByPk(notification.id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'name', 'email', 'code', 'role']
          },
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Subject,
            as: 'subject',
            attributes: ['id', 'name', 'code']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Tạo thông báo thành công',
        data: notificationWithDetails
      });

    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo thông báo'
      });
    }
  },

  // Lấy danh sách thông báo cho user hiện tại
  async getMyNotifications(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
      const offset = (page - 1) * limit;

      const { type, priority, unreadOnly } = req.query;

      // Build where clause carefully to avoid key overwrites
      let whereClause = {
        sentAt: { [Op.not]: null }
      };

      // receiverRole OR 'all'
      whereClause[Op.and] = [
        {
          [Op.or]: [
            { receiverRole: req.user.role },
            { receiverRole: 'all' }
          ]
        },
        {
          [Op.or]: [
            { expiresAt: null },
            { expiresAt: { [Op.gt]: new Date() } }
          ]
        }
      ];

      if (type) whereClause.type = type;
      if (priority) whereClause.priority = priority;
      if (unreadOnly === 'true') whereClause.isRead = false;

      // Lấy classIds mà user có quyền truy cập
      const userClassIds = await getUserClassIds(req.user.id, req.user.role);
      if (userClassIds.length > 0) {
        whereClause[Op.and].push({
          [Op.or]: [
            { classId: null },
            { classId: { [Op.in]: userClassIds } }
          ]
        });
      } else {
        whereClause.classId = null;
      }

      const { count, rows: notifications } = await Notification.findAndCountAll({
        where: whereClause,
        order: [
          ['priority', 'DESC'],
          ['sentAt', 'DESC']
        ],
        limit,
        offset,
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'name', 'email', 'code']
          },
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Subject,
            as: 'subject',
            attributes: ['id', 'name', 'code']
          }
        ]
      });

      res.json({
        success: true,
        data: {
          notifications,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: limit
          }
        }
      });

    } catch (error) {
      console.error('Error getting my notifications:', error && error.stack ? error.stack : error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông báo'
      });
    }
  },

  // Lấy chi tiết thông báo
  async getNotificationById(req, res) {
    try {
      const { id } = req.params;

      const notification = await Notification.findByPk(id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'name', 'email', 'code']
          },
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Subject,
            as: 'subject',
            attributes: ['id', 'name', 'code']
          }
        ]
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông báo'
        });
      }

      // Kiểm tra quyền xem thông báo
      const canView = await checkNotificationViewPermission(req.user, notification);
      if (!canView) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền xem thông báo này'
        });
      }

      // Tự động mark as read
      if (!notification.isRead) {
        await notification.markAsRead();
      }

      res.json({
        success: true,
        data: notification
      });

    } catch (error) {
      console.error('Error getting notification by id:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông báo'
      });
    }
  },

  // Đánh dấu thông báo đã đọc
  async markAsRead(req, res) {
    try {
      const { id } = req.params;

      const notification = await Notification.findByPk(id);
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông báo'
        });
      }

      // Kiểm tra quyền
      const canView = await checkNotificationViewPermission(req.user, notification);
      if (!canView) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền đánh dấu thông báo này'
        });
      }

      await notification.markAsRead();

      res.json({
        success: true,
        message: 'Đã đánh dấu thông báo là đã đọc'
      });

    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi đánh dấu thông báo'
      });
    }
  },

  // [ADMIN] Lấy tất cả thông báo (cho admin quản lý)
  async getAllNotifications(req, res) {
    try {
      // Chỉ admin mới được truy cập
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền truy cập'
        });
      }
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
      const offset = (page - 1) * limit;

      const { type, priority, receiverRole } = req.query;

      const whereClause = {};
      if (type) whereClause.type = type;
      if (priority) whereClause.priority = priority;
      if (receiverRole) whereClause.receiverRole = receiverRole;

      const { count, rows: notifications } = await Notification.findAndCountAll({
        where: whereClause,
        order: [
          ['createdAt', 'DESC']
        ],
        limit,
        offset,
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'name', 'email', 'code', 'role']
          },
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Subject,
            as: 'subject',
            attributes: ['id', 'name', 'code']
          }
        ]
      });

      res.json({
        success: true,
        data: {
          notifications,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: limit
          }
        }
      });

    } catch (error) {
      console.error('Error getting all notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông báo'
      });
    }
  },

  // Đánh dấu tất cả thông báo đã đọc
  async markAllAsRead(req, res) {
    try {
      const userClassIds = await getUserClassIds(req.user.id, req.user.role);
      
      let whereClause = {
        [Op.and]: [
          {
            [Op.or]: [
              { receiverRole: req.user.role },
              { receiverRole: 'all' }
            ]
          },
          {
            [Op.or]: [
              { expiresAt: null },
              { expiresAt: { [Op.gt]: new Date() } }
            ]
          }
        ],
        sentAt: { [Op.not]: null },
        isRead: false
      };

      if (userClassIds.length > 0) {
        whereClause[Op.and].push({
          [Op.or]: [
            { classId: null },
            { classId: { [Op.in]: userClassIds } }
          ]
        });
      } else {
        whereClause.classId = null;
      }

      const [updatedCount] = await Notification.update(
        { isRead: true },
        { where: whereClause }
      );

      res.json({
        success: true,
        message: `Đã đánh dấu ${updatedCount} thông báo là đã đọc`
      });

    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi đánh dấu tất cả thông báo'
      });
    }
  },

  // Lấy số lượng thông báo chưa đọc
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      // Build where clause
      const whereClause = {
        isRead: false,
        sentAt: { [Op.not]: null },
        [Op.and]: [
          {
            [Op.or]: [
              { receiverRole: userRole },
              { receiverRole: 'all' }
            ]
          },
          {
            [Op.or]: [
              { expiresAt: null },
              { expiresAt: { [Op.gt]: new Date() } }
            ]
          }
        ]
      };

      // Filter by user's classes if student or teacher
      if (userRole === 'student' || userRole === 'teacher') {
        const userClassIds = await getUserClassIds(userId, userRole);
        if (userClassIds.length > 0) {
          whereClause[Op.and].push({
            [Op.or]: [
              { classId: null },
              { classId: { [Op.in]: userClassIds } }
            ]
          });
        } else {
          // No classes, only show notifications without classId
          whereClause.classId = null;
        }
      }

      const count = await Notification.count({ where: whereClause });

      res.json({
        success: true,
        data: { count }
      });

    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy số thông báo chưa đọc'
      });
    }
  },

  // Cập nhật thông báo (chỉ người tạo hoặc admin)
  async updateNotification(req, res) {
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
      const updateData = req.body;

      const notification = await Notification.findByPk(id);
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông báo'
        });
      }

      // Kiểm tra quyền sửa
      const canEdit = notification.senderId === req.user.id || req.user.role === 'admin';
      if (!canEdit) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền sửa thông báo này'
        });
      }

      // Không cho phép sửa thông báo đã gửi (trừ admin)
      if (notification.sentAt && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Không thể sửa thông báo đã gửi'
        });
      }

      await notification.update(updateData);

      const updatedNotification = await Notification.findByPk(id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'name', 'email', 'code']
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
        message: 'Cập nhật thông báo thành công',
        data: updatedNotification
      });

    } catch (error) {
      console.error('Error updating notification:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật thông báo'
      });
    }
  },

  // Xóa thông báo (chỉ người tạo hoặc admin)
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;

      const notification = await Notification.findByPk(id);
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông báo'
        });
      }

      // Kiểm tra quyền xóa
      const canDelete = notification.senderId === req.user.id || req.user.role === 'admin';
      if (!canDelete) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền xóa thông báo này'
        });
      }

      await notification.destroy();

      res.json({
        success: true,
        message: 'Xóa thông báo thành công'
      });

    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa thông báo'
      });
    }
  },

  // Lấy thống kê thông báo (admin/teacher)
  async getNotificationStats(req, res) {
    try {
      if (!['admin', 'teacher'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền xem thống kê'
        });
      }

      const { startDate, endDate, classId } = req.query;
      
      let whereClause = {};
      if (req.user.role === 'teacher') {
        whereClause.senderId = req.user.id;
      }
      
      if (startDate && endDate) {
        whereClause.createdAt = {
          [sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }
      
      if (classId) {
        whereClause.classId = classId;
      }

      const stats = await Notification.findAll({
        where: whereClause,
        attributes: [
          'type',
          'priority',
          [sequelize.fn('COUNT', '*'), 'count'],
          [sequelize.fn('AVG', sequelize.col('readCount')), 'avgReadRate'],
          [sequelize.fn('SUM', sequelize.col('readCount')), 'totalReads'],
          [sequelize.fn('SUM', sequelize.col('targetCount')), 'totalTargets']
        ],
        group: ['type', 'priority'],
        raw: true
      });

      const totalNotifications = await Notification.count({ where: whereClause });
      
      const readRate = stats.reduce((acc, stat) => {
        const reads = parseInt(stat.totalReads) || 0;
        const targets = parseInt(stat.totalTargets) || 0;
        return acc + (targets > 0 ? (reads / targets) * 100 : 0);
      }, 0) / (stats.length || 1);

      res.json({
        success: true,
        data: {
          totalNotifications,
          averageReadRate: Math.round(readRate * 100) / 100,
          statsByTypeAndPriority: stats
        }
      });

    } catch (error) {
      console.error('Error getting notification stats:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thống kê thông báo'
      });
    }
  }
};

// ========== HELPER FUNCTIONS ==========

// Lấy danh sách classIds mà user có quyền truy cập
async function getUserClassIds(userId, userRole) {
  const classIds = [];
  
  if (userRole === 'admin') {
    const classes = await Class.findAll({ attributes: ['id'] });
    return classes.map(c => c.id);
  }
  
  if (userRole === 'teacher') {
    const { TeacherAssignment } = require('../models');
    const assignments = await TeacherAssignment.findAll({
      where: { teacherId: userId },
      attributes: ['classId']
    });
    return assignments.map(a => a.classId);
  }
  
  if (userRole === 'student') {
    const { ClassStudent } = require('../models');
    const enrollments = await ClassStudent.findAll({
      where: { studentId: userId },
      attributes: ['classId']
    });
    return enrollments.map(e => e.classId);
  }
  
  return classIds;
}

// Kiểm tra quyền teacher với lớp học
async function checkTeacherClassPermission(teacherId, classId) {
  const { TeacherAssignment } = require('../models');
  const assignment = await TeacherAssignment.findOne({
    where: { teacherId, classId }
  });
  return !!assignment;
}

// Kiểm tra quyền xem thông báo
async function checkNotificationViewPermission(user, notification) {
  // Admin có thể xem tất cả
  if (user.role === 'admin') return true;
  
  // Kiểm tra receiverRole
  if (notification.receiverRole !== 'all' && notification.receiverRole !== user.role) {
    return false;
  }
  
  // Kiểm tra classId nếu có
  if (notification.classId) {
    const userClassIds = await getUserClassIds(user.id, user.role);
    return userClassIds.includes(notification.classId);
  }
  
  return true;
}

module.exports = notificationController;