// Test setup file
const jwt = require('jsonwebtoken');

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-secret-key-for-unit-tests';
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'test_db';

// Mock database models to prevent actual database operations
jest.mock('../models', () => {
  const mockUser = {
    create: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  };

  const mockClass = {
    create: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  };

  const mockForumPost = {
    create: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    getPopularPosts: jest.fn(),
    getRecentPosts: jest.fn()
  };

  return {
    User: mockUser,
    Class: mockClass,
    ForumPost: mockForumPost,
    ForumComment: mockUser,
    ForumLike: mockUser,
    Notification: mockUser,
    ChatMessage: mockUser,
    Subject: mockUser,
    Lesson: mockUser,
    Assignment: mockUser,
    Grade: mockUser,
    sequelize: {
      authenticate: jest.fn().mockResolvedValue(true),
      close: jest.fn().mockResolvedValue(true),
      transaction: jest.fn()
    }
  };
});

// Helper functions for tests
global.generateTestToken = (userId = 1, role = 'student') => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

global.mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  role: 'student'
};

global.mockTeacher = {
  id: 2,
  name: 'Test Teacher',
  email: 'teacher@example.com',
  role: 'teacher'
};

global.mockClass = {
  id: 1,
  name: 'Test Class',
  grade: 10,
  description: 'Test Description'
};

console.log('Test environment setup completed');