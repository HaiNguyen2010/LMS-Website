const request = require('supertest');
const express = require('express');
const userRoutes = require('../routes/users');
const { User } = require('../models');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('User APIs', () => {
  let testUser, adminUser, teacherUser;

  beforeEach(() => {
    jest.clearAllMocks();
    
    testUser = {
      id: 1,
      name: 'Test Student',
      email: 'student@example.com',
      role: 'student',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    teacherUser = {
      id: 2,
      name: 'Test Teacher',
      email: 'teacher@example.com',
      role: 'teacher',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    adminUser = {
      id: 3,
      name: 'Test Admin',
      email: 'admin@example.com',
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  describe('GET /api/users', () => {
    it('should get all users as admin', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      const users = [testUser, teacherUser, adminUser];
      
      User.findAll.mockResolvedValue(users);

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(3);
      expect(User.findAll).toHaveBeenCalledWith({
        attributes: { exclude: ['password_hash'] },
        limit: 50,
        offset: 0
      });
    });

    it('should return 403 for non-admin users', async () => {
      const token = generateTestToken(testUser.id, testUser.role);

      await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should support pagination', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      User.findAll.mockResolvedValue([testUser]);

      await request(app)
        .get('/api/users?page=2&limit=10')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(User.findAll).toHaveBeenCalledWith({
        attributes: { exclude: ['password_hash'] },
        limit: 10,
        offset: 10
      });
    });

    it('should filter by role', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      User.findAll.mockResolvedValue([teacherUser]);

      await request(app)
        .get('/api/users?role=teacher')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(User.findAll).toHaveBeenCalledWith({
        attributes: { exclude: ['password_hash'] },
        where: { role: 'teacher' },
        limit: 50,
        offset: 0
      });
    });

    it('should search by name or email', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      User.findAll.mockResolvedValue([testUser]);

      await request(app)
        .get('/api/users?search=test')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(User.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            [expect.any(Symbol)]: expect.any(Object) // Op.or condition
          })
        })
      );
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by id as admin', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      User.findByPk.mockResolvedValue(testUser);

      const response = await request(app)
        .get(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.id).toBe(testUser.id);
      expect(response.body.email).toBe(testUser.email);
      expect(response.body).not.toHaveProperty('password_hash');
    });

    it('should allow users to get their own profile', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      User.findByPk.mockResolvedValue(testUser);

      const response = await request(app)
        .get(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.id).toBe(testUser.id);
    });

    it('should return 403 when accessing other user profile as student', async () => {
      const token = generateTestToken(testUser.id, testUser.role);

      await request(app)
        .get(`/api/users/${teacherUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should return 404 for non-existent user', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      User.findByPk.mockResolvedValue(null);

      await request(app)
        .get('/api/users/999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('POST /api/users', () => {
    it('should create new user as admin', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      const newUserData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'student'
      };

      User.findOne.mockResolvedValue(null); // Email doesn't exist
      User.create.mockResolvedValue({
        id: 4,
        ...newUserData,
        password_hash: 'hashed_password'
      });

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send(newUserData)
        .expect(201);

      expect(response.body.email).toBe(newUserData.email);
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('password_hash');
    });

    it('should return 403 for non-admin users', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const newUserData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'student'
      };

      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send(newUserData)
        .expect(403);
    });

    it('should return 400 if email already exists', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      const duplicateUserData = {
        name: 'Duplicate User',
        email: 'student@example.com', // Existing email
        password: 'password123',
        role: 'student'
      };

      User.findOne.mockResolvedValue(testUser); // Email exists

      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send(duplicateUserData)
        .expect(400);
    });

    it('should validate required fields', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      const invalidData = {
        name: '',
        email: 'invalid-email',
        password: '123' // Too short
      };

      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user as admin', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
        role: 'teacher'
      };

      User.findByPk.mockResolvedValue(testUser);
      User.findOne.mockResolvedValue(null); // Email not taken
      User.update.mockResolvedValue([1]);
      
      const updatedUser = { ...testUser, ...updateData };
      User.findByPk.mockResolvedValueOnce(updatedUser);

      const response = await request(app)
        .put(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.email).toBe(updateData.email);
    });

    it('should allow users to update their own profile', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const updateData = {
        name: 'Self Updated Name'
      };

      User.findByPk.mockResolvedValue(testUser);
      User.update.mockResolvedValue([1]);
      
      const updatedUser = { ...testUser, ...updateData };
      User.findByPk.mockResolvedValueOnce(updatedUser);

      const response = await request(app)
        .put(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
    });

    it('should return 403 when updating other user as student', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const updateData = { name: 'Unauthorized Update' };

      await request(app)
        .put(`/api/users/${teacherUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(403);
    });

    it('should not allow students to change their role', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const updateData = {
        name: 'Test Student',
        role: 'admin' // Trying to escalate privileges
      };

      User.findByPk.mockResolvedValue(testUser);

      await request(app)
        .put(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(403);
    });

    it('should return 400 if email is taken by another user', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      const updateData = {
        email: 'teacher@example.com' // Taken by teacher
      };

      User.findByPk.mockResolvedValue(testUser);
      User.findOne.mockResolvedValue(teacherUser); // Email taken

      await request(app)
        .put(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(400);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user as admin', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      User.findByPk.mockResolvedValue(testUser);
      User.destroy.mockResolvedValue(1);

      const response = await request(app)
        .delete(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('xóa thành công');
    });

    it('should return 403 for non-admin users', async () => {
      const token = generateTestToken(testUser.id, testUser.role);

      await request(app)
        .delete(`/api/users/${teacherUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should not allow admin to delete themselves', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      User.findByPk.mockResolvedValue(adminUser);

      await request(app)
        .delete(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });

    it('should return 404 for non-existent user', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      User.findByPk.mockResolvedValue(null);

      await request(app)
        .delete('/api/users/999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('PUT /api/users/:id/status', () => {
    it('should activate/deactivate user as admin', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      const statusData = { isActive: false };

      User.findByPk.mockResolvedValue(testUser);
      User.update.mockResolvedValue([1]);

      const response = await request(app)
        .put(`/api/users/${testUser.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send(statusData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(User.update).toHaveBeenCalledWith(
        { isActive: false },
        { where: { id: testUser.id } }
      );
    });

    it('should return 403 for non-admin users', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const statusData = { isActive: true };

      await request(app)
        .put(`/api/users/${teacherUser.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send(statusData)
        .expect(403);
    });
  });

  describe('GET /api/users/search', () => {
    it('should search users by query', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      const searchResults = [testUser, teacherUser];
      
      User.findAll.mockResolvedValue(searchResults);

      const response = await request(app)
        .get('/api/users/search?q=test')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
    });

    it('should return empty array for no matches', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      User.findAll.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/users/search?q=nonexistent')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });

    it('should require search query', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);

      await request(app)
        .get('/api/users/search')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });

  describe('GET /api/users/stats', () => {
    it('should get user statistics as admin', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      
      // Mock count queries
      User.count = jest.fn()
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(75) // active
        .mockResolvedValueOnce(30) // students
        .mockResolvedValueOnce(15) // teachers
        .mockResolvedValueOnce(5); // admins

      const response = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('active');
      expect(response.body).toHaveProperty('byRole');
      expect(response.body.byRole).toHaveProperty('student');
      expect(response.body.byRole).toHaveProperty('teacher');
      expect(response.body.byRole).toHaveProperty('admin');
    });

    it('should return 403 for non-admin users', async () => {
      const token = generateTestToken(testUser.id, testUser.role);

      await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('POST /api/users/bulk-import', () => {
    it('should import users from CSV as admin', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      const csvData = 'name,email,role\nUser1,user1@test.com,student\nUser2,user2@test.com,teacher';

      User.findOne.mockResolvedValue(null); // No duplicates
      User.bulkCreate.mockResolvedValue([
        { id: 4, name: 'User1', email: 'user1@test.com', role: 'student' },
        { id: 5, name: 'User2', email: 'user2@test.com', role: 'teacher' }
      ]);

      const response = await request(app)
        .post('/api/users/bulk-import')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from(csvData), 'users.csv')
        .expect(200);

      expect(response.body).toHaveProperty('imported');
      expect(response.body.imported).toBe(2);
    });

    it('should return 403 for non-admin users', async () => {
      const token = generateTestToken(testUser.id, testUser.role);

      await request(app)
        .post('/api/users/bulk-import')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });
});