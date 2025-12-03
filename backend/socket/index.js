const { Server } = require('socket.io');
const ChatController = require('../controllers/chatController');

let io;
let chatController;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Initialize chat controller với io instance
  chatController = new ChatController(io);

  console.log('✅ Socket.IO server initialized');
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

const getChatController = () => {
  if (!chatController) {
    throw new Error('Chat controller not initialized');
  }
  return chatController;
};

// Helper functions để gửi notifications từ các controller khác
const notifyClass = async (classId, eventName, data) => {
  if (chatController) {
    await chatController.notifyClass(classId, eventName, data);
  }
};

const notifyUser = async (userId, eventName, data) => {
  if (chatController) {
    await chatController.notifyUser(userId, eventName, data);
  }
};

const notifyAllUsers = (eventName, data) => {
  if (io) {
    io.emit(eventName, data);
  }
};

// Broadcast system notifications
const broadcastSystemNotification = (notification) => {
  if (io) {
    io.emit('system_notification', {
      type: 'system',
      notification,
      timestamp: new Date()
    });
  }
};

// Broadcast assignment notifications
const broadcastAssignmentNotification = (classId, assignment, type) => {
  if (io) {
    const roomName = `class_${classId}`;
    io.to(roomName).emit('assignment_notification', {
      type, // 'new', 'updated', 'deadline_reminder'
      assignment,
      timestamp: new Date()
    });
  }
};

// Broadcast grade notifications
const broadcastGradeNotification = (studentId, grade, type) => {
  if (io) {
    const roomName = `user_${studentId}`;
    io.to(roomName).emit('grade_notification', {
      type, // 'new', 'updated'
      grade,
      timestamp: new Date()
    });
  }
};

// Broadcast forum notifications
const broadcastForumNotification = (classId, data, type) => {
  if (io) {
    const roomName = `class_${classId}`;
    io.to(roomName).emit('forum_notification', {
      type, // 'new_post', 'new_comment', 'post_liked'
      data,
      timestamp: new Date()
    });
  }
};

module.exports = {
  initSocket,
  getIO,
  getChatController,
  notifyClass,
  notifyUser,
  notifyAllUsers,
  broadcastSystemNotification,
  broadcastAssignmentNotification,
  broadcastGradeNotification,
  broadcastForumNotification
};