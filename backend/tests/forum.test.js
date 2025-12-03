const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const forumRoutes = require('../routes/forumRoutes');
const { User, Class, ForumPost, ForumComment, ForumLike } = require('../models');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/forum', forumRoutes);

describe('Forum APIs', () => {
  let testUser, testClass, testPost, authToken;

  beforeAll(async () => {
    // Create test user
    testUser = await User.create({
      id: 999,
      name: 'Test User',
      email: 'test@example.com',
      password_hash: 'hashedpassword',
      role: 'student'
    });

    // Create test class
    testClass = await Class.create({
      id: 999,
      name: 'Test Class',
      grade: 10,
      description: 'Test Description',
      teacherId: testUser.id
    });

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser.id, role: testUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Cleanup test data
    await ForumLike.destroy({ where: { userId: testUser.id }, force: true });
    await ForumComment.destroy({ where: { userId: testUser.id }, force: true });
    await ForumPost.destroy({ where: { userId: testUser.id }, force: true });
    await Class.destroy({ where: { id: testClass.id }, force: true });
    await User.destroy({ where: { id: testUser.id }, force: true });
  });

  describe('POST /api/forum/posts', () => {
    it('should create a new forum post', async () => {
      const postData = {
        title: 'Test Post',
        content: 'This is a test post content',
        classId: testClass.id,
        tags: ['test', 'unit-test']
      };

      const response = await request(app)
        .post('/api/forum/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(postData.title);
      expect(response.body.content).toBe(postData.content);
      expect(response.body.userId).toBe(testUser.id);
      expect(response.body.classId).toBe(testClass.id);

      testPost = response.body;
    });

    it('should return 400 for invalid post data', async () => {
      const invalidData = {
        content: 'Missing title'
        // title is required
      };

      await request(app)
        .post('/api/forum/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      const postData = {
        title: 'Test Post',
        content: 'This is a test post content',
        classId: testClass.id
      };

      await request(app)
        .post('/api/forum/posts')
        .send(postData)
        .expect(401);
    });
  });

  describe('GET /api/forum/posts', () => {
    it('should get all forum posts', async () => {
      const response = await request(app)
        .get('/api/forum/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).toHaveProperty('content');
    });

    it('should filter posts by classId', async () => {
      const response = await request(app)
        .get(`/api/forum/posts?classId=${testClass.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(post => {
        expect(post.classId).toBe(testClass.id);
      });
    });
  });

  describe('GET /api/forum/posts/:id', () => {
    it('should get a specific forum post', async () => {
      const response = await request(app)
        .get(`/api/forum/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(testPost.id);
      expect(response.body.title).toBe(testPost.title);
      expect(response.body.content).toBe(testPost.content);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('class');
    });

    it('should return 404 for non-existent post', async () => {
      await request(app)
        .get('/api/forum/posts/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/forum/posts/:id', () => {
    it('should update a forum post', async () => {
      const updateData = {
        title: 'Updated Test Post',
        content: 'Updated content',
        tags: ['updated', 'test']
      };

      const response = await request(app)
        .put(`/api/forum/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.content).toBe(updateData.content);
    });

    it('should return 403 when updating other user\'s post', async () => {
      // Create another user
      const otherUser = await User.create({
        id: 998,
        name: 'Other User',
        email: 'other@example.com',
        password_hash: 'hashedpassword',
        role: 'student'
      });

      const otherToken = jwt.sign(
        { userId: otherUser.id, role: otherUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const updateData = {
        title: 'Unauthorized Update',
        content: 'Should not work'
      };

      await request(app)
        .put(`/api/forum/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send(updateData)
        .expect(403);

      // Cleanup
      await User.destroy({ where: { id: otherUser.id }, force: true });
    });
  });

  describe('POST /api/forum/posts/:id/like', () => {
    it('should like a forum post', async () => {
      const response = await request(app)
        .post(`/api/forum/posts/${testPost.id}/like`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'like' })
        .expect(200);

      expect(response.body.message).toContain('liked');
    });

    it('should unlike a forum post when liked again', async () => {
      const response = await request(app)
        .post(`/api/forum/posts/${testPost.id}/like`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'like' })
        .expect(200);

      expect(response.body.message).toContain('removed');
    });
  });

  describe('POST /api/forum/posts/:id/comments', () => {
    let testComment;

    it('should create a comment on a post', async () => {
      const commentData = {
        content: 'This is a test comment'
      };

      const response = await request(app)
        .post(`/api/forum/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData)
        .expect(201);

      expect(response.body.content).toBe(commentData.content);
      expect(response.body.postId).toBe(testPost.id);
      expect(response.body.userId).toBe(testUser.id);

      testComment = response.body;
    });

    it('should create a reply to a comment', async () => {
      const replyData = {
        content: 'This is a reply to the comment',
        parentId: testComment.id
      };

      const response = await request(app)
        .post(`/api/forum/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(replyData)
        .expect(201);

      expect(response.body.content).toBe(replyData.content);
      expect(response.body.parentId).toBe(testComment.id);
    });
  });

  describe('GET /api/forum/posts/:id/comments', () => {
    it('should get comments for a post', async () => {
      const response = await request(app)
        .get(`/api/forum/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('content');
      expect(response.body[0]).toHaveProperty('user');
    });
  });

  describe('DELETE /api/forum/posts/:id', () => {
    it('should delete a forum post', async () => {
      await request(app)
        .delete(`/api/forum/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify post is deleted
      await request(app)
        .get(`/api/forum/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});