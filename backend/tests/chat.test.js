const io = require('socket.io-client');
const jwt = require('jsonwebtoken');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { User, Class, ChatMessage } = require('../models');

// Import chat controller
const chatController = require('../controllers/chatController');

describe('Chat Socket.IO APIs', () => {
  let server, ioServer, clientSocket1, clientSocket2;
  let testUser1, testUser2, testClass, authToken1, authToken2;

  beforeAll(async () => {
    // Create test users
    testUser1 = await User.create({
      id: 995,
      name: 'Test User 1',
      email: 'user1@example.com',
      password_hash: 'hashedpassword',
      role: 'student'
    });

    testUser2 = await User.create({
      id: 994,
      name: 'Test User 2',
      email: 'user2@example.com',
      password_hash: 'hashedpassword',
      role: 'student'
    });

    // Create test class
    testClass = await Class.create({
      id: 995,
      name: 'Chat Test Class',
      grade: 10,
      description: 'Test Description',
      teacherId: testUser1.id
    });

    // Generate auth tokens
    authToken1 = jwt.sign(
      { userId: testUser1.id, role: testUser1.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    authToken2 = jwt.sign(
      { userId: testUser2.id, role: testUser2.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create HTTP server and Socket.IO server
    server = createServer();
    ioServer = new Server(server);
    
    // Initialize chat controller
    chatController(ioServer);

    // Start server
    await new Promise((resolve) => {
      server.listen(3001, resolve);
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await ChatMessage.destroy({ where: { userId: [testUser1.id, testUser2.id] }, force: true });
    await Class.destroy({ where: { id: testClass.id }, force: true });
    await User.destroy({ where: { id: [testUser1.id, testUser2.id] }, force: true });

    // Close connections
    if (clientSocket1) clientSocket1.close();
    if (clientSocket2) clientSocket2.close();
    ioServer.close();
    server.close();
  });

  beforeEach(() => {
    // Create client sockets for each test
    clientSocket1 = io('http://localhost:3001', {
      auth: { token: authToken1 }
    });

    clientSocket2 = io('http://localhost:3001', {
      auth: { token: authToken2 }
    });
  });

  afterEach(() => {
    // Clean up client sockets after each test
    if (clientSocket1) clientSocket1.close();
    if (clientSocket2) clientSocket2.close();
  });

  describe('Socket Connection', () => {
    it('should authenticate and connect successfully', (done) => {
      clientSocket1.on('connect', () => {
        expect(clientSocket1.connected).toBe(true);
        done();
      });

      clientSocket1.on('connect_error', (error) => {
        done(error);
      });
    });

    it('should reject connection with invalid token', (done) => {
      const invalidClient = io('http://localhost:3001', {
        auth: { token: 'invalid-token' }
      });

      invalidClient.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication error');
        invalidClient.close();
        done();
      });

      invalidClient.on('connect', () => {
        invalidClient.close();
        done(new Error('Should not connect with invalid token'));
      });
    });
  });

  describe('Join Class Room', () => {
    it('should join class room successfully', (done) => {
      clientSocket1.on('connect', () => {
        clientSocket1.emit('join_class', { classId: testClass.id });
      });

      clientSocket1.on('joined_class', (data) => {
        expect(data.classId).toBe(testClass.id);
        expect(data.message).toContain('joined');
        done();
      });

      clientSocket1.on('error', (error) => {
        done(error);
      });
    });

    it('should receive user joined notification', (done) => {
      let user1Joined = false;

      clientSocket2.on('connect', () => {
        clientSocket2.emit('join_class', { classId: testClass.id });
      });

      clientSocket2.on('joined_class', () => {
        if (!user1Joined) {
          clientSocket1.emit('join_class', { classId: testClass.id });
          user1Joined = true;
        }
      });

      clientSocket2.on('user_joined', (data) => {
        expect(data.userId).toBe(testUser1.id);
        expect(data.userName).toBe(testUser1.name);
        done();
      });
    });
  });

  describe('Send Message', () => {
    beforeEach((done) => {
      // Join both users to the class
      let joinedCount = 0;
      
      const checkBothJoined = () => {
        joinedCount++;
        if (joinedCount === 2) done();
      };

      clientSocket1.on('connect', () => {
        clientSocket1.emit('join_class', { classId: testClass.id });
      });

      clientSocket2.on('connect', () => {
        clientSocket2.emit('join_class', { classId: testClass.id });
      });

      clientSocket1.on('joined_class', checkBothJoined);
      clientSocket2.on('joined_class', checkBothJoined);
    });

    it('should send and receive text message', (done) => {
      const messageData = {
        classId: testClass.id,
        content: 'Hello, this is a test message!',
        type: 'text'
      };

      clientSocket2.on('new_message', (data) => {
        expect(data.content).toBe(messageData.content);
        expect(data.type).toBe(messageData.type);
        expect(data.userId).toBe(testUser1.id);
        expect(data.classId).toBe(testClass.id);
        done();
      });

      clientSocket1.emit('send_message', messageData);
    });

    it('should save message to database', (done) => {
      const messageData = {
        classId: testClass.id,
        content: 'Database test message',
        type: 'text'
      };

      clientSocket1.on('message_sent', async (data) => {
        try {
          const savedMessage = await ChatMessage.findByPk(data.id);
          expect(savedMessage).toBeTruthy();
          expect(savedMessage.content).toBe(messageData.content);
          expect(savedMessage.userId).toBe(testUser1.id);
          done();
        } catch (error) {
          done(error);
        }
      });

      clientSocket1.emit('send_message', messageData);
    });
  });

  describe('Message Reactions', () => {
    let testMessage;

    beforeEach(async () => {
      // Create a test message
      testMessage = await ChatMessage.create({
        content: 'Message for reaction test',
        type: 'text',
        userId: testUser1.id,
        classId: testClass.id
      });

      // Join both users to the class
      await new Promise((resolve) => {
        let joinedCount = 0;
        
        const checkBothJoined = () => {
          joinedCount++;
          if (joinedCount === 2) resolve();
        };

        clientSocket1.on('connect', () => {
          clientSocket1.emit('join_class', { classId: testClass.id });
        });

        clientSocket2.on('connect', () => {
          clientSocket2.emit('join_class', { classId: testClass.id });
        });

        clientSocket1.on('joined_class', checkBothJoined);
        clientSocket2.on('joined_class', checkBothJoined);
      });
    });

    it('should add reaction to message', (done) => {
      const reactionData = {
        messageId: testMessage.id,
        emoji: '👍'
      };

      clientSocket2.on('message_reaction', (data) => {
        expect(data.messageId).toBe(testMessage.id);
        expect(data.emoji).toBe(reactionData.emoji);
        expect(data.userId).toBe(testUser1.id);
        done();
      });

      clientSocket1.emit('add_reaction', reactionData);
    });
  });

  describe('Typing Indicators', () => {
    beforeEach((done) => {
      // Join both users to the class
      let joinedCount = 0;
      
      const checkBothJoined = () => {
        joinedCount++;
        if (joinedCount === 2) done();
      };

      clientSocket1.on('connect', () => {
        clientSocket1.emit('join_class', { classId: testClass.id });
      });

      clientSocket2.on('connect', () => {
        clientSocket2.emit('join_class', { classId: testClass.id });
      });

      clientSocket1.on('joined_class', checkBothJoined);
      clientSocket2.on('joined_class', checkBothJoined);
    });

    it('should broadcast typing indicator', (done) => {
      clientSocket2.on('user_typing', (data) => {
        expect(data.userId).toBe(testUser1.id);
        expect(data.userName).toBe(testUser1.name);
        expect(data.classId).toBe(testClass.id);
        done();
      });

      clientSocket1.emit('typing', { classId: testClass.id });
    });

    it('should broadcast stop typing indicator', (done) => {
      clientSocket2.on('user_stop_typing', (data) => {
        expect(data.userId).toBe(testUser1.id);
        expect(data.classId).toBe(testClass.id);
        done();
      });

      clientSocket1.emit('stop_typing', { classId: testClass.id });
    });
  });

  describe('Message History', () => {
    beforeEach(async () => {
      // Create test messages
      await ChatMessage.bulkCreate([
        {
          content: 'History message 1',
          type: 'text',
          userId: testUser1.id,
          classId: testClass.id,
          createdAt: new Date(Date.now() - 60000) // 1 minute ago
        },
        {
          content: 'History message 2',
          type: 'text',
          userId: testUser2.id,
          classId: testClass.id,
          createdAt: new Date(Date.now() - 30000) // 30 seconds ago
        }
      ]);

      // Join user to class
      await new Promise((resolve) => {
        clientSocket1.on('connect', () => {
          clientSocket1.emit('join_class', { classId: testClass.id });
        });

        clientSocket1.on('joined_class', resolve);
      });
    });

    it('should get message history', (done) => {
      clientSocket1.on('message_history', (data) => {
        expect(Array.isArray(data.messages)).toBe(true);
        expect(data.messages.length).toBeGreaterThan(0);
        expect(data.messages[0]).toHaveProperty('content');
        expect(data.messages[0]).toHaveProperty('user');
        done();
      });

      clientSocket1.emit('get_history', { 
        classId: testClass.id,
        limit: 50,
        offset: 0
      });
    });
  });

  describe('Leave Class Room', () => {
    beforeEach((done) => {
      // Join both users to the class
      let joinedCount = 0;
      
      const checkBothJoined = () => {
        joinedCount++;
        if (joinedCount === 2) done();
      };

      clientSocket1.on('connect', () => {
        clientSocket1.emit('join_class', { classId: testClass.id });
      });

      clientSocket2.on('connect', () => {
        clientSocket2.emit('join_class', { classId: testClass.id });
      });

      clientSocket1.on('joined_class', checkBothJoined);
      clientSocket2.on('joined_class', checkBothJoined);
    });

    it('should leave class room and notify others', (done) => {
      clientSocket2.on('user_left', (data) => {
        expect(data.userId).toBe(testUser1.id);
        expect(data.userName).toBe(testUser1.name);
        done();
      });

      clientSocket1.emit('leave_class', { classId: testClass.id });
    });
  });
});