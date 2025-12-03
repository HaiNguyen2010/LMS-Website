const request = require('supertest');
const express = require('express');
const assignmentRoutes = require('../routes/assignments');
const { Assignment, Submission, User, Subject, Class } = require('../models');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/assignments', assignmentRoutes);

describe('Assignment APIs', () => {
  let testAssignment, testSubmission, testUser, teacherUser, adminUser, testSubject, testClass;

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

    testSubject = {
      id: 1,
      name: 'Mathematics',
      code: 'MATH-10',
      grade: 10
    };

    testClass = {
      id: 1,
      name: 'Mathematics 10A',
      grade: 10,
      teacherId: teacherUser.id
    };

    testAssignment = {
      id: 1,
      title: 'Algebra Practice Problems',
      description: 'Solve the given algebra problems and show your work',
      instructions: 'Complete all problems in the worksheet. Submit as PDF.',
      type: 'homework', // homework, exam, project, quiz
      maxScore: 100,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      startDate: new Date(),
      isPublished: true,
      allowLateSubmission: true,
      latePenalty: 10, // percentage
      maxAttempts: 3,
      timeLimit: null, // minutes, null for no limit
      subjectId: testSubject.id,
      classId: testClass.id,
      teacherId: teacherUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      attachments: []
    };

    testSubmission = {
      id: 1,
      assignmentId: testAssignment.id,
      studentId: testUser.id,
      content: 'My solution to the problems...',
      attachmentUrl: 'https://example.com/submission.pdf',
      submittedAt: new Date(),
      score: null,
      feedback: null,
      status: 'submitted', // draft, submitted, graded, returned
      attempt: 1,
      isLate: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  describe('GET /api/assignments', () => {
    it('should get all assignments for a class', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const assignments = [testAssignment];
      
      Assignment.findAll.mockResolvedValue(assignments);

      const response = await request(app)
        .get('/api/assignments?classId=1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe(testAssignment.title);
    });

    it('should get assignments by subject', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      Assignment.findAll.mockResolvedValue([testAssignment]);

      await request(app)
        .get('/api/assignments?subjectId=1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Assignment.findAll).toHaveBeenCalledWith({
        where: { subjectId: 1, isPublished: true },
        include: expect.any(Array),
        order: [['dueDate', 'ASC']],
        limit: 50,
        offset: 0
      });
    });

    it('should filter assignments by type', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      Assignment.findAll.mockResolvedValue([testAssignment]);

      await request(app)
        .get('/api/assignments?type=homework&classId=1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Assignment.findAll).toHaveBeenCalledWith({
        where: { classId: 1, type: 'homework', isPublished: true },
        include: expect.any(Array),
        order: [['dueDate', 'ASC']],
        limit: 50,
        offset: 0
      });
    });

    it('should filter assignments by status (upcoming, active, past)', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      Assignment.findAll.mockResolvedValue([testAssignment]);

      await request(app)
        .get('/api/assignments?status=active&classId=1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Assignment.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            classId: 1,
            isPublished: true,
            [expect.any(Symbol)]: expect.any(Object) // Date range condition
          })
        })
      );
    });

    it('should show unpublished assignments to teachers', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      Assignment.findAll.mockResolvedValue([testAssignment]);

      await request(app)
        .get('/api/assignments?classId=1&showUnpublished=true')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Assignment.findAll).toHaveBeenCalledWith({
        where: { classId: 1 }, // No isPublished filter for teachers
        include: expect.any(Array),
        order: [['dueDate', 'ASC']],
        limit: 50,
        offset: 0
      });
    });

    it('should search assignments by title', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      Assignment.findAll.mockResolvedValue([testAssignment]);

      await request(app)
        .get('/api/assignments?search=algebra&classId=1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Assignment.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            [expect.any(Symbol)]: expect.any(Object) // Op.or condition
          })
        })
      );
    });

    it('should require classId or subjectId', async () => {
      const token = generateTestToken(testUser.id, testUser.role);

      await request(app)
        .get('/api/assignments')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/assignments?classId=1')
        .expect(401);
    });
  });

  describe('GET /api/assignments/:id', () => {
    it('should get assignment by id with submission info for students', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const assignmentWithDetails = {
        ...testAssignment,
        teacher: teacherUser,
        subject: testSubject,
        class: testClass,
        submissions: [testSubmission] // Student's submission
      };
      
      Assignment.findByPk.mockResolvedValue(assignmentWithDetails);

      const response = await request(app)
        .get(`/api/assignments/${testAssignment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.id).toBe(testAssignment.id);
      expect(response.body.title).toBe(testAssignment.title);
      expect(response.body).toHaveProperty('teacher');
      expect(response.body).toHaveProperty('subject');
      expect(response.body).toHaveProperty('submissions');
    });

    it('should return 404 for non-existent assignment', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      Assignment.findByPk.mockResolvedValue(null);

      await request(app)
        .get('/api/assignments/999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('should return 403 for unpublished assignment to students', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const unpublishedAssignment = { ...testAssignment, isPublished: false };
      
      Assignment.findByPk.mockResolvedValue(unpublishedAssignment);

      await request(app)
        .get(`/api/assignments/${testAssignment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should allow teachers to view unpublished assignments they created', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const unpublishedAssignment = { 
        ...testAssignment, 
        isPublished: false,
        teacherId: teacherUser.id
      };
      
      Assignment.findByPk.mockResolvedValue(unpublishedAssignment);

      await request(app)
        .get(`/api/assignments/${testAssignment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should return 403 if assignment not started yet', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const futureAssignment = { 
        ...testAssignment, 
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
      };
      
      Assignment.findByPk.mockResolvedValue(futureAssignment);

      await request(app)
        .get(`/api/assignments/${testAssignment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('POST /api/assignments', () => {
    it('should create new assignment as teacher', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const newAssignmentData = {
        title: 'Geometry Quiz',
        description: 'Basic geometry concepts quiz',
        instructions: 'Answer all questions within time limit',
        type: 'quiz',
        maxScore: 50,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        timeLimit: 60,
        maxAttempts: 1,
        subjectId: testSubject.id,
        classId: testClass.id
      };

      Subject.findByPk.mockResolvedValue(testSubject);
      Class.findByPk.mockResolvedValue(testClass);
      Assignment.create.mockResolvedValue({
        id: 2,
        ...newAssignmentData,
        teacherId: teacherUser.id,
        isPublished: true
      });

      const response = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${token}`)
        .send(newAssignmentData)
        .expect(201);

      expect(response.body.title).toBe(newAssignmentData.title);
      expect(response.body.teacherId).toBe(teacherUser.id);
      expect(response.body.type).toBe('quiz');
    });

    it('should return 403 for students', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const newAssignmentData = {
        title: 'Unauthorized Assignment',
        subjectId: testSubject.id,
        classId: testClass.id
      };

      await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${token}`)
        .send(newAssignmentData)
        .expect(403);
    });

    it('should validate required fields', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const invalidData = {
        description: 'Missing required fields'
        // Missing title, subjectId, classId, dueDate
      };

      await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData)
        .expect(400);
    });

    it('should validate assignment type', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const invalidTypeData = {
        title: 'Test Assignment',
        type: 'invalid_type',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        subjectId: testSubject.id,
        classId: testClass.id
      };

      await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidTypeData)
        .expect(400);
    });

    it('should validate due date is in future', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const pastDueDateData = {
        title: 'Past Due Assignment',
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        subjectId: testSubject.id,
        classId: testClass.id
      };

      await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${token}`)
        .send(pastDueDateData)
        .expect(400);
    });

    it('should validate maxScore is positive', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const invalidScoreData = {
        title: 'Invalid Score Assignment',
        maxScore: -10,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        subjectId: testSubject.id,
        classId: testClass.id
      };

      await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidScoreData)
        .expect(400);
    });

    it('should validate maxAttempts is positive', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const invalidAttemptsData = {
        title: 'Invalid Attempts Assignment',
        maxAttempts: 0,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        subjectId: testSubject.id,
        classId: testClass.id
      };

      await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidAttemptsData)
        .expect(400);
    });
  });

  describe('PUT /api/assignments/:id', () => {
    it('should update assignment as owner teacher', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const updateData = {
        title: 'Updated Algebra Problems',
        maxScore: 120,
        allowLateSubmission: false
      };

      Assignment.findByPk.mockResolvedValue({ ...testAssignment, teacherId: teacherUser.id });
      Assignment.update.mockResolvedValue([1]);
      
      const updatedAssignment = { ...testAssignment, ...updateData };
      Assignment.findByPk.mockResolvedValueOnce(updatedAssignment);

      const response = await request(app)
        .put(`/api/assignments/${testAssignment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.maxScore).toBe(updateData.maxScore);
    });

    it('should allow admin to update any assignment', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      const updateData = { title: 'Admin Updated Assignment' };

      Assignment.findByPk.mockResolvedValue(testAssignment);
      Assignment.update.mockResolvedValue([1]);
      
      const updatedAssignment = { ...testAssignment, ...updateData };
      Assignment.findByPk.mockResolvedValueOnce(updatedAssignment);

      await request(app)
        .put(`/api/assignments/${testAssignment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);
    });

    it('should return 403 for non-owner teacher', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const anotherTeacherAssignment = { ...testAssignment, teacherId: 999 };
      
      Assignment.findByPk.mockResolvedValue(anotherTeacherAssignment);

      await request(app)
        .put(`/api/assignments/${testAssignment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Unauthorized Update' })
        .expect(403);
    });

    it('should return 403 for students', async () => {
      const token = generateTestToken(testUser.id, testUser.role);

      await request(app)
        .put(`/api/assignments/${testAssignment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Student Update' })
        .expect(403);
    });

    it('should return 400 if assignment has submissions and trying to change critical fields', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const assignmentWithSubmissions = { 
        ...testAssignment, 
        teacherId: teacherUser.id,
        submissions: [testSubmission] 
      };
      
      Assignment.findByPk.mockResolvedValue(assignmentWithSubmissions);

      await request(app)
        .put(`/api/assignments/${testAssignment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ maxScore: 200 }) // Critical field change
        .expect(400);
    });
  });

  describe('DELETE /api/assignments/:id', () => {
    it('should delete assignment as owner teacher if no submissions', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const assignmentWithoutSubmissions = { 
        ...testAssignment, 
        teacherId: teacherUser.id,
        submissions: []
      };
      
      Assignment.findByPk.mockResolvedValue(assignmentWithoutSubmissions);
      Assignment.destroy.mockResolvedValue(1);

      const response = await request(app)
        .delete(`/api/assignments/${testAssignment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('xóa thành công');
    });

    it('should return 400 if assignment has submissions', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const assignmentWithSubmissions = { 
        ...testAssignment, 
        teacherId: teacherUser.id,
        submissions: [testSubmission]
      };
      
      Assignment.findByPk.mockResolvedValue(assignmentWithSubmissions);

      await request(app)
        .delete(`/api/assignments/${testAssignment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });

    it('should allow admin to delete any assignment', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      const assignmentWithoutSubmissions = { 
        ...testAssignment,
        submissions: []
      };
      
      Assignment.findByPk.mockResolvedValue(assignmentWithoutSubmissions);
      Assignment.destroy.mockResolvedValue(1);

      await request(app)
        .delete(`/api/assignments/${testAssignment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should return 403 for students', async () => {
      const token = generateTestToken(testUser.id, testUser.role);

      await request(app)
        .delete(`/api/assignments/${testAssignment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('PUT /api/assignments/:id/publish', () => {
    it('should publish/unpublish assignment as owner teacher', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const publishData = { isPublished: false };

      Assignment.findByPk.mockResolvedValue({ ...testAssignment, teacherId: teacherUser.id });
      Assignment.update.mockResolvedValue([1]);

      const response = await request(app)
        .put(`/api/assignments/${testAssignment.id}/publish`)
        .set('Authorization', `Bearer ${token}`)
        .send(publishData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(Assignment.update).toHaveBeenCalledWith(
        { isPublished: false },
        { where: { id: testAssignment.id } }
      );
    });

    it('should return 403 for students', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const publishData = { isPublished: true };

      await request(app)
        .put(`/api/assignments/${testAssignment.id}/publish`)
        .set('Authorization', `Bearer ${token}`)
        .send(publishData)
        .expect(403);
    });
  });

  describe('GET /api/assignments/:id/submissions', () => {
    it('should get assignment submissions as teacher', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const submissions = [testSubmission];
      
      Assignment.findByPk.mockResolvedValue({ ...testAssignment, teacherId: teacherUser.id });
      Submission.findAll.mockResolvedValue(submissions);

      const response = await request(app)
        .get(`/api/assignments/${testAssignment.id}/submissions`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].assignmentId).toBe(testAssignment.id);
    });

    it('should return 403 for students trying to view all submissions', async () => {
      const token = generateTestToken(testUser.id, testUser.role);

      await request(app)
        .get(`/api/assignments/${testAssignment.id}/submissions`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should filter submissions by status', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      
      Assignment.findByPk.mockResolvedValue({ ...testAssignment, teacherId: teacherUser.id });
      Submission.findAll.mockResolvedValue([testSubmission]);

      await request(app)
        .get(`/api/assignments/${testAssignment.id}/submissions?status=submitted`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Submission.findAll).toHaveBeenCalledWith({
        where: { assignmentId: testAssignment.id, status: 'submitted' },
        include: expect.any(Array),
        order: [['submittedAt', 'DESC']]
      });
    });
  });

  describe('GET /api/assignments/:id/statistics', () => {
    it('should get assignment statistics as teacher', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      
      Assignment.findByPk.mockResolvedValue({ ...testAssignment, teacherId: teacherUser.id });
      
      Submission.count = jest.fn()
        .mockResolvedValueOnce(25) // total submissions
        .mockResolvedValueOnce(20) // graded submissions
        .mockResolvedValueOnce(3)  // late submissions
        .mockResolvedValueOnce(2); // pending submissions

      Submission.findAll.mockResolvedValue([
        { score: 85 }, { score: 92 }, { score: 78 }, { score: 90 }
      ]);

      const response = await request(app)
        .get(`/api/assignments/${testAssignment.id}/statistics`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalSubmissions');
      expect(response.body).toHaveProperty('gradedSubmissions');
      expect(response.body).toHaveProperty('lateSubmissions');
      expect(response.body).toHaveProperty('averageScore');
      expect(response.body).toHaveProperty('submissionRate');
    });

    it('should return 403 for students', async () => {
      const token = generateTestToken(testUser.id, testUser.role);

      await request(app)
        .get(`/api/assignments/${testAssignment.id}/statistics`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('POST /api/assignments/:id/attachments', () => {
    it('should add attachment as teacher', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const attachmentData = {
        name: 'Assignment Rubric.pdf',
        url: 'https://example.com/rubric.pdf',
        type: 'pdf',
        size: 2048000
      };

      Assignment.findByPk.mockResolvedValue({ ...testAssignment, teacherId: teacherUser.id });
      
      // Mock attachment creation
      const AssignmentAttachment = {
        create: jest.fn().mockResolvedValue({
          id: 1,
          assignmentId: testAssignment.id,
          ...attachmentData
        })
      };

      const response = await request(app)
        .post(`/api/assignments/${testAssignment.id}/attachments`)
        .set('Authorization', `Bearer ${token}`)
        .send(attachmentData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('thành công');
    });

    it('should return 403 for students', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const attachmentData = {
        name: 'Student Attachment',
        url: 'https://example.com/file.pdf'
      };

      await request(app)
        .post(`/api/assignments/${testAssignment.id}/attachments`)
        .set('Authorization', `Bearer ${token}`)
        .send(attachmentData)
        .expect(403);
    });
  });

  describe('POST /api/assignments/:id/duplicate', () => {
    it('should duplicate assignment as teacher', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const duplicateData = {
        title: 'Algebra Practice Problems - Copy',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        classId: testClass.id
      };

      Assignment.findByPk.mockResolvedValue({ ...testAssignment, teacherId: teacherUser.id });
      Assignment.create.mockResolvedValue({
        id: 2,
        ...testAssignment,
        ...duplicateData,
        isPublished: false // Duplicated assignments start unpublished
      });

      const response = await request(app)
        .post(`/api/assignments/${testAssignment.id}/duplicate`)
        .set('Authorization', `Bearer ${token}`)
        .send(duplicateData)
        .expect(201);

      expect(response.body.title).toBe(duplicateData.title);
      expect(response.body.isPublished).toBe(false);
      expect(response.body.teacherId).toBe(teacherUser.id);
    });

    it('should return 403 for students', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const duplicateData = {
        title: 'Copy Assignment',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      await request(app)
        .post(`/api/assignments/${testAssignment.id}/duplicate`)
        .set('Authorization', `Bearer ${token}`)
        .send(duplicateData)
        .expect(403);
    });
  });

  describe('GET /api/assignments/class/:classId/stats', () => {
    it('should get assignment statistics for class as teacher', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      
      Assignment.count = jest.fn()
        .mockResolvedValueOnce(15) // total assignments
        .mockResolvedValueOnce(12) // published assignments
        .mockResolvedValueOnce(6)  // homework assignments
        .mockResolvedValueOnce(4)  // quiz assignments
        .mockResolvedValueOnce(3)  // exam assignments
        .mockResolvedValueOnce(2); // project assignments

      const response = await request(app)
        .get(`/api/assignments/class/${testClass.id}/stats`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('published');
      expect(response.body).toHaveProperty('byType');
      expect(response.body.byType).toHaveProperty('homework');
      expect(response.body.byType).toHaveProperty('quiz');
    });

    it('should return 403 for students without permission', async () => {
      const token = generateTestToken(testUser.id, testUser.role);

      await request(app)
        .get(`/api/assignments/class/${testClass.id}/stats`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });
});