const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const notificationRoutes = require('../routes/notificationRoutes');
const { User, Class, Notification } = require('../models');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/notifications', notificationRoutes);

describe('Notification APIs', () => {
  let testUser, testClass, testNotification, authToken;
  let teacherUser, teacherToken;

  beforeAll(async () => {
    // Create test student
    testUser = await User.create({
      id: 997,
      name: 'Test Student',
      email: 'student@example.com',
      password_hash: 'hashedpassword',
      role: 'student'
    });

    // Create test teacher
    teacherUser = await User.create({
      id: 996,
      name: 'Test Teacher',
      email: 'teacher@example.com',
      password_hash: 'hashedpassword',
      role: 'teacher'
    });

    // Create test class
    testClass = await Class.create({
      id: 997,
      name: 'Test Class',
      grade: 10,
      description: 'Test Description',
      teacherId: teacherUser.id
    });

    // Generate auth tokens
    authToken = jwt.sign(
      { userId: testUser.id, role: testUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    teacherToken = jwt.sign(
      { userId: teacherUser.id, role: teacherUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Cleanup test data
    await Notification.destroy({ where: { userId: [testUser.id, teacherUser.id] }, force: true });
    await Class.destroy({ where: { id: testClass.id }, force: true });
    await User.destroy({ where: { id: [testUser.id, teacherUser.id] }, force: true });
  });

  describe('POST /api/notifications', () => {
    it('should create a notification as teacher', async () => {
      const notificationData = {
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'announcement',
        targetRole: 'student',
        classId: testClass.id,
        priority: 'medium'
      };

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(notificationData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(notificationData.title);
      expect(response.body.message).toBe(notificationData.message);
      expect(response.body.type).toBe(notificationData.type);
      expect(response.body.createdBy).toBe(teacherUser.id);

      testNotification = response.body;
    });

    it('should return 403 when student tries to create notification', async () => {
      const notificationData = {
        title: 'Unauthorized Notification',
        message: 'Students should not create notifications',
        type: 'announcement',
        targetRole: 'all'
      };

      await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .send(notificationData)
        .expect(403);
    });

    it('should return 400 for invalid notification data', async () => {
      const invalidData = {
        message: 'Missing title'
        // title is required
      };

      await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/notifications', () => {
    beforeAll(async () => {
      // Create notification for test user
      await Notification.create({
        title: 'Personal Notification',
        message: 'This is for the test user',
        type: 'personal',
        userId: testUser.id,
        createdBy: teacherUser.id,
        isRead: false
      });
    });

    it('should get user notifications', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).toHaveProperty('message');
      expect(response.body[0]).toHaveProperty('isRead');
    });

    it('should filter unread notifications', async () => {
      const response = await request(app)
        .get('/api/notifications?unread=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(notification => {
        expect(notification.isRead).toBe(false);
      });
    });

    it('should filter notifications by type', async () => {
      const response = await request(app)
        .get('/api/notifications?type=personal')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(notification => {
        expect(notification.type).toBe('personal');
      });
    });
  });

  describe('GET /api/notifications/:id', () => {
    it('should get a specific notification', async () => {
      const response = await request(app)
        .get(`/api/notifications/${testNotification.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.id).toBe(testNotification.id);
      expect(response.body.title).toBe(testNotification.title);
      expect(response.body.message).toBe(testNotification.message);
    });

    it('should return 404 for non-existent notification', async () => {
      await request(app)
        .get('/api/notifications/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    let personalNotification;

    beforeAll(async () => {
      personalNotification = await Notification.create({
        title: 'Unread Notification',
        message: 'This should be marked as read',
        type: 'personal',
        userId: testUser.id,
        createdBy: teacherUser.id,
        isRead: false
      });
    });

    it('should mark notification as read', async () => {
      const response = await request(app)
        .put(`/api/notifications/${personalNotification.id}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.isRead).toBe(true);
      expect(response.body.readAt).toBeTruthy();
    });

    it('should return 404 for notification not belonging to user', async () => {
      await request(app)
        .put(`/api/notifications/${testNotification.id}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    beforeAll(async () => {
      // Create multiple unread notifications
      await Notification.bulkCreate([
        {
          title: 'Unread 1',
          message: 'Message 1',
          type: 'personal',
          userId: testUser.id,
          createdBy: teacherUser.id,
          isRead: false
        },
        {
          title: 'Unread 2',
          message: 'Message 2',
          type: 'personal',
          userId: testUser.id,
          createdBy: teacherUser.id,
          isRead: false
        }
      ]);
    });

    it('should mark all notifications as read', async () => {
      const response = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toContain('marked as read');
      expect(response.body.count).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('should delete a notification as creator', async () => {
      await request(app)
        .delete(`/api/notifications/${testNotification.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      // Verify notification is deleted
      await request(app)
        .get(`/api/notifications/${testNotification.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(404);
    });

    it('should return 403 when trying to delete other user\'s notification', async () => {
      const anotherNotification = await Notification.create({
        title: 'Another Notification',
        message: 'Created by teacher',
        type: 'announcement',
        createdBy: teacherUser.id
      });

      await request(app)
        .delete(`/api/notifications/${anotherNotification.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      // Cleanup
      await Notification.destroy({ where: { id: anotherNotification.id }, force: true });
    });
  });

  describe('GET /api/notifications/stats', () => {
    beforeAll(async () => {
      // Create test notifications for stats
      await Notification.bulkCreate([
        {
          title: 'Stats Test 1',
          message: 'Unread announcement',
          type: 'announcement',
          userId: testUser.id,
          createdBy: teacherUser.id,
          isRead: false
        },
        {
          title: 'Stats Test 2',
          message: 'Read personal',
          type: 'personal',
          userId: testUser.id,
          createdBy: teacherUser.id,
          isRead: true
        }
      ]);
    });

    it('should get notification statistics', async () => {
      const response = await request(app)
        .get('/api/notifications/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('unread');
      expect(response.body).toHaveProperty('byType');
      expect(typeof response.body.total).toBe('number');
      expect(typeof response.body.unread).toBe('number');
      expect(typeof response.body.byType).toBe('object');
    });
  });
});