const request = require('supertest');
const express = require('express');
const lessonRoutes = require('../routes/lessons');
const { Lesson, User, Subject, Class } = require('../models');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/lessons', lessonRoutes);

describe('Lesson APIs', () => {
  let testLesson, testUser, teacherUser, adminUser, testSubject, testClass;

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

    testLesson = {
      id: 1,
      title: 'Introduction to Algebra',
      content: 'Basic concepts of algebra including variables and expressions',
      description: 'This lesson covers fundamental algebraic concepts',
      type: 'theory', // theory, practice, video, document
      duration: 45, // minutes
      order: 1,
      isPublished: true,
      subjectId: testSubject.id,
      classId: testClass.id,
      teacherId: teacherUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      videoUrl: null,
      documentUrl: null,
      attachments: []
    };
  });

  describe('GET /api/lessons', () => {
    it('should get all lessons for a class', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const lessons = [testLesson];
      
      Lesson.findAll.mockResolvedValue(lessons);

      const response = await request(app)
        .get('/api/lessons?classId=1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe(testLesson.title);
    });

    it('should get lessons by subject', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      Lesson.findAll.mockResolvedValue([testLesson]);

      await request(app)
        .get('/api/lessons?subjectId=1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Lesson.findAll).toHaveBeenCalledWith({
        where: { subjectId: 1, isPublished: true },
        include: expect.any(Array),
        order: [['order', 'ASC']],
        limit: 50,
        offset: 0
      });
    });

    it('should filter lessons by type', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      Lesson.findAll.mockResolvedValue([testLesson]);

      await request(app)
        .get('/api/lessons?type=theory&classId=1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Lesson.findAll).toHaveBeenCalledWith({
        where: { classId: 1, type: 'theory', isPublished: true },
        include: expect.any(Array),
        order: [['order', 'ASC']],
        limit: 50,
        offset: 0
      });
    });

    it('should show unpublished lessons to teachers', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      Lesson.findAll.mockResolvedValue([testLesson]);

      await request(app)
        .get('/api/lessons?classId=1&showUnpublished=true')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Lesson.findAll).toHaveBeenCalledWith({
        where: { classId: 1 }, // No isPublished filter for teachers
        include: expect.any(Array),
        order: [['order', 'ASC']],
        limit: 50,
        offset: 0
      });
    });

    it('should search lessons by title', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      Lesson.findAll.mockResolvedValue([testLesson]);

      await request(app)
        .get('/api/lessons?search=algebra&classId=1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Lesson.findAll).toHaveBeenCalledWith(
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
        .get('/api/lessons')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/lessons?classId=1')
        .expect(401);
    });
  });

  describe('GET /api/lessons/:id', () => {
    it('should get lesson by id', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const lessonWithDetails = {
        ...testLesson,
        teacher: teacherUser,
        subject: testSubject,
        class: testClass
      };
      
      Lesson.findByPk.mockResolvedValue(lessonWithDetails);

      const response = await request(app)
        .get(`/api/lessons/${testLesson.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.id).toBe(testLesson.id);
      expect(response.body.title).toBe(testLesson.title);
      expect(response.body).toHaveProperty('teacher');
      expect(response.body).toHaveProperty('subject');
      expect(response.body).toHaveProperty('class');
    });

    it('should return 404 for non-existent lesson', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      Lesson.findByPk.mockResolvedValue(null);

      await request(app)
        .get('/api/lessons/999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('should return 403 for unpublished lesson to students', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const unpublishedLesson = { ...testLesson, isPublished: false };
      
      Lesson.findByPk.mockResolvedValue(unpublishedLesson);

      await request(app)
        .get(`/api/lessons/${testLesson.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should allow teachers to view unpublished lessons they created', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const unpublishedLesson = { 
        ...testLesson, 
        isPublished: false,
        teacherId: teacherUser.id
      };
      
      Lesson.findByPk.mockResolvedValue(unpublishedLesson);

      await request(app)
        .get(`/api/lessons/${testLesson.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  describe('POST /api/lessons', () => {
    it('should create new lesson as teacher', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const newLessonData = {
        title: 'Linear Equations',
        content: 'Solving linear equations step by step',
        description: 'Learn to solve linear equations',
        type: 'theory',
        duration: 60,
        order: 2,
        subjectId: testSubject.id,
        classId: testClass.id
      };

      Subject.findByPk.mockResolvedValue(testSubject);
      Class.findByPk.mockResolvedValue(testClass);
      Lesson.create.mockResolvedValue({
        id: 2,
        ...newLessonData,
        teacherId: teacherUser.id,
        isPublished: true
      });

      const response = await request(app)
        .post('/api/lessons')
        .set('Authorization', `Bearer ${token}`)
        .send(newLessonData)
        .expect(201);

      expect(response.body.title).toBe(newLessonData.title);
      expect(response.body.teacherId).toBe(teacherUser.id);
      expect(response.body.isPublished).toBe(true);
    });

    it('should return 403 for students', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const newLessonData = {
        title: 'Unauthorized Lesson',
        content: 'This should fail',
        subjectId: testSubject.id,
        classId: testClass.id
      };

      await request(app)
        .post('/api/lessons')
        .set('Authorization', `Bearer ${token}`)
        .send(newLessonData)
        .expect(403);
    });

    it('should validate required fields', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const invalidData = {
        content: 'Missing required fields'
        // Missing title, subjectId, classId
      };

      await request(app)
        .post('/api/lessons')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData)
        .expect(400);
    });

    it('should validate lesson type', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const invalidTypeData = {
        title: 'Test Lesson',
        content: 'Test content',
        type: 'invalid_type',
        subjectId: testSubject.id,
        classId: testClass.id
      };

      await request(app)
        .post('/api/lessons')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidTypeData)
        .expect(400);
    });

    it('should validate duration range', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const invalidDurationData = {
        title: 'Test Lesson',
        content: 'Test content',
        duration: -10, // Invalid duration
        subjectId: testSubject.id,
        classId: testClass.id
      };

      await request(app)
        .post('/api/lessons')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidDurationData)
        .expect(400);
    });

    it('should return 404 if subject not found', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const lessonData = {
        title: 'Test Lesson',
        content: 'Test content',
        subjectId: 999, // Non-existent subject
        classId: testClass.id
      };

      Subject.findByPk.mockResolvedValue(null);

      await request(app)
        .post('/api/lessons')
        .set('Authorization', `Bearer ${token}`)
        .send(lessonData)
        .expect(404);
    });

    it('should return 404 if class not found', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const lessonData = {
        title: 'Test Lesson',
        content: 'Test content',
        subjectId: testSubject.id,
        classId: 999 // Non-existent class
      };

      Subject.findByPk.mockResolvedValue(testSubject);
      Class.findByPk.mockResolvedValue(null);

      await request(app)
        .post('/api/lessons')
        .set('Authorization', `Bearer ${token}`)
        .send(lessonData)
        .expect(404);
    });
  });

  describe('PUT /api/lessons/:id', () => {
    it('should update lesson as owner teacher', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const updateData = {
        title: 'Updated Algebra Lesson',
        content: 'Updated content with more examples',
        duration: 50
      };

      Lesson.findByPk.mockResolvedValue({ ...testLesson, teacherId: teacherUser.id });
      Lesson.update.mockResolvedValue([1]);
      
      const updatedLesson = { ...testLesson, ...updateData };
      Lesson.findByPk.mockResolvedValueOnce(updatedLesson);

      const response = await request(app)
        .put(`/api/lessons/${testLesson.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.duration).toBe(updateData.duration);
    });

    it('should allow admin to update any lesson', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      const updateData = { title: 'Admin Updated Lesson' };

      Lesson.findByPk.mockResolvedValue(testLesson);
      Lesson.update.mockResolvedValue([1]);
      
      const updatedLesson = { ...testLesson, ...updateData };
      Lesson.findByPk.mockResolvedValueOnce(updatedLesson);

      await request(app)
        .put(`/api/lessons/${testLesson.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);
    });

    it('should return 403 for non-owner teacher', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const anotherTeacherLesson = { ...testLesson, teacherId: 999 };
      
      Lesson.findByPk.mockResolvedValue(anotherTeacherLesson);

      await request(app)
        .put(`/api/lessons/${testLesson.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Unauthorized Update' })
        .expect(403);
    });

    it('should return 403 for students', async () => {
      const token = generateTestToken(testUser.id, testUser.role);

      await request(app)
        .put(`/api/lessons/${testLesson.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Student Update' })
        .expect(403);
    });

    it('should return 404 for non-existent lesson', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      Lesson.findByPk.mockResolvedValue(null);

      await request(app)
        .put('/api/lessons/999')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Non-existent Update' })
        .expect(404);
    });
  });

  describe('DELETE /api/lessons/:id', () => {
    it('should delete lesson as owner teacher', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      Lesson.findByPk.mockResolvedValue({ ...testLesson, teacherId: teacherUser.id });
      Lesson.destroy.mockResolvedValue(1);

      const response = await request(app)
        .delete(`/api/lessons/${testLesson.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('xóa thành công');
    });

    it('should allow admin to delete any lesson', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      Lesson.findByPk.mockResolvedValue(testLesson);
      Lesson.destroy.mockResolvedValue(1);

      await request(app)
        .delete(`/api/lessons/${testLesson.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should return 403 for non-owner teacher', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const anotherTeacherLesson = { ...testLesson, teacherId: 999 };
      
      Lesson.findByPk.mockResolvedValue(anotherTeacherLesson);

      await request(app)
        .delete(`/api/lessons/${testLesson.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should return 403 for students', async () => {
      const token = generateTestToken(testUser.id, testUser.role);

      await request(app)
        .delete(`/api/lessons/${testLesson.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('PUT /api/lessons/:id/publish', () => {
    it('should publish/unpublish lesson as owner teacher', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const publishData = { isPublished: false };

      Lesson.findByPk.mockResolvedValue({ ...testLesson, teacherId: teacherUser.id });
      Lesson.update.mockResolvedValue([1]);

      const response = await request(app)
        .put(`/api/lessons/${testLesson.id}/publish`)
        .set('Authorization', `Bearer ${token}`)
        .send(publishData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(Lesson.update).toHaveBeenCalledWith(
        { isPublished: false },
        { where: { id: testLesson.id } }
      );
    });

    it('should allow admin to publish/unpublish any lesson', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      const publishData = { isPublished: true };

      Lesson.findByPk.mockResolvedValue(testLesson);
      Lesson.update.mockResolvedValue([1]);

      await request(app)
        .put(`/api/lessons/${testLesson.id}/publish`)
        .set('Authorization', `Bearer ${token}`)
        .send(publishData)
        .expect(200);
    });

    it('should return 403 for students', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const publishData = { isPublished: true };

      await request(app)
        .put(`/api/lessons/${testLesson.id}/publish`)
        .set('Authorization', `Bearer ${token}`)
        .send(publishData)
        .expect(403);
    });
  });

  describe('PUT /api/lessons/:id/order', () => {
    it('should update lesson order as teacher', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const orderData = { order: 5 };

      Lesson.findByPk.mockResolvedValue({ ...testLesson, teacherId: teacherUser.id });
      Lesson.update.mockResolvedValue([1]);

      const response = await request(app)
        .put(`/api/lessons/${testLesson.id}/order`)
        .set('Authorization', `Bearer ${token}`)
        .send(orderData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(Lesson.update).toHaveBeenCalledWith(
        { order: 5 },
        { where: { id: testLesson.id } }
      );
    });

    it('should validate order is positive integer', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const invalidOrderData = { order: -1 };

      await request(app)
        .put(`/api/lessons/${testLesson.id}/order`)
        .set('Authorization', `Bearer ${token}`)
        .send(invalidOrderData)
        .expect(400);
    });

    it('should return 403 for students', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const orderData = { order: 3 };

      await request(app)
        .put(`/api/lessons/${testLesson.id}/order`)
        .set('Authorization', `Bearer ${token}`)
        .send(orderData)
        .expect(403);
    });
  });

  describe('POST /api/lessons/:id/attachments', () => {
    it('should add attachment as teacher', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const attachmentData = {
        name: 'Algebra Worksheet.pdf',
        url: 'https://example.com/worksheet.pdf',
        type: 'pdf',
        size: 1024000
      };

      Lesson.findByPk.mockResolvedValue({ ...testLesson, teacherId: teacherUser.id });
      
      // Mock attachment creation
      const LessonAttachment = {
        create: jest.fn().mockResolvedValue({
          id: 1,
          lessonId: testLesson.id,
          ...attachmentData
        })
      };

      const response = await request(app)
        .post(`/api/lessons/${testLesson.id}/attachments`)
        .set('Authorization', `Bearer ${token}`)
        .send(attachmentData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('thành công');
    });

    it('should validate attachment data', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const invalidAttachmentData = {
        // Missing name and url
        type: 'pdf'
      };

      await request(app)
        .post(`/api/lessons/${testLesson.id}/attachments`)
        .set('Authorization', `Bearer ${token}`)
        .send(invalidAttachmentData)
        .expect(400);
    });

    it('should return 403 for students', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const attachmentData = {
        name: 'Student Attachment',
        url: 'https://example.com/file.pdf'
      };

      await request(app)
        .post(`/api/lessons/${testLesson.id}/attachments`)
        .set('Authorization', `Bearer ${token}`)
        .send(attachmentData)
        .expect(403);
    });
  });

  describe('GET /api/lessons/:id/attachments', () => {
    it('should get lesson attachments', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const attachments = [
        {
          id: 1,
          name: 'Worksheet.pdf',
          url: 'https://example.com/worksheet.pdf',
          type: 'pdf',
          size: 1024000
        }
      ];
      
      Lesson.findByPk.mockResolvedValue({
        ...testLesson,
        attachments
      });

      const response = await request(app)
        .get(`/api/lessons/${testLesson.id}/attachments`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Worksheet.pdf');
    });

    it('should return empty array if no attachments', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      
      Lesson.findByPk.mockResolvedValue({
        ...testLesson,
        attachments: []
      });

      const response = await request(app)
        .get(`/api/lessons/${testLesson.id}/attachments`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/lessons/class/:classId/stats', () => {
    it('should get lesson statistics for class as teacher', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      
      Lesson.count = jest.fn()
        .mockResolvedValueOnce(20) // total lessons
        .mockResolvedValueOnce(18) // published lessons
        .mockResolvedValueOnce(5)  // theory lessons
        .mockResolvedValueOnce(8)  // practice lessons
        .mockResolvedValueOnce(4)  // video lessons
        .mockResolvedValueOnce(3); // document lessons

      const response = await request(app)
        .get(`/api/lessons/class/${testClass.id}/stats`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('published');
      expect(response.body).toHaveProperty('byType');
      expect(response.body.byType).toHaveProperty('theory');
      expect(response.body.byType).toHaveProperty('practice');
    });

    it('should return 403 for students without permission', async () => {
      const token = generateTestToken(testUser.id, testUser.role);

      await request(app)
        .get(`/api/lessons/class/${testClass.id}/stats`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('POST /api/lessons/bulk-update-order', () => {
    it('should bulk update lesson order as teacher', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const orderData = {
        lessons: [
          { id: 1, order: 1 },
          { id: 2, order: 2 },
          { id: 3, order: 3 }
        ]
      };

      // Mock lessons belong to teacher
      Lesson.findAll.mockResolvedValue([
        { id: 1, teacherId: teacherUser.id },
        { id: 2, teacherId: teacherUser.id },
        { id: 3, teacherId: teacherUser.id }
      ]);

      Lesson.update = jest.fn().mockResolvedValue([1]);

      const response = await request(app)
        .post('/api/lessons/bulk-update-order')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('thành công');
      expect(Lesson.update).toHaveBeenCalledTimes(3);
    });

    it('should return 403 if user doesnt own all lessons', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const orderData = {
        lessons: [
          { id: 1, order: 1 },
          { id: 2, order: 2 }
        ]
      };

      // Mock one lesson belongs to another teacher
      Lesson.findAll.mockResolvedValue([
        { id: 1, teacherId: teacherUser.id },
        { id: 2, teacherId: 999 } // Different teacher
      ]);

      await request(app)
        .post('/api/lessons/bulk-update-order')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData)
        .expect(403);
    });

    it('should validate lessons array', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const invalidData = {
        lessons: 'not an array'
      };

      await request(app)
        .post('/api/lessons/bulk-update-order')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData)
        .expect(400);
    });
  });
});