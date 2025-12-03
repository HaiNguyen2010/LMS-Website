const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const authRoutes = require('../routes/auth');
const { User } = require('../models');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth APIs', () => {
  let testUser;

  beforeEach(() => {
    jest.clearAllMocks();
    testUser = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      password_hash: '$2b$10$test.hash',
      role: 'student'
    };
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'student'
      };

      User.findOne.mockResolvedValue(null); // Email not exists
      User.create.mockResolvedValue({
        id: 2,
        ...userData,
        password_hash: 'hashed_password'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('đăng ký thành công');
      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: userData.email }
      });
      expect(User.create).toHaveBeenCalled();
    });

    it('should return 400 if email already exists', async () => {
      const userData = {
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'password123',
        role: 'student'
      };

      User.findOne.mockResolvedValue(testUser); // Email exists

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Email đã tồn tại');
    });

    it('should return 400 for invalid input data', async () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
        password: '123' // Too short
      };

      await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteData = {
        name: 'Test User'
        // Missing email, password, role
      };

      await request(app)
        .post('/api/auth/register')
        .send(incompleteData)
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user with correct credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      User.findOne.mockResolvedValue(testUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    it('should return 401 for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      User.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Email hoặc mật khẩu không đúng');
    });

    it('should return 401 for incorrect password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      User.findOne.mockResolvedValue(testUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Email hoặc mật khẩu không đúng');
    });

    it('should return 400 for invalid input format', async () => {
      const invalidData = {
        email: 'invalid-email-format',
        password: ''
      };

      await request(app)
        .post('/api/auth/login')
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return user profile with valid token', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      User.findByPk.mockResolvedValue(testUser);

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testUser.id);
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).not.toHaveProperty('password_hash');
    });

    it('should return 401 without authorization token', async () => {
      await request(app)
        .get('/api/auth/profile')
        .expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should return 404 if user not found', async () => {
      const token = generateTestToken(999, 'student');
      User.findByPk.mockResolvedValue(null);

      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile successfully', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      User.findByPk.mockResolvedValue(testUser);
      User.findOne.mockResolvedValue(null); // Email not taken by others
      User.update.mockResolvedValue([1]); // 1 row affected

      const updatedUser = { ...testUser, ...updateData };
      User.findByPk.mockResolvedValueOnce(updatedUser);

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.email).toBe(updateData.email);
    });

    it('should return 400 if email is taken by another user', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const updateData = {
        email: 'taken@example.com'
      };

      User.findByPk.mockResolvedValue(testUser);
      User.findOne.mockResolvedValue({ id: 999 }); // Email taken by user 999

      await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(400);
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password successfully', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const passwordData = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123'
      };

      User.findByPk.mockResolvedValue(testUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('new_hashed_password');
      User.update.mockResolvedValue([1]);

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('thành công');
    });

    it('should return 400 for incorrect current password', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      };

      User.findByPk.mockResolvedValue(testUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData)
        .expect(400);
    });

    it('should return 400 for weak new password', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const passwordData = {
        currentPassword: 'oldpassword',
        newPassword: '123' // Too weak
      };

      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData)
        .expect(400);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should send reset password email', async () => {
      const emailData = { email: 'test@example.com' };
      
      User.findOne.mockResolvedValue(testUser);

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send(emailData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('email');
    });

    it('should return 404 for non-existent email', async () => {
      const emailData = { email: 'nonexistent@example.com' };
      
      User.findOne.mockResolvedValue(null);

      await request(app)
        .post('/api/auth/forgot-password')
        .send(emailData)
        .expect(404);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      const resetData = {
        token: 'valid-reset-token',
        newPassword: 'newpassword123'
      };

      // Mock valid reset token
      jest.spyOn(jwt, 'verify').mockReturnValue({ userId: testUser.id });
      User.findByPk.mockResolvedValue(testUser);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('new_hashed_password');
      User.update.mockResolvedValue([1]);

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(resetData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('thành công');
    });

    it('should return 400 for invalid reset token', async () => {
      const resetData = {
        token: 'invalid-token',
        newPassword: 'newpassword123'
      };

      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await request(app)
        .post('/api/auth/reset-password')
        .send(resetData)
        .expect(400);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      const token = generateTestToken(testUser.id, testUser.role);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('thành công');
    });
  });

  describe('GET /api/auth/verify-token', () => {
    it('should verify valid token', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      
      const response = await request(app)
        .get('/api/auth/verify-token')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('valid', true);
      expect(response.body).toHaveProperty('user');
    });

    it('should return false for invalid token', async () => {
      await request(app)
        .get('/api/auth/verify-token')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});