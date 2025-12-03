const request = require('supertest');
const express = require('express');
const gradeRoutes = require('../routes/grades');
const { Grade, User, Subject, Class, Assignment, Submission } = require('../models');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/grades', gradeRoutes);

describe('Grade APIs', () => {
  let testGrade, testUser, teacherUser, adminUser, testSubject, testClass, testAssignment, testSubmission;

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
      grade: 10,
      credits: 3
    };

    testClass = {
      id: 1,
      name: 'Mathematics 10A',
      grade: 10,
      teacherId: teacherUser.id
    };

    testAssignment = {
      id: 1,
      title: 'Algebra Quiz',
      type: 'quiz',
      maxScore: 100,
      subjectId: testSubject.id,
      classId: testClass.id,
      teacherId: teacherUser.id
    };

    testSubmission = {
      id: 1,
      assignmentId: testAssignment.id,
      studentId: testUser.id,
      score: 85,
      status: 'graded'
    };

    testGrade = {
      id: 1,
      studentId: testUser.id,
      subjectId: testSubject.id,
      classId: testClass.id,
      assignmentId: testAssignment.id,
      submissionId: testSubmission.id,
      score: 85,
      maxScore: 100,
      percentage: 85,
      letterGrade: 'B',
      gpa: 3.0,
      semester: 1,
      academicYear: '2024-2025',
      gradedBy: teacherUser.id,
      gradedAt: new Date(),
      feedback: 'Good work on algebra concepts',
      isPublished: true,
      weight: 1.0, // Assignment weight in final grade calculation
      category: 'quiz', // homework, quiz, exam, project, participation
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  describe('GET /api/grades', () => {
    it('should get grades for a student', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const grades = [testGrade];
      
      Grade.findAll.mockResolvedValue(grades);

      const response = await request(app)
        .get('/api/grades')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].score).toBe(testGrade.score);
    });

    it('should filter grades by subject', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      Grade.findAll.mockResolvedValue([testGrade]);

      await request(app)
        .get('/api/grades?subjectId=1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Grade.findAll).toHaveBeenCalledWith({
        where: { studentId: testUser.id, subjectId: 1, isPublished: true },
        include: expect.any(Array),
        order: [['gradedAt', 'DESC']],
        limit: 50,
        offset: 0
      });
    });

    it('should filter grades by class', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      Grade.findAll.mockResolvedValue([testGrade]);

      await request(app)
        .get('/api/grades?classId=1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Grade.findAll).toHaveBeenCalledWith({
        where: { studentId: testUser.id, classId: 1, isPublished: true },
        include: expect.any(Array),
        order: [['gradedAt', 'DESC']],
        limit: 50,
        offset: 0
      });
    });

    it('should filter grades by semester and academic year', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      Grade.findAll.mockResolvedValue([testGrade]);

      await request(app)
        .get('/api/grades?semester=1&academicYear=2024-2025')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Grade.findAll).toHaveBeenCalledWith({
        where: { 
          studentId: testUser.id, 
          semester: 1, 
          academicYear: '2024-2025',
          isPublished: true 
        },
        include: expect.any(Array),
        order: [['gradedAt', 'DESC']],
        limit: 50,
        offset: 0
      });
    });

    it('should filter grades by category', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      Grade.findAll.mockResolvedValue([testGrade]);

      await request(app)
        .get('/api/grades?category=quiz')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Grade.findAll).toHaveBeenCalledWith({
        where: { studentId: testUser.id, category: 'quiz', isPublished: true },
        include: expect.any(Array),
        order: [['gradedAt', 'DESC']],
        limit: 50,
        offset: 0
      });
    });

    it('should allow teachers to view all students grades in their class', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      Grade.findAll.mockResolvedValue([testGrade]);

      await request(app)
        .get('/api/grades?classId=1&viewAll=true')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Grade.findAll).toHaveBeenCalledWith({
        where: { classId: 1, isPublished: true },
        include: expect.any(Array),
        order: [['gradedAt', 'DESC']],
        limit: 50,
        offset: 0
      });
    });

    it('should show unpublished grades to teachers', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      Grade.findAll.mockResolvedValue([testGrade]);

      await request(app)
        .get('/api/grades?classId=1&showUnpublished=true')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Grade.findAll).toHaveBeenCalledWith({
        where: { classId: 1 }, // No isPublished filter
        include: expect.any(Array),
        order: [['gradedAt', 'DESC']],
        limit: 50,
        offset: 0
      });
    });

    it('should support pagination', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      Grade.findAll.mockResolvedValue([testGrade]);

      await request(app)
        .get('/api/grades?page=2&limit=20')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Grade.findAll).toHaveBeenCalledWith({
        where: { studentId: testUser.id, isPublished: true },
        include: expect.any(Array),
        order: [['gradedAt', 'DESC']],
        limit: 20,
        offset: 20
      });
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/grades')
        .expect(401);
    });
  });

  describe('GET /api/grades/:id', () => {
    it('should get grade by id for student owner', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const gradeWithDetails = {
        ...testGrade,
        student: testUser,
        subject: testSubject,
        class: testClass,
        assignment: testAssignment,
        submission: testSubmission,
        gradedByUser: teacherUser
      };
      
      Grade.findByPk.mockResolvedValue(gradeWithDetails);

      const response = await request(app)
        .get(`/api/grades/${testGrade.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.id).toBe(testGrade.id);
      expect(response.body.score).toBe(testGrade.score);
      expect(response.body).toHaveProperty('student');
      expect(response.body).toHaveProperty('subject');
      expect(response.body).toHaveProperty('assignment');
    });

    it('should return 404 for non-existent grade', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      Grade.findByPk.mockResolvedValue(null);

      await request(app)
        .get('/api/grades/999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('should return 403 for unpublished grade to students', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const unpublishedGrade = { 
        ...testGrade, 
        isPublished: false,
        studentId: testUser.id 
      };
      
      Grade.findByPk.mockResolvedValue(unpublishedGrade);

      await request(app)
        .get(`/api/grades/${testGrade.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should return 403 for students viewing other students grades', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const anotherStudentGrade = { 
        ...testGrade, 
        studentId: 999 // Different student
      };
      
      Grade.findByPk.mockResolvedValue(anotherStudentGrade);

      await request(app)
        .get(`/api/grades/${testGrade.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should allow teachers to view any grade they created', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const teacherGrade = { 
        ...testGrade, 
        gradedBy: teacherUser.id
      };
      
      Grade.findByPk.mockResolvedValue(teacherGrade);

      await request(app)
        .get(`/api/grades/${testGrade.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should allow admin to view any grade', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      
      Grade.findByPk.mockResolvedValue(testGrade);

      await request(app)
        .get(`/api/grades/${testGrade.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  describe('POST /api/grades', () => {
    it('should create new grade as teacher', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const newGradeData = {
        studentId: testUser.id,
        subjectId: testSubject.id,
        classId: testClass.id,
        assignmentId: testAssignment.id,
        submissionId: testSubmission.id,
        score: 92,
        maxScore: 100,
        feedback: 'Excellent work!',
        category: 'quiz',
        weight: 1.0
      };

      User.findByPk.mockResolvedValue(testUser);
      Subject.findByPk.mockResolvedValue(testSubject);
      Class.findByPk.mockResolvedValue(testClass);
      Assignment.findByPk.mockResolvedValue(testAssignment);
      Submission.findByPk.mockResolvedValue(testSubmission);
      
      // Mock calculateLetterGrade and calculateGPA functions
      const mockGrade = {
        id: 2,
        ...newGradeData,
        percentage: 92,
        letterGrade: 'A-',
        gpa: 3.7,
        gradedBy: teacherUser.id,
        gradedAt: new Date(),
        isPublished: true
      };
      
      Grade.create.mockResolvedValue(mockGrade);

      const response = await request(app)
        .post('/api/grades')
        .set('Authorization', `Bearer ${token}`)
        .send(newGradeData)
        .expect(201);

      expect(response.body.score).toBe(newGradeData.score);
      expect(response.body.percentage).toBe(92);
      expect(response.body.letterGrade).toBe('A-');
      expect(response.body.gradedBy).toBe(teacherUser.id);
    });

    it('should return 403 for students', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const newGradeData = {
        studentId: testUser.id,
        subjectId: testSubject.id,
        score: 95
      };

      await request(app)
        .post('/api/grades')
        .set('Authorization', `Bearer ${token}`)
        .send(newGradeData)
        .expect(403);
    });

    it('should validate required fields', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const invalidData = {
        feedback: 'Missing required fields'
        // Missing studentId, subjectId, score, maxScore
      };

      await request(app)
        .post('/api/grades')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData)
        .expect(400);
    });

    it('should validate score is not greater than maxScore', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const invalidScoreData = {
        studentId: testUser.id,
        subjectId: testSubject.id,
        classId: testClass.id,
        score: 110, // Greater than maxScore
        maxScore: 100
      };

      await request(app)
        .post('/api/grades')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidScoreData)
        .expect(400);
    });

    it('should validate score is non-negative', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const negativeScoreData = {
        studentId: testUser.id,
        subjectId: testSubject.id,
        classId: testClass.id,
        score: -10,
        maxScore: 100
      };

      await request(app)
        .post('/api/grades')
        .set('Authorization', `Bearer ${token}`)
        .send(negativeScoreData)
        .expect(400);
    });

    it('should validate category is valid', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const invalidCategoryData = {
        studentId: testUser.id,
        subjectId: testSubject.id,
        classId: testClass.id,
        score: 85,
        maxScore: 100,
        category: 'invalid_category'
      };

      await request(app)
        .post('/api/grades')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidCategoryData)
        .expect(400);
    });

    it('should return 404 if student not found', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const gradeData = {
        studentId: 999, // Non-existent student
        subjectId: testSubject.id,
        classId: testClass.id,
        score: 85,
        maxScore: 100
      };

      User.findByPk.mockResolvedValue(null);

      await request(app)
        .post('/api/grades')
        .set('Authorization', `Bearer ${token}`)
        .send(gradeData)
        .expect(404);
    });

    it('should return 400 if grade already exists for assignment submission', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const duplicateGradeData = {
        studentId: testUser.id,
        subjectId: testSubject.id,
        classId: testClass.id,
        assignmentId: testAssignment.id,
        submissionId: testSubmission.id,
        score: 85,
        maxScore: 100
      };

      User.findByPk.mockResolvedValue(testUser);
      Subject.findByPk.mockResolvedValue(testSubject);
      Class.findByPk.mockResolvedValue(testClass);
      Assignment.findByPk.mockResolvedValue(testAssignment);
      Submission.findByPk.mockResolvedValue(testSubmission);
      
      Grade.findOne.mockResolvedValue(testGrade); // Existing grade

      await request(app)
        .post('/api/grades')
        .set('Authorization', `Bearer ${token}`)
        .send(duplicateGradeData)
        .expect(400);
    });
  });

  describe('PUT /api/grades/:id', () => {
    it('should update grade as grader teacher', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const updateData = {
        score: 88,
        feedback: 'Good improvement on the concepts',
        weight: 1.5
      };

      Grade.findByPk.mockResolvedValue({ ...testGrade, gradedBy: teacherUser.id });
      Grade.update.mockResolvedValue([1]);
      
      const updatedGrade = { 
        ...testGrade, 
        ...updateData, 
        percentage: 88,
        letterGrade: 'B+',
        gpa: 3.3
      };
      Grade.findByPk.mockResolvedValueOnce(updatedGrade);

      const response = await request(app)
        .put(`/api/grades/${testGrade.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.score).toBe(updateData.score);
      expect(response.body.feedback).toBe(updateData.feedback);
      expect(response.body.percentage).toBe(88);
    });

    it('should allow admin to update any grade', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      const updateData = { score: 95, feedback: 'Admin updated grade' };

      Grade.findByPk.mockResolvedValue(testGrade);
      Grade.update.mockResolvedValue([1]);
      
      const updatedGrade = { ...testGrade, ...updateData };
      Grade.findByPk.mockResolvedValueOnce(updatedGrade);

      await request(app)
        .put(`/api/grades/${testGrade.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);
    });

    it('should return 403 for non-grader teacher', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const anotherTeacherGrade = { ...testGrade, gradedBy: 999 };
      
      Grade.findByPk.mockResolvedValue(anotherTeacherGrade);

      await request(app)
        .put(`/api/grades/${testGrade.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ score: 90 })
        .expect(403);
    });

    it('should return 403 for students', async () => {
      const token = generateTestToken(testUser.id, testUser.role);

      await request(app)
        .put(`/api/grades/${testGrade.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ score: 100 })
        .expect(403);
    });

    it('should return 404 for non-existent grade', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      Grade.findByPk.mockResolvedValue(null);

      await request(app)
        .put('/api/grades/999')
        .set('Authorization', `Bearer ${token}`)
        .send({ score: 90 })
        .expect(404);
    });

    it('should validate updated score constraints', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const invalidUpdateData = {
        score: 150, // Greater than maxScore (100)
      };

      Grade.findByPk.mockResolvedValue({ ...testGrade, gradedBy: teacherUser.id });

      await request(app)
        .put(`/api/grades/${testGrade.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(invalidUpdateData)
        .expect(400);
    });
  });

  describe('DELETE /api/grades/:id', () => {
    it('should delete grade as grader teacher if not published', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const unpublishedGrade = { 
        ...testGrade, 
        gradedBy: teacherUser.id,
        isPublished: false
      };
      
      Grade.findByPk.mockResolvedValue(unpublishedGrade);
      Grade.destroy.mockResolvedValue(1);

      const response = await request(app)
        .delete(`/api/grades/${testGrade.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('xóa thành công');
    });

    it('should return 400 if grade is already published', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const publishedGrade = { 
        ...testGrade, 
        gradedBy: teacherUser.id,
        isPublished: true
      };
      
      Grade.findByPk.mockResolvedValue(publishedGrade);

      await request(app)
        .delete(`/api/grades/${testGrade.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });

    it('should allow admin to delete any unpublished grade', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      const unpublishedGrade = { 
        ...testGrade,
        isPublished: false
      };
      
      Grade.findByPk.mockResolvedValue(unpublishedGrade);
      Grade.destroy.mockResolvedValue(1);

      await request(app)
        .delete(`/api/grades/${testGrade.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should return 403 for students', async () => {
      const token = generateTestToken(testUser.id, testUser.role);

      await request(app)
        .delete(`/api/grades/${testGrade.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('PUT /api/grades/:id/publish', () => {
    it('should publish/unpublish grade as grader teacher', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const publishData = { isPublished: false };

      Grade.findByPk.mockResolvedValue({ ...testGrade, gradedBy: teacherUser.id });
      Grade.update.mockResolvedValue([1]);

      const response = await request(app)
        .put(`/api/grades/${testGrade.id}/publish`)
        .set('Authorization', `Bearer ${token}`)
        .send(publishData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(Grade.update).toHaveBeenCalledWith(
        { isPublished: false },
        { where: { id: testGrade.id } }
      );
    });

    it('should return 403 for non-grader teacher', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const anotherTeacherGrade = { ...testGrade, gradedBy: 999 };
      
      Grade.findByPk.mockResolvedValue(anotherTeacherGrade);

      await request(app)
        .put(`/api/grades/${testGrade.id}/publish`)
        .set('Authorization', `Bearer ${token}`)
        .send({ isPublished: true })
        .expect(403);
    });

    it('should return 403 for students', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const publishData = { isPublished: true };

      await request(app)
        .put(`/api/grades/${testGrade.id}/publish`)
        .set('Authorization', `Bearer ${token}`)
        .send(publishData)
        .expect(403);
    });
  });

  describe('GET /api/grades/student/:studentId/report', () => {
    it('should get student grade report as student owner', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      
      Grade.findAll.mockResolvedValue([testGrade]);
      
      // Mock grade calculations
      Grade.findAll
        .mockResolvedValueOnce([testGrade]) // All grades
        .mockResolvedValueOnce([testGrade]); // Current semester grades

      const response = await request(app)
        .get(`/api/grades/student/${testUser.id}/report`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('student');
      expect(response.body).toHaveProperty('overallGPA');
      expect(response.body).toHaveProperty('currentSemesterGPA');
      expect(response.body).toHaveProperty('gradesBySubject');
      expect(response.body).toHaveProperty('gradesByCategory');
      expect(response.body).toHaveProperty('totalCredits');
    });

    it('should allow teachers to view student reports in their class', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      
      Grade.findAll.mockResolvedValue([testGrade]);
      User.findByPk.mockResolvedValue(testUser);

      await request(app)
        .get(`/api/grades/student/${testUser.id}/report?classId=1`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should return 403 for students viewing other students reports', async () => {
      const token = generateTestToken(testUser.id, testUser.role);

      await request(app)
        .get('/api/grades/student/999/report') // Different student
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should allow admin to view any student report', async () => {
      const token = generateTestToken(adminUser.id, adminUser.role);
      
      Grade.findAll.mockResolvedValue([testGrade]);
      User.findByPk.mockResolvedValue(testUser);

      await request(app)
        .get(`/api/grades/student/${testUser.id}/report`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should filter report by semester and academic year', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      
      Grade.findAll.mockResolvedValue([testGrade]);

      await request(app)
        .get(`/api/grades/student/${testUser.id}/report?semester=1&academicYear=2024-2025`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Grade.findAll).toHaveBeenCalledWith({
        where: { 
          studentId: testUser.id, 
          semester: 1, 
          academicYear: '2024-2025',
          isPublished: true 
        },
        include: expect.any(Array)
      });
    });
  });

  describe('GET /api/grades/class/:classId/stats', () => {
    it('should get class grade statistics as teacher', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      
      Grade.findAll.mockResolvedValue([
        { ...testGrade, score: 85 },
        { ...testGrade, score: 92 },
        { ...testGrade, score: 78 },
        { ...testGrade, score: 88 }
      ]);

      const response = await request(app)
        .get(`/api/grades/class/${testClass.id}/stats`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalGrades');
      expect(response.body).toHaveProperty('averageScore');
      expect(response.body).toHaveProperty('medianScore');
      expect(response.body).toHaveProperty('highestScore');
      expect(response.body).toHaveProperty('lowestScore');
      expect(response.body).toHaveProperty('gradeDistribution');
      expect(response.body).toHaveProperty('passRate');
    });

    it('should return 403 for students without permission', async () => {
      const token = generateTestToken(testUser.id, testUser.role);

      await request(app)
        .get(`/api/grades/class/${testClass.id}/stats`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should filter statistics by assignment', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      
      Grade.findAll.mockResolvedValue([testGrade]);

      await request(app)
        .get(`/api/grades/class/${testClass.id}/stats?assignmentId=1`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Grade.findAll).toHaveBeenCalledWith({
        where: { classId: testClass.id, assignmentId: 1, isPublished: true },
        include: expect.any(Array)
      });
    });
  });

  describe('POST /api/grades/bulk-create', () => {
    it('should bulk create grades as teacher', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const bulkGradeData = {
        grades: [
          {
            studentId: 1,
            subjectId: testSubject.id,
            classId: testClass.id,
            assignmentId: testAssignment.id,
            score: 85,
            maxScore: 100
          },
          {
            studentId: 2,
            subjectId: testSubject.id,
            classId: testClass.id,
            assignmentId: testAssignment.id,
            score: 92,
            maxScore: 100
          }
        ]
      };

      Grade.bulkCreate.mockResolvedValue([
        { id: 1, ...bulkGradeData.grades[0], gradedBy: teacherUser.id },
        { id: 2, ...bulkGradeData.grades[1], gradedBy: teacherUser.id }
      ]);

      const response = await request(app)
        .post('/api/grades/bulk-create')
        .set('Authorization', `Bearer ${token}`)
        .send(bulkGradeData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('thành công');
      expect(response.body).toHaveProperty('created');
      expect(response.body.created).toBe(2);
    });

    it('should return 403 for students', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const bulkGradeData = {
        grades: [{ studentId: 1, score: 85 }]
      };

      await request(app)
        .post('/api/grades/bulk-create')
        .set('Authorization', `Bearer ${token}`)
        .send(bulkGradeData)
        .expect(403);
    });

    it('should validate grades array', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const invalidData = {
        grades: 'not an array'
      };

      await request(app)
        .post('/api/grades/bulk-create')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData)
        .expect(400);
    });

    it('should validate each grade in the array', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const invalidGradesData = {
        grades: [
          {
            // Missing required fields
            score: 85
          }
        ]
      };

      await request(app)
        .post('/api/grades/bulk-create')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidGradesData)
        .expect(400);
    });
  });

  describe('PUT /api/grades/bulk-publish', () => {
    it('should bulk publish grades as teacher', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const publishData = {
        gradeIds: [1, 2, 3],
        isPublished: true
      };

      Grade.findAll.mockResolvedValue([
        { id: 1, gradedBy: teacherUser.id },
        { id: 2, gradedBy: teacherUser.id },
        { id: 3, gradedBy: teacherUser.id }
      ]);

      Grade.update.mockResolvedValue([3]);

      const response = await request(app)
        .put('/api/grades/bulk-publish')
        .set('Authorization', `Bearer ${token}`)
        .send(publishData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('thành công');
      expect(Grade.update).toHaveBeenCalledWith(
        { isPublished: true },
        { where: { id: [1, 2, 3] } }
      );
    });

    it('should return 403 if user doesnt own all grades', async () => {
      const token = generateTestToken(teacherUser.id, teacherUser.role);
      const publishData = {
        gradeIds: [1, 2],
        isPublished: true
      };

      Grade.findAll.mockResolvedValue([
        { id: 1, gradedBy: teacherUser.id },
        { id: 2, gradedBy: 999 } // Different teacher
      ]);

      await request(app)
        .put('/api/grades/bulk-publish')
        .set('Authorization', `Bearer ${token}`)
        .send(publishData)
        .expect(403);
    });

    it('should return 403 for students', async () => {
      const token = generateTestToken(testUser.id, testUser.role);
      const publishData = {
        gradeIds: [1, 2],
        isPublished: true
      };

      await request(app)
        .put('/api/grades/bulk-publish')
        .set('Authorization', `Bearer ${token}`)
        .send(publishData)
        .expect(403);
    });
  });
});