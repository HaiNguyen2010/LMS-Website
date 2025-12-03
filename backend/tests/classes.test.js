const request = require('supertest');
const express = require('express');
const { Op } = require('sequelize');
const classRoutes = require('../routes/classes');
const { Class, User } = require('../models');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/classes', classRoutes);

describe('Class APIs', () => {
  let testClass, testUser, teacherUser, adminUser;

  beforeEach(() => {
    jest.clearAllMocks();
    
    testUser = {
      id: 1,
      name: 'Test Student',
      email: 'student@example.com',
      role: 'student'
    };

    teacherUser = {
      id: 2,
      name: 'Test Teacher',
      email: 'teacher@example.com',
      role: 'teacher'
    };

    adminUser = {
      id: 3,
      name: 'Test Admin',
      email: 'admin@example.com',
      role: 'admin'
    };

    testClass = {
      id: 1,
      name: 'Mathematics 10A',
      code: '2024-2025',
      description: 'Advanced Mathematics Class',
      teacherId: teacherUser.id,
      maxStudents: 30,
      currentStudents: 15,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  describe('GET /api/classes', () => {
    it('should get all classes', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const classes = [testClass];
      
      Class.findAll.mockResolvedValue(classes);

      const response = await request(app)
        .get('/api/classes')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe(testClass.name);
    });

    it('should filter classes by search', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      Class.findAll.mockResolvedValue([testClass]);

      await request(app)
        .get('/api/classes?search=Math')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Class.findAll).toHaveBeenCalledWith({
        where: { name: { [Op.like]: '%Math%' } },
        include: expect.any(Array),
        limit: 50,
        offset: 0
      });
    });

    it('should filter classes by teacher', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      Class.findAll.mockResolvedValue([testClass]);

      await request(app)
        .get(`/api/classes?teacherId=${teacherUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Class.findAll).toHaveBeenCalledWith({
        where: { teacherId: teacherUser.id },
        include: expect.any(Array),
        limit: 50,
        offset: 0
      });
    });

    it('should support pagination', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      Class.findAll.mockResolvedValue([testClass]);

      await request(app)
        .get('/api/classes?page=2&limit=20')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Class.findAll).toHaveBeenCalledWith({
        include: expect.any(Array),
        limit: 20,
        offset: 20
      });
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/classes')
        .expect(401);
    });
  });

  describe('GET /api/classes/:id', () => {
    it('should get class by id', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      Class.findByPk.mockResolvedValue(testClass);

      const response = await request(app)
        .get(`/api/classes/${testClass.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.id).toBe(testClass.id);
      expect(response.body.name).toBe(testClass.name);
    });

    it('should return 404 for non-existent class', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      Class.findByPk.mockResolvedValue(null);

      await request(app)
        .get('/api/classes/999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('should include teacher and students information', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const classWithDetails = {
        ...testClass,
        teacher: teacherUser,
        students: [testUser]
      };
      
      Class.findByPk.mockResolvedValue(classWithDetails);

      const response = await request(app)
        .get(`/api/classes/${testClass.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('teacher');
      expect(response.body).toHaveProperty('students');
    });
  });

  describe('POST /api/classes', () => {
    it('should create new class as admin', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      const newClassData = {
        name: 'Physics 11B',
        code: '2024-2025',
        description: 'Physics class for grade 11',
        teacherId: teacherUser.id,
        maxStudents: 25
      };

      Class.findOne.mockResolvedValue(null); // Name doesn't exist
      User.findByPk.mockResolvedValue(teacherUser); // Teacher exists
      Class.create.mockResolvedValue({
        id: 2,
        ...newClassData
      });

      const response = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${token}`)
        .send(newClassData)
        .expect(201);

      expect(response.body.name).toBe(newClassData.name);
      expect(response.body.code).toBe(newClassData.code);
    });

    it('should create new class as teacher for themselves', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const newClassData = {
        name: 'Chemistry 12A',
        code: '2024-2025',
        description: 'Chemistry advanced class',
        teacherId: teacherUser.id,
        maxStudents: 20
      };

      Class.findOne.mockResolvedValue(null);
      User.findByPk.mockResolvedValue(teacherUser);
      Class.create.mockResolvedValue({
        id: 3,
        ...newClassData
      });

      const response = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${token}`)
        .send(newClassData)
        .expect(201);

      expect(response.body.name).toBe(newClassData.name);
    });

    it('should return 403 when teacher tries to assign another teacher', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const newClassData = {
        name: 'Biology 10C',
        code: '2024-2025',
        teacherId: 999, // Different teacher
        maxStudents: 30
      };

      await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${token}`)
        .send(newClassData)
        .expect(403);
    });

    it('should return 403 for student users', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const newClassData = {
        name: 'Test Class',
        code: '2024-2025',
        teacherId: teacherUser.id
      };

      await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${token}`)
        .send(newClassData)
        .expect(403);
    });

    it('should return 400 if class name already exists', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      const duplicateClassData = {
        name: 'Mathematics 10A', // Existing name
        code: '2024-2025',
        teacherId: teacherUser.id
      };

      Class.findOne.mockResolvedValue(testClass); // Name exists

      await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${token}`)
        .send(duplicateClassData)
        .expect(400);
    });

    it('should return 400 if teacher does not exist', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      const invalidClassData = {
        name: 'Invalid Class',
        code: '2024-2025',
        teacherId: 999 // Non-existent teacher
      };

      Class.findOne.mockResolvedValue(null);
      User.findByPk.mockResolvedValue(null); // Teacher doesn't exist

      await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidClassData)
        .expect(400);
    });

    it('should validate required fields', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      const invalidData = {
        code: '2024-2025'
        // Missing name, teacherId
      };

      await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('PUT /api/classes/:id', () => {
    it('should update class as admin', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      const updateData = {
        name: 'Advanced Mathematics 10A',
        description: 'Updated description',
        maxStudents: 35
      };

      Class.findByPk.mockResolvedValue(testClass);
      Class.findOne.mockResolvedValue(null); // Name not taken
      Class.update.mockResolvedValue([1]);
      
      const updatedClass = { ...testClass, ...updateData };
      Class.findByPk.mockResolvedValueOnce(updatedClass);

      const response = await request(app)
        .put(`/api/classes/${testClass.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.maxStudents).toBe(updateData.maxStudents);
    });

    it('should allow teacher to update their own class', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const updateData = {
        description: 'Updated by teacher',
        maxStudents: 28
      };

      Class.findByPk.mockResolvedValue(testClass);
      Class.update.mockResolvedValue([1]);
      
      const updatedClass = { ...testClass, ...updateData };
      Class.findByPk.mockResolvedValueOnce(updatedClass);

      const response = await request(app)
        .put(`/api/classes/${testClass.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.description).toBe(updateData.description);
    });

    it('should return 403 when teacher tries to update another teacher\'s class', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const anotherTeachersClass = {
        ...testClass,
        teacherId: 999 // Different teacher
      };
      
      Class.findByPk.mockResolvedValue(anotherTeachersClass);

      await request(app)
        .put(`/api/classes/${testClass.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Unauthorized update' })
        .expect(403);
    });

    it('should return 403 for student users', async () => {
      const token = generateTestToken(testUser.id, testUser.role);

      await request(app)
        .put(`/api/classes/${testClass.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Student update' })
        .expect(403);
    });

    it('should return 404 for non-existent class', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      Class.findByPk.mockResolvedValue(null);

      await request(app)
        .put('/api/classes/999')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Class' })
        .expect(404);
    });
  });

  describe('DELETE /api/classes/:id', () => {
    it('should delete class as admin', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      Class.findByPk.mockResolvedValue(testClass);
      Class.destroy.mockResolvedValue(1);

      const response = await request(app)
        .delete(`/api/classes/${testClass.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('xóa thành công');
    });

    it('should allow teacher to delete their own class', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      Class.findByPk.mockResolvedValue(testClass);
      Class.destroy.mockResolvedValue(1);

      const response = await request(app)
        .delete(`/api/classes/${testClass.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 403 when teacher tries to delete another teacher\'s class', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const anotherTeachersClass = {
        ...testClass,
        teacherId: 999
      };
      
      Class.findByPk.mockResolvedValue(anotherTeachersClass);

      await request(app)
        .delete(`/api/classes/${testClass.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should return 403 for student users', async () => {
      const token = generateTestToken(testUser.id, testUser.role);

      await request(app)
        .delete(`/api/classes/${testClass.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('POST /api/classes/:id/enroll', () => {
    it('should enroll student in class', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const classWithSpace = {
        ...testClass,
        currentStudents: 10 // Below max
      };

      Class.findByPk.mockResolvedValue(classWithSpace);
      // Mock StudentEnrollment model
      const StudentEnrollment = {
        findOne: jest.fn().mockResolvedValue(null), // Not enrolled
        create: jest.fn().mockResolvedValue({
          studentId: testUser.id,
          classId: testClass.id
        })
      };

      const response = await request(app)
        .post(`/api/classes/${testClass.id}/enroll`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('thành công');
    });

    it('should return 400 if class is full', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const fullClass = {
        ...testClass,
        currentStudents: 30 // At max capacity
      };

      Class.findByPk.mockResolvedValue(fullClass);

      await request(app)
        .post(`/api/classes/${testClass.id}/enroll`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });

    it('should return 400 if already enrolled', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      Class.findByPk.mockResolvedValue(testClass);
      
      // Mock existing enrollment
      const StudentEnrollment = {
        findOne: jest.fn().mockResolvedValue({
          studentId: testUser.id,
          classId: testClass.id
        })
      };

      await request(app)
        .post(`/api/classes/${testClass.id}/enroll`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });

    it('should return 403 for non-student users', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);

      await request(app)
        .post(`/api/classes/${testClass.id}/enroll`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('DELETE /api/classes/:id/enroll', () => {
    it('should unenroll student from class', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      Class.findByPk.mockResolvedValue(testClass);
      
      // Mock existing enrollment
      const StudentEnrollment = {
        findOne: jest.fn().mockResolvedValue({
          studentId: testUser.id,
          classId: testClass.id
        }),
        destroy: jest.fn().mockResolvedValue(1)
      };

      const response = await request(app)
        .delete(`/api/classes/${testClass.id}/enroll`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('thành công');
    });

    it('should return 400 if not enrolled', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      Class.findByPk.mockResolvedValue(testClass);
      
      // Mock no enrollment
      const StudentEnrollment = {
        findOne: jest.fn().mockResolvedValue(null)
      };

      await request(app)
        .delete(`/api/classes/${testClass.id}/enroll`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });

  describe('GET /api/classes/:id/students', () => {
    it('should get class students as teacher or admin', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const classWithStudents = {
        ...testClass,
        students: [testUser]
      };
      
      Class.findByPk.mockResolvedValue(classWithStudents);

      const response = await request(app)
        .get(`/api/classes/${testClass.id}/students`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
    });

    it('should return 403 for student users', async () => {
      const token = generateTestToken(testUser.id, testUser.role);

      await request(app)
        .get(`/api/classes/${testClass.id}/students`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('GET /api/classes/my-classes', () => {
    it('should get student\'s enrolled classes', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      Class.findAll.mockResolvedValue([testClass]);

      const response = await request(app)
        .get('/api/classes/my-classes')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
    });

    it('should get teacher\'s assigned classes', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      Class.findAll.mockResolvedValue([testClass]);

      const response = await request(app)
        .get('/api/classes/my-classes')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(Class.findAll).toHaveBeenCalledWith({
        where: { teacherId: teacherUser.id },
        include: expect.any(Array)
      });
    });
  });

  describe('GET /api/classes/stats', () => {
    it('should get class statistics as admin', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      
      Class.count = jest.fn()
        .mockResolvedValueOnce(50) // total classes
        .mockResolvedValueOnce(45); // active classes

      const response = await request(app)
        .get('/api/classes/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('active');
      expect(response.body).toHaveProperty('bycode');
    });

    it('should return 403 for non-admin users', async () => {
      const token = generateTestToken(testUser.id, testUser.role);

      await request(app)
        .get('/api/classes/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });
});
