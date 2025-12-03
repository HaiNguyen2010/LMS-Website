const { User, Class, ForumPost, ForumComment, ForumLike, Notification, ChatMessage } = require('../models');

describe('Models', () => {
  let testUser, testClass;

  beforeAll(async () => {
    // Create test user and class for model tests
    testUser = await User.create({
      id: 993,
      name: 'Model Test User',
      email: 'modeltest@example.com',
      password_hash: 'hashedpassword',
      role: 'student'
    });

    testClass = await Class.create({
      id: 993,
      name: 'Model Test Class',
      grade: 10,
      description: 'Test Description',
      teacherId: testUser.id
    });
  });

  afterAll(async () => {
    // Cleanup
    await ForumLike.destroy({ where: { userId: testUser.id }, force: true });
    await ForumComment.destroy({ where: { userId: testUser.id }, force: true });
    await ForumPost.destroy({ where: { userId: testUser.id }, force: true });
    await ChatMessage.destroy({ where: { userId: testUser.id }, force: true });
    await Notification.destroy({ where: { userId: testUser.id }, force: true });
    await Class.destroy({ where: { id: testClass.id }, force: true });
    await User.destroy({ where: { id: testUser.id }, force: true });
  });

  describe('ForumPost Model', () => {
    let testPost;

    it('should create a forum post with required fields', async () => {
      testPost = await ForumPost.create({
        title: 'Test Post Title',
        content: 'Test post content',
        userId: testUser.id,
        classId: testClass.id,
        tags: ['test', 'model'],
        viewCount: 0,
        likeCount: 0,
        commentCount: 0
      });

      expect(testPost.id).toBeDefined();
      expect(testPost.title).toBe('Test Post Title');
      expect(testPost.content).toBe('Test post content');
      expect(testPost.userId).toBe(testUser.id);
      expect(testPost.classId).toBe(testClass.id);
      expect(testPost.tags).toEqual(['test', 'model']);
      expect(testPost.isPinned).toBe(false);
      expect(testPost.isLocked).toBe(false);
    });

    it('should validate required fields', async () => {
      try {
        await ForumPost.create({
          content: 'Missing title',
          userId: testUser.id,
          classId: testClass.id
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('SequelizeValidationError');
      }
    });

    it('should have incrementViewCount instance method', async () => {
      const initialViewCount = testPost.viewCount;
      await testPost.incrementViewCount();
      await testPost.reload();
      
      expect(testPost.viewCount).toBe(initialViewCount + 1);
    });

    it('should have incrementLikeCount instance method', async () => {
      const initialLikeCount = testPost.likeCount;
      await testPost.incrementLikeCount();
      await testPost.reload();
      
      expect(testPost.likeCount).toBe(initialLikeCount + 1);
    });

    it('should have decrementLikeCount instance method', async () => {
      const initialLikeCount = testPost.likeCount;
      await testPost.decrementLikeCount();
      await testPost.reload();
      
      expect(testPost.likeCount).toBe(initialLikeCount - 1);
    });

    it('should have getPopularPosts class method', async () => {
      const popularPosts = await ForumPost.getPopularPosts(testClass.id, 10);
      expect(Array.isArray(popularPosts)).toBe(true);
    });

    it('should have getRecentPosts class method', async () => {
      const recentPosts = await ForumPost.getRecentPosts(testClass.id, 10);
      expect(Array.isArray(recentPosts)).toBe(true);
    });
  });

  describe('ForumComment Model', () => {
    let testPost, testComment;

    beforeAll(async () => {
      testPost = await ForumPost.create({
        title: 'Comment Test Post',
        content: 'Post for comment testing',
        userId: testUser.id,
        classId: testClass.id
      });
    });

    it('should create a forum comment', async () => {
      testComment = await ForumComment.create({
        content: 'Test comment content',
        postId: testPost.id,
        userId: testUser.id
      });

      expect(testComment.id).toBeDefined();
      expect(testComment.content).toBe('Test comment content');
      expect(testComment.postId).toBe(testPost.id);
      expect(testComment.userId).toBe(testUser.id);
      expect(testComment.parentId).toBeNull();
      expect(testComment.isEdited).toBe(false);
    });

    it('should create a reply to a comment', async () => {
      const reply = await ForumComment.create({
        content: 'Reply to comment',
        postId: testPost.id,
        userId: testUser.id,
        parentId: testComment.id
      });

      expect(reply.parentId).toBe(testComment.id);
    });

    it('should validate required fields', async () => {
      try {
        await ForumComment.create({
          postId: testPost.id,
          userId: testUser.id
          // Missing content
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('SequelizeValidationError');
      }
    });

    it('should support soft delete', async () => {
      const commentToDelete = await ForumComment.create({
        content: 'Comment to delete',
        postId: testPost.id,
        userId: testUser.id
      });

      await commentToDelete.destroy();
      
      // Should be soft deleted
      const deletedComment = await ForumComment.findByPk(commentToDelete.id, { paranoid: false });
      expect(deletedComment.deletedAt).toBeTruthy();
      
      // Should not appear in normal queries
      const normalQuery = await ForumComment.findByPk(commentToDelete.id);
      expect(normalQuery).toBeNull();
    });
  });

  describe('ForumLike Model', () => {
    let testPost;

    beforeAll(async () => {
      testPost = await ForumPost.create({
        title: 'Like Test Post',
        content: 'Post for like testing',
        userId: testUser.id,
        classId: testClass.id
      });
    });

    it('should create a forum like', async () => {
      const like = await ForumLike.create({
        userId: testUser.id,
        postId: testPost.id,
        type: 'like'
      });

      expect(like.id).toBeDefined();
      expect(like.userId).toBe(testUser.id);
      expect(like.postId).toBe(testPost.id);
      expect(like.type).toBe('like');
    });

    it('should validate like type', async () => {
      try {
        await ForumLike.create({
          userId: testUser.id,
          postId: testPost.id,
          type: 'invalid_type'
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('SequelizeValidationError');
      }
    });

    it('should prevent duplicate likes from same user', async () => {
      try {
        await ForumLike.create({
          userId: testUser.id,
          postId: testPost.id,
          type: 'love'
        });
        fail('Should have thrown unique constraint error');
      } catch (error) {
        expect(error.name).toBe('SequelizeUniqueConstraintError');
      }
    });
  });

  describe('Notification Model', () => {
    it('should create a notification', async () => {
      const notification = await Notification.create({
        title: 'Test Notification',
        message: 'Test notification message',
        type: 'announcement',
        userId: testUser.id,
        createdBy: testUser.id,
        priority: 'medium',
        isRead: false
      });

      expect(notification.id).toBeDefined();
      expect(notification.title).toBe('Test Notification');
      expect(notification.message).toBe('Test notification message');
      expect(notification.type).toBe('announcement');
      expect(notification.priority).toBe('medium');
      expect(notification.isRead).toBe(false);
    });

    it('should validate notification type', async () => {
      try {
        await Notification.create({
          title: 'Invalid Type',
          message: 'Message',
          type: 'invalid_type',
          userId: testUser.id,
          createdBy: testUser.id
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('SequelizeValidationError');
      }
    });

    it('should validate priority level', async () => {
      try {
        await Notification.create({
          title: 'Invalid Priority',
          message: 'Message',
          type: 'announcement',
          userId: testUser.id,
          createdBy: testUser.id,
          priority: 'invalid_priority'
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('SequelizeValidationError');
      }
    });
  });

  describe('ChatMessage Model', () => {
    it('should create a chat message', async () => {
      const message = await ChatMessage.create({
        content: 'Test chat message',
        type: 'text',
        userId: testUser.id,
        classId: testClass.id
      });

      expect(message.id).toBeDefined();
      expect(message.content).toBe('Test chat message');
      expect(message.type).toBe('text');
      expect(message.userId).toBe(testUser.id);
      expect(message.classId).toBe(testClass.id);
      expect(message.reactions).toEqual({});
      expect(message.readBy).toEqual([]);
    });

    it('should validate message type', async () => {
      try {
        await ChatMessage.create({
          content: 'Invalid type message',
          type: 'invalid_type',
          userId: testUser.id,
          classId: testClass.id
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('SequelizeValidationError');
      }
    });

    it('should create a reply message', async () => {
      const originalMessage = await ChatMessage.create({
        content: 'Original message',
        type: 'text',
        userId: testUser.id,
        classId: testClass.id
      });

      const reply = await ChatMessage.create({
        content: 'Reply message',
        type: 'text',
        userId: testUser.id,
        classId: testClass.id,
        replyToId: originalMessage.id
      });

      expect(reply.replyToId).toBe(originalMessage.id);
    });

    it('should support soft delete', async () => {
      const messageToDelete = await ChatMessage.create({
        content: 'Message to delete',
        type: 'text',
        userId: testUser.id,
        classId: testClass.id
      });

      await messageToDelete.destroy();
      
      // Should be soft deleted
      const deletedMessage = await ChatMessage.findByPk(messageToDelete.id, { paranoid: false });
      expect(deletedMessage.deletedAt).toBeTruthy();
      
      // Should not appear in normal queries
      const normalQuery = await ChatMessage.findByPk(messageToDelete.id);
      expect(normalQuery).toBeNull();
    });
  });

  describe('Model Associations', () => {
    let testPost, testComment;

    beforeAll(async () => {
      testPost = await ForumPost.create({
        title: 'Association Test Post',
        content: 'Post for association testing',
        userId: testUser.id,
        classId: testClass.id
      });

      testComment = await ForumComment.create({
        content: 'Association test comment',
        postId: testPost.id,
        userId: testUser.id
      });
    });

    it('should load post with user association', async () => {
      const postWithUser = await ForumPost.findByPk(testPost.id, {
        include: [{ model: User, as: 'user' }]
      });

      expect(postWithUser.user).toBeDefined();
      expect(postWithUser.user.name).toBe(testUser.name);
    });

    it('should load post with class association', async () => {
      const postWithClass = await ForumPost.findByPk(testPost.id, {
        include: [{ model: Class, as: 'class' }]
      });

      expect(postWithClass.class).toBeDefined();
      expect(postWithClass.class.name).toBe(testClass.name);
    });

    it('should load post with comments association', async () => {
      const postWithComments = await ForumPost.findByPk(testPost.id, {
        include: [{ model: ForumComment, as: 'comments' }]
      });

      expect(postWithComments.comments).toBeDefined();
      expect(Array.isArray(postWithComments.comments)).toBe(true);
      expect(postWithComments.comments.length).toBeGreaterThan(0);
    });

    it('should load comment with user association', async () => {
      const commentWithUser = await ForumComment.findByPk(testComment.id, {
        include: [{ model: User, as: 'user' }]
      });

      expect(commentWithUser.user).toBeDefined();
      expect(commentWithUser.user.name).toBe(testUser.name);
    });
  });
});