const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { syncDatabase, Subject } = require('./models');
const routes = require('./routes');
const { swaggerSpec, swaggerUi, swaggerUiOptions } = require('./config/swagger');
const { initSocket } = require('./socket');

// Khởi tạo Express app và HTTP server
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (uploaded files)
app.use('/uploads', express.static('uploads'));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Swagger JSON endpoint
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Routes
app.use('/', routes);

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // JWT errors
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ'
    });
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: error.details
    });
  }

  // Sequelize errors
  if (error.name === 'SequelizeConnectionError') {
    return res.status(500).json({
      success: false,
      message: 'Lỗi kết nối database'
    });
  }

  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: error.errors.map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }

  // Default error
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Lỗi server nội bộ',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint không tồn tại'
  });
});

// Khởi động server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Sync database (tạo bảng nếu chưa có)  
    // First, try to drop and recreate subjects table only
    try {
      await Subject.drop();
      console.log('✅ Dropped subjects table successfully');
    } catch (error) {
      console.log('ℹ️ Subjects table does not exist or already dropped');
    }
    
    await syncDatabase({ 
      force: false,
      alter: false
    });

    // Initialize Socket.IO
    initSocket(server);

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server đang chạy trên port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`� Swagger Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`📡 Health Check: http://localhost:${PORT}/health`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n📋 Available endpoints:`);
        console.log(`   POST http://localhost:${PORT}/api/v1/auth/register`);
        console.log(`   POST http://localhost:${PORT}/api/v1/auth/login`);
        console.log(`   GET  http://localhost:${PORT}/api/v1/auth/profile`);
        console.log(`   GET  http://localhost:${PORT}/api/v1/users`);
        console.log(`   GET  http://localhost:${PORT}/health`);
        console.log(`\n🏫 Class Management APIs (Admin only):`);
        console.log(`   GET  http://localhost:${PORT}/api/v1/classes`);
        console.log(`   POST http://localhost:${PORT}/api/v1/classes`);
        console.log(`   GET  http://localhost:${PORT}/api/v1/subjects`);
        console.log(`   POST http://localhost:${PORT}/api/v1/subjects`);
        console.log(`   GET  http://localhost:${PORT}/api/v1/teacher-assignments`);
        console.log(`   POST http://localhost:${PORT}/api/v1/teacher-assignments`);
        console.log(`   GET  http://localhost:${PORT}/api/v1/student-enrollments`);
        console.log(`   POST http://localhost:${PORT}/api/v1/student-enrollments`);
        console.log(`\n📚 Lesson Management APIs:`);
        console.log(`   GET  http://localhost:${PORT}/api/v1/lessons`);
        console.log(`   POST http://localhost:${PORT}/api/v1/lessons (with file upload)`);
        console.log(`   GET  http://localhost:${PORT}/api/v1/lessons/class/:classId`);
        console.log(`\n📝 Assignment & Submission APIs:`);
        console.log(`   GET  http://localhost:${PORT}/api/v1/assignments`);
        console.log(`   POST http://localhost:${PORT}/api/v1/assignments (Admin/Teacher)`);
        console.log(`   GET  http://localhost:${PORT}/api/v1/assignments/:id`);
        console.log(`   PUT  http://localhost:${PORT}/api/v1/assignments/:id (Admin/Teacher)`);
        console.log(`   POST http://localhost:${PORT}/api/v1/assignments/:assignmentId/submissions (Student)`);
        console.log(`   GET  http://localhost:${PORT}/api/v1/assignments/:assignmentId/submissions (Admin/Teacher)`);
        console.log(`   GET  http://localhost:${PORT}/api/v1/assignments/my-submissions (Student)`);
        console.log(`   PUT  http://localhost:${PORT}/api/v1/assignments/submissions/:id/grade (Admin/Teacher)`);
        console.log(`\n📊 Grade Management APIs:`);
        console.log(`   POST http://localhost:${PORT}/api/v1/grades (Admin/Teacher)`);
        console.log(`   GET  http://localhost:${PORT}/api/v1/grades?classId=... (Admin/Teacher)`);
        console.log(`   GET  http://localhost:${PORT}/api/v1/grades/student/:id (Admin/Teacher/Student)`);
        console.log(`   PUT  http://localhost:${PORT}/api/v1/grades/:id (Admin/Teacher)`);
        console.log(`   GET  http://localhost:${PORT}/api/v1/grades/statistics?classId=... (Admin/Teacher)`);
        console.log(`   GET  http://localhost:${PORT}/api/v1/grades/report/export?classId=... (Admin/Teacher)`);
        console.log(`\n💬 Forum & Chat APIs:`);
        console.log(`   GET  http://localhost:${PORT}/api/v1/forum/classes/:classId/posts`);
        console.log(`   POST http://localhost:${PORT}/api/v1/forum/posts`);
        console.log(`   GET  http://localhost:${PORT}/api/v1/forum/posts/:id`);
        console.log(`   POST http://localhost:${PORT}/api/v1/forum/comments`);
        console.log(`   POST http://localhost:${PORT}/api/v1/forum/likes`);
        console.log(`\n🔔 Notification APIs:`);
        console.log(`   POST http://localhost:${PORT}/api/v1/notifications (Admin/Teacher)`);
        console.log(`   GET  http://localhost:${PORT}/api/v1/notifications/my`);
        console.log(`   GET  http://localhost:${PORT}/api/v1/notifications/unread-count`);
        console.log(`   PUT  http://localhost:${PORT}/api/v1/notifications/:id/read`);
        console.log(`\n🚀 Socket.IO Chat: ws://localhost:${PORT} (Authentication required)`);
      }
    });

  } catch (error) {
    console.error('❌ Không thể khởi động server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = { app, server };