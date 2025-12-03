const { ChatMessage, User, Class, sequelize } = require('../models');
const jwt = require('jsonwebtoken');

class ChatController {
  constructor(io) {
    this.io = io;
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.use(this.authenticateSocket.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));
  }

  // Middleware để authenticate socket connection
  async authenticateSocket(socket, next) {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id, {
        attributes: ['id', 'fullName', 'email', 'role', 'avatar']
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  }

  // Xử lý kết nối socket
  handleConnection(socket) {
    console.log(`User ${socket.user.fullName} connected to chat`);

    // Join user to their personal room
    socket.join(`user_${socket.user.id}`);

    // Handle joining class rooms
    socket.on('join_class', this.handleJoinClass.bind(this, socket));
    
    // Handle leaving class rooms
    socket.on('leave_class', this.handleLeaveClass.bind(this, socket));
    
    // Handle sending messages
    socket.on('send_message', this.handleSendMessage.bind(this, socket));
    
    // Handle message reactions
    socket.on('add_reaction', this.handleAddReaction.bind(this, socket));
    socket.on('remove_reaction', this.handleRemoveReaction.bind(this, socket));
    
    // Handle typing indicators
    socket.on('start_typing', this.handleStartTyping.bind(this, socket));
    socket.on('stop_typing', this.handleStopTyping.bind(this, socket));
    
    // Handle message read status
    socket.on('mark_message_read', this.handleMarkMessageRead.bind(this, socket));
    
    // Handle message editing
    socket.on('edit_message', this.handleEditMessage.bind(this, socket));
    
    // Handle message deletion
    socket.on('delete_message', this.handleDeleteMessage.bind(this, socket));
    
    // Handle disconnect
    socket.on('disconnect', this.handleDisconnect.bind(this, socket));
  }

  // Join class room
  async handleJoinClass(socket, data) {
    try {
      const { classId } = data;
      
      // Kiểm tra quyền truy cập lớp
      const hasAccess = await this.checkClassAccess(socket.user.id, classId, socket.user.role);
      if (!hasAccess) {
        socket.emit('error', { message: 'Không có quyền truy cập lớp học này' });
        return;
      }

      const roomName = `class_${classId}`;
      socket.join(roomName);
      
      // Thông báo user đã join
      socket.to(roomName).emit('user_joined', {
        user: {
          id: socket.user.id,
          fullName: socket.user.fullName,
          avatar: socket.user.avatar,
          role: socket.user.role
        },
        message: `${socket.user.fullName} đã tham gia phòng chat`
      });

      // Gửi lịch sử tin nhắn gần đây
      const recentMessages = await this.getRecentMessages(classId, 50);
      socket.emit('message_history', { classId, messages: recentMessages });

      // Xác nhận join thành công
      socket.emit('joined_class', { classId, roomName });
      
      console.log(`User ${socket.user.fullName} joined class ${classId}`);

    } catch (error) {
      console.error('Error joining class:', error);
      socket.emit('error', { message: 'Lỗi khi tham gia lớp học' });
    }
  }

  // Leave class room
  async handleLeaveClass(socket, data) {
    try {
      const { classId } = data;
      const roomName = `class_${classId}`;
      
      socket.leave(roomName);
      
      // Thông báo user đã leave
      socket.to(roomName).emit('user_left', {
        user: {
          id: socket.user.id,
          fullName: socket.user.fullName,
          avatar: socket.user.avatar
        },
        message: `${socket.user.fullName} đã rời khỏi phòng chat`
      });

      socket.emit('left_class', { classId });
      console.log(`User ${socket.user.fullName} left class ${classId}`);

    } catch (error) {
      console.error('Error leaving class:', error);
      socket.emit('error', { message: 'Lỗi khi rời lớp học' });
    }
  }

  // Send message
  async handleSendMessage(socket, data) {
    try {
      const { classId, message, messageType = 'text', replyToId, attachments } = data;
      
      // Validate data
      if (!classId || !message) {
        socket.emit('error', { message: 'Dữ liệu tin nhắn không hợp lệ' });
        return;
      }

      // Kiểm tra quyền gửi tin nhắn
      const hasAccess = await this.checkClassAccess(socket.user.id, classId, socket.user.role);
      if (!hasAccess) {
        socket.emit('error', { message: 'Không có quyền gửi tin nhắn trong lớp này' });
        return;
      }

      // Tạo tin nhắn trong database
      const chatMessage = await ChatMessage.create({
        senderId: socket.user.id,
        classId,
        message,
        messageType,
        replyToId: replyToId || null,
        attachments: attachments || []
      });

      // Lấy tin nhắn với thông tin chi tiết
      const messageWithDetails = await ChatMessage.findByPk(chatMessage.id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'fullName', 'email', 'avatar', 'role']
          },
          {
            model: ChatMessage,
            as: 'replyTo',
            attributes: ['id', 'message', 'senderId', 'messageType'],
            include: [{
              model: User,
              as: 'sender',
              attributes: ['id', 'fullName']
            }]
          }
        ]
      });

      const roomName = `class_${classId}`;
      
      // Gửi tin nhắn đến tất cả users trong room
      this.io.to(roomName).emit('new_message', {
        message: messageWithDetails,
        timestamp: new Date()
      });

      console.log(`Message sent by ${socket.user.fullName} in class ${classId}`);

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Lỗi khi gửi tin nhắn' });
    }
  }

  // Add reaction to message
  async handleAddReaction(socket, data) {
    try {
      const { messageId, emoji } = data;
      
      const message = await ChatMessage.findByPk(messageId);
      if (!message) {
        socket.emit('error', { message: 'Không tìm thấy tin nhắn' });
        return;
      }

      // Kiểm tra quyền truy cập
      const hasAccess = await this.checkClassAccess(socket.user.id, message.classId, socket.user.role);
      if (!hasAccess) {
        socket.emit('error', { message: 'Không có quyền thực hiện hành động này' });
        return;
      }

      await message.addReaction(socket.user.id, emoji);

      const roomName = `class_${message.classId}`;
      this.io.to(roomName).emit('reaction_added', {
        messageId,
        emoji,
        userId: socket.user.id,
        user: {
          id: socket.user.id,
          fullName: socket.user.fullName,
          avatar: socket.user.avatar
        }
      });

    } catch (error) {
      console.error('Error adding reaction:', error);
      socket.emit('error', { message: 'Lỗi khi thêm reaction' });
    }
  }

  // Remove reaction from message
  async handleRemoveReaction(socket, data) {
    try {
      const { messageId, emoji } = data;
      
      const message = await ChatMessage.findByPk(messageId);
      if (!message) {
        socket.emit('error', { message: 'Không tìm thấy tin nhắn' });
        return;
      }

      // Kiểm tra quyền truy cập
      const hasAccess = await this.checkClassAccess(socket.user.id, message.classId, socket.user.role);
      if (!hasAccess) {
        socket.emit('error', { message: 'Không có quyền thực hiện hành động này' });
        return;
      }

      await message.removeReaction(socket.user.id, emoji);

      const roomName = `class_${message.classId}`;
      this.io.to(roomName).emit('reaction_removed', {
        messageId,
        emoji,
        userId: socket.user.id
      });

    } catch (error) {
      console.error('Error removing reaction:', error);
      socket.emit('error', { message: 'Lỗi khi xóa reaction' });
    }
  }

  // Handle typing indicators
  async handleStartTyping(socket, data) {
    try {
      const { classId } = data;
      
      const hasAccess = await this.checkClassAccess(socket.user.id, classId, socket.user.role);
      if (!hasAccess) return;

      const roomName = `class_${classId}`;
      socket.to(roomName).emit('user_typing', {
        userId: socket.user.id,
        fullName: socket.user.fullName,
        classId
      });

    } catch (error) {
      console.error('Error handling start typing:', error);
    }
  }

  async handleStopTyping(socket, data) {
    try {
      const { classId } = data;
      
      const hasAccess = await this.checkClassAccess(socket.user.id, classId, socket.user.role);
      if (!hasAccess) return;

      const roomName = `class_${classId}`;
      socket.to(roomName).emit('user_stop_typing', {
        userId: socket.user.id,
        classId
      });

    } catch (error) {
      console.error('Error handling stop typing:', error);
    }
  }

  // Mark message as read
  async handleMarkMessageRead(socket, data) {
    try {
      const { messageId } = data;
      
      const message = await ChatMessage.findByPk(messageId);
      if (!message) return;

      const hasAccess = await this.checkClassAccess(socket.user.id, message.classId, socket.user.role);
      if (!hasAccess) return;

      await message.markAsRead(socket.user.id);

      const roomName = `class_${message.classId}`;
      socket.to(roomName).emit('message_read', {
        messageId,
        userId: socket.user.id,
        readAt: new Date()
      });

    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  // Edit message
  async handleEditMessage(socket, data) {
    try {
      const { messageId, newMessage } = data;
      
      const message = await ChatMessage.findByPk(messageId);
      if (!message) {
        socket.emit('error', { message: 'Không tìm thấy tin nhắn' });
        return;
      }

      // Chỉ người gửi hoặc admin/teacher mới có thể sửa
      const canEdit = message.senderId === socket.user.id || 
                      ['admin', 'teacher'].includes(socket.user.role);
      
      if (!canEdit) {
        socket.emit('error', { message: 'Không có quyền sửa tin nhắn này' });
        return;
      }

      await message.update({ message: newMessage });

      const roomName = `class_${message.classId}`;
      this.io.to(roomName).emit('message_edited', {
        messageId,
        newMessage,
        editedAt: message.editedAt,
        isEdited: true
      });

    } catch (error) {
      console.error('Error editing message:', error);
      socket.emit('error', { message: 'Lỗi khi sửa tin nhắn' });
    }
  }

  // Delete message
  async handleDeleteMessage(socket, data) {
    try {
      const { messageId } = data;
      
      const message = await ChatMessage.findByPk(messageId);
      if (!message) {
        socket.emit('error', { message: 'Không tìm thấy tin nhắn' });
        return;
      }

      // Chỉ người gửi hoặc admin/teacher mới có thể xóa
      const canDelete = message.senderId === socket.user.id || 
                        ['admin', 'teacher'].includes(socket.user.role);
      
      if (!canDelete) {
        socket.emit('error', { message: 'Không có quyền xóa tin nhắn này' });
        return;
      }

      await message.softDelete();

      const roomName = `class_${message.classId}`;
      this.io.to(roomName).emit('message_deleted', {
        messageId,
        deletedAt: message.deletedAt,
        isDeleted: true
      });

    } catch (error) {
      console.error('Error deleting message:', error);
      socket.emit('error', { message: 'Lỗi khi xóa tin nhắn' });
    }
  }

  // Handle disconnect
  handleDisconnect(socket) {
    console.log(`User ${socket.user.fullName} disconnected from chat`);
  }

  // ========== HELPER METHODS ==========

  // Kiểm tra quyền truy cập lớp học
  async checkClassAccess(userId, classId, userRole) {
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

  // Lấy tin nhắn gần đây
  async getRecentMessages(classId, limit = 50) {
    const messages = await ChatMessage.findAll({
      where: { 
        classId,
        isDeleted: false
      },
      order: [['createdAt', 'DESC']],
      limit,
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'fullName', 'email', 'avatar', 'role']
        },
        {
          model: ChatMessage,
          as: 'replyTo',
          attributes: ['id', 'message', 'senderId', 'messageType'],
          include: [{
            model: User,
            as: 'sender',
            attributes: ['id', 'fullName']
          }]
        }
      ]
    });

    return messages.reverse(); // Trả về theo thứ tự thời gian tăng dần
  }

  // Gửi thông báo đến tất cả users trong lớp
  async notifyClass(classId, eventName, data) {
    const roomName = `class_${classId}`;
    this.io.to(roomName).emit(eventName, data);
  }

  // Gửi thông báo cá nhân đến user
  async notifyUser(userId, eventName, data) {
    const roomName = `user_${userId}`;
    this.io.to(roomName).emit(eventName, data);
  }

  // Lấy danh sách users online trong lớp
  async getOnlineUsers(classId) {
    const roomName = `class_${classId}`;
    const room = this.io.sockets.adapter.rooms.get(roomName);
    
    if (!room) return [];

    const onlineUsers = [];
    for (const socketId of room) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket && socket.user) {
        onlineUsers.push({
          id: socket.user.id,
          fullName: socket.user.fullName,
          avatar: socket.user.avatar,
          role: socket.user.role
        });
      }
    }

    return onlineUsers;
  }
}

module.exports = ChatController;