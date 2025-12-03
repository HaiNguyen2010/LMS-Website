const request = require('supertest');
const express = require('express');
const subjectRoutes = require('../routes/subjects');
const { Subject, User, Class } = require('../models');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/subjects', subjectRoutes);

describe('Subject APIs', () => {
  let testSubject, testUser, teacherUser, adminUser, testClass;

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
      teacherId: teacherUser.id
    };

    testSubject = {
      id: 1,
      name: 'Advanced Mathematics',
      code: 'MATH-ADV-10',
      description: 'Advanced mathematics for grade 10',
      code: '2024-2025',
      credits: 3,
      isActive: true,
      createdBy: adminUser.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  describe('GET /api/subjects', () => {
    it('should get all subjects', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const subjects = [testSubject];
      
      Subject.findAll.mockResolvedValue(subjects);

      const response = await request(app)
        .get('/api/subjects')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe(testSubject.name);
    });

    it('should filter subjects by code', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      Subject.findAll.mockResolvedValue([testSubject]);

      await request(app)
        .get('/api/subjects?code=2024-2025')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Subject.findAll).toHaveBeenCalledWith({
        where: { code: '2024-2025', isActive: true },
        include: expect.any(Array),
        limit: 50,
        offset: 0
      });
    });

    it('should filter subjects by active status', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      Subject.findAll.mockResolvedValue([testSubject]);

      await request(app)
        .get('/api/subjects?isActive=false')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Subject.findAll).toHaveBeenCalledWith({
        where: { isActive: false },
        include: expect.any(Array),
        limit: 50,
        offset: 0
      });
    });

    it('should search subjects by name or code', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      Subject.findAll.mockResolvedValue([testSubject]);

      await request(app)
        .get('/api/subjects?search=math')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Subject.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            [expect.any(Symbol)]: expect.any(Object) // Op.or condition
          })
        })
      );
    });

    it('should support pagination', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      Subject.findAll.mockResolvedValue([testSubject]);

      await request(app)
        .get('/api/subjects?page=2&limit=20')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Subject.findAll).toHaveBeenCalledWith({
        where: { isActive: true },
        include: expect.any(Array),
        limit: 20,
        offset: 20
      });
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/subjects')
        .expect(401);
    });
  });

  describe('GET /api/subjects/:id', () => {
    it('should get subject by id', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      Subject.findByPk.mockResolvedValue(testSubject);

      const response = await request(app)
        .get(`/api/subjects/${testSubject.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.id).toBe(testSubject.id);
      expect(response.body.name).toBe(testSubject.name);
      expect(response.body.code).toBe(testSubject.code);
    });

    it('should return 404 for non-existent subject', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      Subject.findByPk.mockResolvedValue(null);

      await request(app)
        .get('/api/subjects/999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('should include creator and classes information', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const subjectWithDetails = {
        ...testSubject,
        creator: adminUser,
        classes: [testClass]
      };
      
      Subject.findByPk.mockResolvedValue(subjectWithDetails);

      const response = await request(app)
        .get(`/api/subjects/${testSubject.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('creator');
      expect(response.body).toHaveProperty('classes');
    });
  });

  describe('POST /api/subjects', () => {
    it('should create new subject as admin', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      const newSubjectData = {
        name: 'Physics Advanced',
        code: 'PHYS-ADV-11',
        description: 'Advanced physics for grade 11',
        code: '2024-2025',
        credits: 4
      };

      Subject.findOne.mockResolvedValue(null); // Code doesn't exist
      Subject.create.mockResolvedValue({
        id: 2,
        ...newSubjectData,
        createdBy: adminUser.id
      });

      const response = await request(app)
        .post('/api/subjects')
        .set('Authorization', `Bearer ${token}`)
        .send(newSubjectData)
        .expect(201);

      expect(response.body.name).toBe(newSubjectData.name);
      expect(response.body.code).toBe(newSubjectData.code);
      expect(response.body.createdBy).toBe(adminUser.id);
    });

    it('should return 403 for non-admin users', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const newSubjectData = {
        name: 'Chemistry Basic',
        code: 'CHEM-BAS-10',
        code: '2024-2025',
        credits: 3
      };

      await request(app)
        .post('/api/subjects')
        .set('Authorization', `Bearer ${token}`)
        .send(newSubjectData)
        .expect(403);
    });

    it('should return 400 if subject code already exists', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      const duplicateSubjectData = {
        name: 'Another Math Subject',
        code: 'MATH-ADV-10', // Existing code
        code: '2024-2025',
        credits: 3
      };

      Subject.findOne.mockResolvedValue(testSubject); // Code exists

      await request(app)
        .post('/api/subjects')
        .set('Authorization', `Bearer ${token}`)
        .send(duplicateSubjectData)
        .expect(400);
    });

    it('should validate required fields', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      const invalidData = {
        description: 'Missing required fields'
        // Missing name, code, grade, credits
      };

      await request(app)
        .post('/api/subjects')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData)
        .expect(400);
    });

    it('should validate code format', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      const invalidcodeData = {
        name: 'Invalid code Subject',
        code: 'INVALID-code',
        code: 'Invalid', // Invalid code
        credits: 3
      };

      await request(app)
        .post('/api/subjects')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidcodeData)
        .expect(400);
    });

    it('should validate credits range', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      const invalidCreditsData = {
        name: 'Invalid Credits Subject',
        code: 'INVALID-CREDITS',
        code: '2024-2025',
        credits: 0 // Invalid credits
      };

      await request(app)
        .post('/api/subjects')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidCreditsData)
        .expect(400);
    });
  });

  describe('PUT /api/subjects/:id', () => {
    it('should update subject as admin', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      const updateData = {
        name: 'Advanced Mathematics Updated',
        description: 'Updated description',
        credits: 4
      };

      Subject.findByPk.mockResolvedValue(testSubject);
      Subject.findOne.mockResolvedValue(null); // Code not taken
      Subject.update.mockResolvedValue([1]);
      
      const updatedSubject = { ...testSubject, ...updateData };
      Subject.findByPk.mockResolvedValueOnce(updatedSubject);

      const response = await request(app)
        .put(`/api/subjects/${testSubject.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.credits).toBe(updateData.credits);
    });

    it('should return 403 for non-admin users', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const updateData = {
        name: 'Student Update Attempt'
      };

      await request(app)
        .put(`/api/subjects/${testSubject.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(403);
    });

    it('should return 404 for non-existent subject', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      Subject.findByPk.mockResolvedValue(null);

      await request(app)
        .put('/api/subjects/999')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Subject' })
        .expect(404);
    });

    it('should return 400 if code is taken by another subject', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      const updateData = {
        code: 'EXISTING-CODE'
      };

      Subject.findByPk.mockResolvedValue(testSubject);
      Subject.findOne.mockResolvedValue({ id: 999 }); // Code taken by subject 999

      await request(app)
        .put(`/api/subjects/${testSubject.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(400);
    });
  });

  describe('DELETE /api/subjects/:id', () => {
    it('should delete subject as admin', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      Subject.findByPk.mockResolvedValue(testSubject);
      Subject.destroy.mockResolvedValue(1);

      const response = await request(app)
        .delete(`/api/subjects/${testSubject.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('xóa thành công');
    });

    it('should return 403 for non-admin users', async () => {
      const token = generateTestToken(testUser.id, testUser.role);

      await request(app)
        .delete(`/api/subjects/${testSubject.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should return 404 for non-existent subject', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      Subject.findByPk.mockResolvedValue(null);

      await request(app)
        .delete('/api/subjects/999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('should return 400 if subject is assigned to classes', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      const subjectWithClasses = {
        ...testSubject,
        classes: [testClass] // Has assigned classes
      };
      
      Subject.findByPk.mockResolvedValue(subjectWithClasses);

      await request(app)
        .delete(`/api/subjects/${testSubject.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });

  describe('PUT /api/subjects/:id/status', () => {
    it('should activate/deactivate subject as admin', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      const statusData = { isActive: false };

      Subject.findByPk.mockResolvedValue(testSubject);
      Subject.update.mockResolvedValue([1]);

      const response = await request(app)
        .put(`/api/subjects/${testSubject.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send(statusData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(Subject.update).toHaveBeenCalledWith(
        { isActive: false },
        { where: { id: testSubject.id } }
      );
    });

    it('should return 403 for non-admin users', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const statusData = { isActive: true };

      await request(app)
        .put(`/api/subjects/${testSubject.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send(statusData)
        .expect(403);
    });
  });

  describe('POST /api/subjects/:id/assign-class', () => {
    it('should assign subject to class as admin', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      const assignData = { classId: testClass.id };

      Subject.findByPk.mockResolvedValue(testSubject);
      Class.findByPk.mockResolvedValue(testClass);
      
      // Mock SubjectClass model
      const SubjectClass = {
        findOne: jest.fn().mockResolvedValue(null), // Not assigned
        create: jest.fn().mockResolvedValue({
          subjectId: testSubject.id,
          classId: testClass.id
        })
      };

      const response = await request(app)
        .post(`/api/subjects/${testSubject.id}/assign-class`)
        .set('Authorization', `Bearer ${token}`)
        .send(assignData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('thành công');
    });

    it('should return 400 if already assigned', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      const assignData = { classId: testClass.id };

      Subject.findByPk.mockResolvedValue(testSubject);
      Class.findByPk.mockResolvedValue(testClass);
      
      // Mock existing assignment
      const SubjectClass = {
        findOne: jest.fn().mockResolvedValue({
          subjectId: testSubject.id,
          classId: testClass.id
        })
      };

      await request(app)
        .post(`/api/subjects/${testSubject.id}/assign-class`)
        .set('Authorization', `Bearer ${token}`)
        .send(assignData)
        .expect(400);
    });

    it('should return 403 for non-admin users', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const assignData = { classId: testClass.id };

      await request(app)
        .post(`/api/subjects/${testSubject.id}/assign-class`)
        .set('Authorization', `Bearer ${token}`)
        .send(assignData)
        .expect(403);
    });
  });

  describe('DELETE /api/subjects/:id/assign-class/:classId', () => {
    it('should unassign subject from class as admin', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);

      Subject.findByPk.mockResolvedValue(testSubject);
      Class.findByPk.mockResolvedValue(testClass);
      
      // Mock existing assignment
      const SubjectClass = {
        findOne: jest.fn().mockResolvedValue({
          subjectId: testSubject.id,
          classId: testClass.id
        }),
        destroy: jest.fn().mockResolvedValue(1)
      };

      const response = await request(app)
        .delete(`/api/subjects/${testSubject.id}/assign-class/${testClass.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('thành công');
    });

    it('should return 400 if not assigned', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);

      Subject.findByPk.mockResolvedValue(testSubject);
      Class.findByPk.mockResolvedValue(testClass);
      
      // Mock no assignment
      const SubjectClass = {
        findOne: jest.fn().mockResolvedValue(null)
      };

      await request(app)
        .delete(`/api/subjects/${testSubject.id}/assign-class/${testClass.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });

  describe('GET /api/subjects/:id/classes', () => {
    it('should get classes assigned to subject', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const subjectWithClasses = {
        ...testSubject,
        classes: [testClass]
      };
      
      Subject.findByPk.mockResolvedValue(subjectWithClasses);

      const response = await request(app)
        .get(`/api/subjects/${testSubject.id}/classes`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe(testClass.name);
    });

    it('should return empty array if no classes assigned', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const subjectWithoutClasses = {
        ...testSubject,
        classes: []
      };
      
      Subject.findByPk.mockResolvedValue(subjectWithoutClasses);

      const response = await request(app)
        .get(`/api/subjects/${testSubject.id}/classes`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/subjects/stats', () => {
    it('should get subject statistics as admin', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      
      Subject.count = jest.fn()
        .mockResolvedValueOnce(100) // total subjects
        .mockResolvedValueOnce(90); // active subjects

      const response = await request(app)
        .get('/api/subjects/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('active');
      expect(response.body).toHaveProperty('bycode');
      expect(response.body).toHaveProperty('byCredits');
    });

    it('should return 403 for non-admin users', async () => {
      const token = generateTestToken(testUser.id, testUser.role);

      await request(app)
        .get('/api/subjects/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });
});
