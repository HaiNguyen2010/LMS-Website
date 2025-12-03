const { User, Class, Subject, Lesson, Assignment, Submission, Notification, Grade, TeacherAssignment, ClassStudent } = require('../models');
const { Op } = require('sequelize');

/**
 * Get admin dashboard statistics
 * GET /api/v1/dashboard/admin/stats
 */
exports.getAdminStats = async (req, res) => {
  try {
    const { timeRange = 'week' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (timeRange) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 7));
    }

    // Parallel queries for better performance
    const [
      totalUsers,
      totalStudents,
      totalTeachers,
      totalAdmins,
      totalClasses,
      totalSubjects,
      totalLessons,
      totalAssignments,
      totalSubmissions,
      totalNotifications,
      totalGrades,
      recentUsers,
      recentClasses,
      studentsLastPeriod,
      teachersLastPeriod,
      classesLastPeriod,
    ] = await Promise.all([
      // Total counts
      User.count(),
      User.count({ where: { role: 'student' } }),
      User.count({ where: { role: 'teacher' } }),
      User.count({ where: { role: 'admin' } }),
      Class.count(),
      Subject.count(),
      Lesson.count(),
      Assignment.count(),
      Submission.count(),
      Notification.count(),
      Grade.count(),

      // Recent activities
      User.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'name', 'email', 'role', 'createdAt'],
      }),
      Class.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'name', 'code', 'createdAt'],
      }),

      // Growth calculation (previous period)
      User.count({
        where: {
          role: 'student',
          createdAt: { [Op.lt]: startDate },
        },
      }),
      User.count({
        where: {
          role: 'teacher',
          createdAt: { [Op.lt]: startDate },
        },
      }),
      Class.count({
        where: {
          createdAt: { [Op.lt]: startDate },
        },
      }),
    ]);

    // Calculate growth percentages
    const userGrowth = studentsLastPeriod + teachersLastPeriod > 0
      ? Math.round(((totalStudents + totalTeachers - studentsLastPeriod - teachersLastPeriod) / (studentsLastPeriod + teachersLastPeriod)) * 100)
      : 0;
    const classGrowth = classesLastPeriod > 0
      ? Math.round(((totalClasses - classesLastPeriod) / classesLastPeriod) * 100)
      : 0;

    // Format recent activities
    const recentActivities = [];
    
    recentUsers.forEach((user) => {
      recentActivities.push({
        id: user.id,
        type: 'user',
        name: `${user.name} đã đăng ký tài khoản ${
          user.role === 'student' ? 'học sinh' : user.role === 'teacher' ? 'giáo viên' : 'quản trị viên'
        }`,
        createdAt: user.createdAt,
      });
    });

    recentClasses.forEach((cls) => {
      recentActivities.push({
        id: cls.id,
        type: 'class',
        name: `Lớp học "${cls.name}" (${cls.code}) đã được tạo`,
        createdAt: cls.createdAt,
      });
    });

    // Sort activities by timestamp
    recentActivities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Response
    res.json({
      success: true,
      data: {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalClasses,
        totalSubjects,
        totalLessons,
        totalAssignments,
        totalSubmissions,
        totalNotifications,
        totalGrades,
        userGrowth,
        classGrowth,
        recentActivities: recentActivities.slice(0, 10),
        userDistribution: {
          students: totalStudents,
          teachers: totalTeachers,
          admins: totalAdmins,
        },
        timeRange,
      },
    });
  } catch (error) {
    console.error('Error getting admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê',
      error: error.message,
    });
  }
};

/**
 * Get teacher dashboard statistics
 * GET /api/v1/dashboard/teacher/stats
 */
exports.getTeacherStats = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Get all classes where teacher has assignments
    const teacherAssignments = await require('../models').TeacherAssignment.findAll({
      where: { teacherId, isActive: true },
      attributes: ['classId', 'subjectId'],
    });

    const classIds = [...new Set(teacherAssignments.map(ta => ta.classId))];

    const [
      totalAssignments,
      pendingSubmissions,
      totalLessons,
    ] = await Promise.all([
      // Count assignments created by this teacher
      Assignment.count({
        where: {
          createdBy: teacherId,
        },
      }),
      // Count pending submissions (submitted but not graded) for this teacher's assignments
      Submission.count({
        where: { 
          status: 'submitted',
          grade: null,
        },
        include: [{
          model: Assignment,
          as: 'submissionAssignment',
          where: {
            createdBy: teacherId,
          },
        }],
      }),
      // Count lessons created by this teacher
      require('../models').Lesson.count({
        where: {
          createdBy: teacherId,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalClasses: classIds.length,
        totalAssignments,
        totalLessons,
        pendingGrades: pendingSubmissions,
      },
    });
  } catch (error) {
    console.error('Error getting teacher stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê',
      error: error.message,
    });
  }
};

/**
 * Get student dashboard statistics
 * GET /api/v1/dashboard/student/stats
 */
exports.getStudentStats = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { ClassStudent } = require('../models');

    const [
      enrolledClasses,
      totalAssignments,
      completedSubmissions,
      pendingAssignments,
      myGrades,
    ] = await Promise.all([
      ClassStudent.count({
        where: { studentId },
      }),
      Assignment.count({
        include: [{
          model: Class,
          as: 'assignmentClass',
          include: [{
            model: ClassStudent,
            as: 'students',
            where: { studentId },
            required: true
          }],
          required: true
        }],
      }),
      Submission.count({
        where: { 
          studentId,
          status: 'graded',
        },
      }),
      Assignment.count({
        include: [{
          model: Class,
          as: 'assignmentClass',
          include: [{
            model: ClassStudent,
            as: 'students',
            where: { studentId },
            required: true
          }],
          required: true
        }],
        where: {
          id: {
            [Op.notIn]: require('../models').sequelize.literal(
              `(SELECT assignmentId FROM Submissions WHERE studentId = ${studentId})`
            ),
          },
        },
      }),
      Grade.findAll({
        where: { studentId },
        attributes: ['gradeValue', 'weight', 'gradeType'],
      }),
    ]);

    // Calculate weighted average grade
    let averageGrade = 0;
    if (myGrades.length > 0) {
      // Tính tổng (điểm * trọng số) và tổng trọng số
      const totalWeightedGrade = myGrades.reduce((sum, grade) => {
        const gradeValue = parseFloat(grade.gradeValue) || 0;
        const weight = parseFloat(grade.weight) || 1.0;
        return sum + (gradeValue * weight);
      }, 0);
      
      const totalWeight = myGrades.reduce((sum, grade) => {
        return sum + (parseFloat(grade.weight) || 1.0);
      }, 0);
      
      // Điểm trung bình có trọng số = (Σ điểm * trọng số) / (Σ trọng số)
      averageGrade = totalWeight > 0 
        ? (totalWeightedGrade / totalWeight).toFixed(2) // Format 2 chữ số thập phân
        : "0.00";
    }

    res.json({
      success: true,
      data: {
        enrolledClasses,
        totalAssignments,
        completedAssignments: completedSubmissions,
        pendingAssignments,
        averageGrade: parseFloat(averageGrade), // Convert về number
        totalGrades: myGrades.length,
      },
    });
  } catch (error) {
    console.error('Error getting student stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê',
      error: error.message,
    });
  }
};

/**
 * Get grade statistics for school
 * GET /api/v1/dashboard/grades/school-stats
 */
exports.getSchoolGradeStats = async (req, res) => {
  try {
    const { academicYear, term } = req.query;
    const { ClassStudent } = require('../models');

    // Build where clause
    const whereClause = {};
    if (academicYear) {
      whereClause.academicYear = academicYear;
    }
    if (term) {
      whereClause.term = term;
    }

    // Get active students only
    const activeStudents = await ClassStudent.findAll({
      where: { status: 'active' },
      attributes: ['studentId'],
    });
    const activeStudentIds = [...new Set(activeStudents.map(s => s.studentId))];

    // Get all grades with filters - only for active students
    const grades = await Grade.findAll({
      where: {
        ...whereClause,
        studentId: activeStudentIds.length > 0 ? activeStudentIds : [-1], // -1 to return empty if no active students
      },
      include: [
        {
          model: User,
          as: 'gradeStudent',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Subject,
          as: 'gradeSubject',
          attributes: ['id', 'name'],
        },
        {
          model: Class,
          as: 'gradeClass',
          attributes: ['id', 'name', 'code'],
        },
      ],
      attributes: ['gradeValue', 'gradeType', 'term', 'academicYear', 'weight'],
    });

    // Calculate statistics by grade type
    const statsByType = {
      midterm: { count: 0, total: 0, weightedTotal: 0, totalWeight: 0, average: 0, min: 10, max: 0 },
      final: { count: 0, total: 0, weightedTotal: 0, totalWeight: 0, average: 0, min: 10, max: 0 },
      homework: { count: 0, total: 0, weightedTotal: 0, totalWeight: 0, average: 0, min: 10, max: 0 },
      quiz: { count: 0, total: 0, weightedTotal: 0, totalWeight: 0, average: 0, min: 10, max: 0 },
      assignment: { count: 0, total: 0, weightedTotal: 0, totalWeight: 0, average: 0, min: 10, max: 0 },
    };

    // Calculate statistics by term
    const statsByTerm = {
      '1': { count: 0, total: 0, weightedTotal: 0, totalWeight: 0, average: 0 },
      '2': { count: 0, total: 0, weightedTotal: 0, totalWeight: 0, average: 0 },
      'final': { count: 0, total: 0, weightedTotal: 0, totalWeight: 0, average: 0 },
    };

    // Calculate statistics by class
    const statsByClass = {};

    // Calculate statistics by class AND term (for term averages)
    const classByTerm = {
      '1': {},
      '2': {},
      'final': {}
    };

    // Process each grade
    grades.forEach((grade) => {
      const value = parseFloat(grade.gradeValue);
      const weight = parseFloat(grade.weight) || 1;
      const classId = grade.gradeClass.id;
      const term = grade.term ? String(grade.term) : 'final';
      
      // By type
      if (statsByType[grade.gradeType]) {
        statsByType[grade.gradeType].count++;
        statsByType[grade.gradeType].total += value;
        statsByType[grade.gradeType].weightedTotal += value * weight;
        statsByType[grade.gradeType].totalWeight += weight;
        statsByType[grade.gradeType].min = Math.min(statsByType[grade.gradeType].min, value);
        statsByType[grade.gradeType].max = Math.max(statsByType[grade.gradeType].max, value);
      }

      // By class
      if (!statsByClass[classId]) {
        statsByClass[classId] = {
          classId,
          className: grade.gradeClass.name,
          classCode: grade.gradeClass.code,
          count: 0,
          total: 0,
          weightedTotal: 0,
          totalWeight: 0,
          average: 0,
        };
      }
      statsByClass[classId].count++;
      statsByClass[classId].total += value;
      statsByClass[classId].weightedTotal += value * weight;
      statsByClass[classId].totalWeight += weight;

      // By class AND term (for calculating term averages from class averages)
      if (!classByTerm[term][classId]) {
        classByTerm[term][classId] = {
          weightedTotal: 0,
          totalWeight: 0,
          average: 0,
          count: 0 // Số điểm
        };
      }
      classByTerm[term][classId].weightedTotal += value * weight;
      classByTerm[term][classId].totalWeight += weight;
      classByTerm[term][classId].count++; // Đếm số điểm
    });

    // Calculate averages with weights
    Object.keys(statsByType).forEach((type) => {
      if (statsByType[type].count > 0) {
        // Weighted average
        if (statsByType[type].totalWeight > 0) {
          statsByType[type].average = Math.round(
            (statsByType[type].weightedTotal / statsByType[type].totalWeight) * 100
          ) / 100;
        } else {
          // Fallback to simple average if no weights
          statsByType[type].average = Math.round(
            (statsByType[type].total / statsByType[type].count) * 100
          ) / 100;
        }
      }
      if (statsByType[type].count === 0) {
        statsByType[type].min = 0;
      }
    });

    // Calculate average for each class in each term
    Object.keys(classByTerm).forEach(term => {
      Object.keys(classByTerm[term]).forEach(classId => {
        const classData = classByTerm[term][classId];
        if (classData.totalWeight > 0) {
          classData.average = classData.weightedTotal / classData.totalWeight;
        }
      });
    });

    // Calculate term averages as AVERAGE OF CLASS AVERAGES (same as overall and ClassStatistics)
    Object.keys(statsByTerm).forEach((term) => {
      const classAverages = Object.values(classByTerm[term])
        .map(c => c.average)
        .filter(avg => avg > 0);

      if (classAverages.length > 0) {
        const sum = classAverages.reduce((acc, avg) => acc + avg, 0);
        statsByTerm[term].average = Math.round((sum / classAverages.length) * 100) / 100;
        
        // Count: Tổng số điểm của tất cả các lớp trong học kỳ
        statsByTerm[term].count = Object.values(classByTerm[term]).reduce((total, classData) => total + classData.count, 0);
        
        // Calculate weighted totals for reference
        let totalWeightedSum = 0;
        let totalWeightSum = 0;
        Object.values(classByTerm[term]).forEach(classData => {
          totalWeightedSum += classData.weightedTotal;
          totalWeightSum += classData.totalWeight;
        });
        statsByTerm[term].weightedTotal = Math.round(totalWeightedSum * 100) / 100;
        statsByTerm[term].totalWeight = Math.round(totalWeightSum * 100) / 100;
        statsByTerm[term].total = Math.round(sum * 100) / 100;
      } else {
        statsByTerm[term].average = 0;
        statsByTerm[term].count = 0;
        statsByTerm[term].total = 0;
        statsByTerm[term].weightedTotal = 0;
        statsByTerm[term].totalWeight = 0;
      }
    });

    // Calculate "final" (Tổng kết) as average of class averages from both terms combined
    const classAveragesFinal = Object.values(classByTerm['final'])
      .map(c => c.average)
      .filter(avg => avg > 0);
    
    if (classAveragesFinal.length > 0) {
      const sum = classAveragesFinal.reduce((acc, avg) => acc + avg, 0);
      statsByTerm['final'].average = Math.round((sum / classAveragesFinal.length) * 100) / 100;
      statsByTerm['final'].count = Object.values(classByTerm['final']).reduce((total, classData) => total + classData.count, 0);
    } else if (statsByTerm['1'].average > 0 && statsByTerm['2'].average > 0) {
      // If no final term grades, but both HK1 and HK2 exist, average them
      statsByTerm['final'].average = Math.round(((statsByTerm['1'].average + statsByTerm['2'].average) / 2) * 100) / 100;
      statsByTerm['final'].count = statsByTerm['1'].count + statsByTerm['2'].count;
    } else if (statsByTerm['1'].average > 0) {
      // If only HK1
      statsByTerm['final'].average = statsByTerm['1'].average;
      statsByTerm['final'].count = statsByTerm['1'].count;
    } else if (statsByTerm['2'].average > 0) {
      // If only HK2
      statsByTerm['final'].average = statsByTerm['2'].average;
      statsByTerm['final'].count = statsByTerm['2'].count;
    }

    Object.values(statsByClass).forEach((classStats) => {
      if (classStats.count > 0) {
        // Weighted average
        if (classStats.totalWeight > 0) {
          classStats.average = parseFloat(
            (classStats.weightedTotal / classStats.totalWeight).toFixed(2)
          );
        } else {
          // Fallback to simple average if no weights
          classStats.average = parseFloat(
            (classStats.total / classStats.count).toFixed(2)
          );
        }
      }
    });

    // Overall statistics - calculate as average of class averages (same as getClassStatistics)
    const totalGrades = grades.length;
    let overallAverage = 0;
    
    // Get classes with grades > 0 and calculate average of their averages
    const classesWithGrades = Object.values(statsByClass).filter(c => c.average > 0);
    if (classesWithGrades.length > 0) {
      const sumOfClassAverages = classesWithGrades.reduce((sum, c) => sum + c.average, 0);
      overallAverage = Math.round((sumOfClassAverages / classesWithGrades.length) * 100) / 100;
    }

    res.json({
      success: true,
      data: {
        filters: {
          academicYear: academicYear || 'all',
          term: term || 'all',
        },
        overall: {
          totalGrades,
          average: overallAverage,
        },
        byType: statsByType,
        byTerm: statsByTerm,
        byClass: Object.values(statsByClass).sort((a, b) => b.average - a.average),
      },
    });
  } catch (error) {
    console.error('Error getting school grade stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê điểm',
      error: error.message,
    });
  }
};

/**
 * Get grade statistics for a specific class
 * GET /api/v1/dashboard/grades/class-stats/:classId
 */
exports.getClassGradeStats = async (req, res) => {
  try {
    const { classId } = req.params;
    const { academicYear, term, gradeType } = req.query;

    // Build where clause
    const whereClause = { classId };
    if (academicYear) {
      whereClause.academicYear = academicYear;
    }
    if (term) {
      whereClause.term = term;
    }
    if (gradeType) {
      whereClause.gradeType = gradeType;
    }

    // Get class info
    const classInfo = await Class.findByPk(classId, {
      attributes: ['id', 'name', 'code'],
    });

    if (!classInfo) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học',
      });
    }

    // Get all grades for this class
    const grades = await Grade.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'gradeStudent',
          attributes: ['id', 'name', 'email', 'code'],
        },
        {
          model: Subject,
          as: 'gradeSubject',
          attributes: ['id', 'name'],
        },
      ],
      attributes: ['gradeValue', 'gradeType', 'term', 'academicYear', 'weight', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });

    // Calculate statistics by student
    const statsByStudent = {};
    
    grades.forEach((grade) => {
      const studentId = grade.gradeStudent.id;
      if (!statsByStudent[studentId]) {
        statsByStudent[studentId] = {
          studentId,
          studentName: grade.gradeStudent.name,
          studentCode: grade.gradeStudent.code,
          studentEmail: grade.gradeStudent.email,
          grades: {
            midterm: [],
            final: [],
            homework: [],
            quiz: [],
            assignment: [],
          },
          averages: {
            midterm: 0,
            final: 0,
            homework: 0,
            overall: 0,
          },
        };
      }

      const value = parseFloat(grade.gradeValue);
      const weight = parseFloat(grade.weight) || 1;
      if (statsByStudent[studentId].grades[grade.gradeType]) {
        statsByStudent[studentId].grades[grade.gradeType].push({
          value,
          weight,
          term: grade.term,
          academicYear: grade.academicYear,
          subject: grade.gradeSubject.name,
        });
      }
    });

    // Calculate weighted averages for each student
    Object.values(statsByStudent).forEach((student) => {
      let totalWeightedScore = 0;
      let totalWeight = 0;

      Object.keys(student.grades).forEach((type) => {
        const gradesList = student.grades[type];
        if (gradesList.length > 0) {
          // Calculate weighted average for this grade type
          const typeWeightedTotal = gradesList.reduce((sum, g) => sum + (g.value * g.weight), 0);
          const typeWeightTotal = gradesList.reduce((sum, g) => sum + g.weight, 0);
          
          if (typeWeightTotal > 0) {
            student.averages[type] = parseFloat((typeWeightedTotal / typeWeightTotal).toFixed(2));
            totalWeightedScore += typeWeightedTotal;
            totalWeight += typeWeightTotal;
          } else {
            // Fallback to simple average
            const avg = gradesList.reduce((sum, g) => sum + g.value, 0) / gradesList.length;
            student.averages[type] = parseFloat(avg.toFixed(2));
            totalWeightedScore += avg * gradesList.length;
            totalWeight += gradesList.length;
          }
        }
      });

      if (totalWeight > 0) {
        student.averages.overall = parseFloat((totalWeightedScore / totalWeight).toFixed(2));
      }
    });

    // Overall class statistics with weighted average
    let classAverage = 0;
    if (grades.length > 0) {
      const totalWeightedScore = grades.reduce((sum, g) => {
        const value = parseFloat(g.gradeValue);
        const weight = parseFloat(g.weight) || 1;
        return sum + (value * weight);
      }, 0);
      const totalWeight = grades.reduce((sum, g) => sum + (parseFloat(g.weight) || 1), 0);
      
      if (totalWeight > 0) {
        classAverage = parseFloat((totalWeightedScore / totalWeight).toFixed(2));
      } else {
        // Fallback to simple average
        const allGradeValues = grades.map(g => parseFloat(g.gradeValue));
        classAverage = parseFloat((allGradeValues.reduce((sum, v) => sum + v, 0) / allGradeValues.length).toFixed(2));
      }
    }
    
    const allGradeValues = grades.map(g => parseFloat(g.gradeValue));
    const classMin = allGradeValues.length > 0 ? Math.min(...allGradeValues) : 0;
    const classMax = allGradeValues.length > 0 ? Math.max(...allGradeValues) : 0;

    // Grade distribution
    const distribution = {
      excellent: allGradeValues.filter(v => v >= 9).length,  // Giỏi
      good: allGradeValues.filter(v => v >= 7 && v < 9).length,  // Khá
      average: allGradeValues.filter(v => v >= 5 && v < 7).length,  // Trung bình
      below: allGradeValues.filter(v => v < 5).length,  // Yếu
    };

    res.json({
      success: true,
      data: {
        classInfo: {
          id: classInfo.id,
          name: classInfo.name,
          code: classInfo.code,
        },
        filters: {
          academicYear: academicYear || 'all',
          term: term || 'all',
          gradeType: gradeType || 'all',
        },
        overall: {
          totalGrades: grades.length,
          totalStudents: Object.keys(statsByStudent).length,
          average: classAverage,
          min: classMin,
          max: classMax,
        },
        distribution,
        studentStats: Object.values(statsByStudent).sort((a, b) => b.averages.overall - a.averages.overall),
      },
    });
  } catch (error) {
    console.error('Error getting class grade stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê điểm lớp',
      error: error.message,
    });
  }
};

// Get class statistics for admin
exports.getClassStatistics = async (req, res) => {
  try {
    const { academicYear, term } = req.query;
    const { ClassStudent, TeacherAssignment } = require('../models');

    // Build where clause for grades
    const gradeWhere = {};
    if (term) {
      gradeWhere.term = parseInt(term);
    }
    if (academicYear) {
      gradeWhere.academicYear = academicYear;
    }

    // Get all classes with related data
    const classes = await Class.findAll({
      include: [
        {
          model: ClassStudent,
          as: 'students',
          attributes: ['status'],
          include: [
            {
              model: User,
              as: 'student',
              attributes: ['id', 'name'],
            }
          ]
        },
      ],
      order: [['name', 'ASC']],
    });

    // Calculate statistics for each class
    const classStats = await Promise.all(
      classes.map(async (classItem) => {
        const enrollments = classItem.students || [];
        const totalStudents = enrollments.length;
        const activeStudents = enrollments.filter(e => e.status === 'active').length;
        const inactiveStudents = enrollments.filter(e => e.status === 'inactive').length;

        // Get student IDs for active enrollments
        const activeStudentIds = enrollments
          .filter(e => e.status === 'active' && e.student)
          .map(e => e.student.id);

        // Get teacher assignments for this class to count subjects and teachers
        const teacherAssignments = await TeacherAssignment.findAll({
          where: { classId: classItem.id },
          include: [
            {
              model: Subject,
              as: 'assignmentSubject',
              attributes: ['id', 'name'],
            },
            {
              model: User,
              as: 'teacher',
              attributes: ['id', 'name'],
            },
          ],
        });

        const uniqueSubjects = [...new Set(teacherAssignments.map(ta => ta.assignmentSubject?.name).filter(Boolean))];
        const uniqueTeachers = [...new Set(teacherAssignments.map(ta => ta.teacher?.name).filter(Boolean))];

        // Calculate average grade for active students in this class (with weights)
        let averageGrade = 0;
        if (activeStudentIds.length > 0) {
          const grades = await Grade.findAll({
            where: {
              ...gradeWhere,
              studentId: activeStudentIds,
              classId: classItem.id,
            },
            attributes: ['gradeValue', 'weight'],
          });

          if (grades.length > 0) {
            const validGrades = grades.filter(g => g.gradeValue !== null);
            if (validGrades.length > 0) {
              // Calculate weighted average (same logic as GradeStatistics)
              let weightedTotal = 0;
              let totalWeight = 0;
              
              validGrades.forEach(g => {
                const value = parseFloat(g.gradeValue);
                const weight = parseFloat(g.weight) || 1;
                weightedTotal += value * weight;
                totalWeight += weight;
              });
              
              if (totalWeight > 0) {
                averageGrade = weightedTotal / totalWeight;
              } else {
                // Fallback to simple average if no weights
                const sum = validGrades.reduce((acc, g) => acc + parseFloat(g.gradeValue), 0);
                averageGrade = sum / validGrades.length;
              }
            }
          }
        }

        return {
          id: classItem.id,
          name: classItem.name,
          code: classItem.code,
          grade: classItem.grade || 'N/A',
          totalStudents,
          activeStudents,
          inactiveStudents,
          totalSubjects: uniqueSubjects.length,
          subjectName: uniqueSubjects.join(', ') || null,
          teacherCount: uniqueTeachers.length,
          teacherName: uniqueTeachers.join(', ') || null,
          averageGrade: Math.round(averageGrade * 100) / 100,
        };
      })
    );

    // Tính toán thống kê tổng hợp
    const totalStudents = classStats.reduce((sum, cls) => sum + cls.totalStudents, 0);
    const totalActiveStudents = classStats.reduce((sum, cls) => sum + cls.activeStudents, 0);
    const avgStudentsPerClass = classStats.length > 0 ? Math.round(totalStudents / classStats.length) : 0;
    
    // Chỉ tính điểm trung bình cho những lớp có điểm > 0
    const classesWithGrades = classStats.filter(cls => cls.averageGrade > 0);
    const overallAvgGrade = classesWithGrades.length > 0
      ? Math.round((classesWithGrades.reduce((sum, cls) => sum + cls.averageGrade, 0) / classesWithGrades.length) * 100) / 100
      : 0;

    res.json({
      success: true,
      message: 'Thống kê lớp học thành công',
      data: {
        data: classStats,
        summary: {
          totalClasses: classStats.length,
          totalStudents,
          totalActiveStudents,
          avgStudentsPerClass,
          overallAvgGrade,
          classesWithGrades: classesWithGrades.length,
        },
      },
    });
  } catch (error) {
    console.error('Error getting class statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê lớp học',
      error: error.message,
    });
  }
};

// Get teacher statistics for admin
exports.getTeacherStatistics = async (req, res) => {
  try {
    const { academicYear, term } = req.query;
    const { ClassStudent, TeacherAssignment } = require('../models');

    // Build where clause for grades
    const gradeWhere = {};
    if (term) {
      gradeWhere.term = parseInt(term);
    }
    if (academicYear) {
      gradeWhere.academicYear = academicYear;
    }

    // Get all teachers
    const teachers = await User.findAll({
      where: { role: 'teacher' },
      attributes: ['id', 'name', 'email', 'isActive'],
    });

    // Calculate statistics for each teacher
    const teacherStats = await Promise.all(
      teachers.map(async (teacher) => {
        // Get teacher assignments to find classes and subjects
        const teacherAssignments = await TeacherAssignment.findAll({
          where: { teacherId: teacher.id },
          include: [
            {
              model: Class,
              as: 'assignmentClass',
              include: [
                {
                  model: ClassStudent,
                  as: 'students',
                  where: { status: 'active' },
                  required: false,
                  attributes: ['studentId'],
                },
              ],
            },
            {
              model: Subject,
              as: 'assignmentSubject',
              attributes: ['id', 'name'],
            },
          ],
        });

        // Get unique classes and subjects
        const uniqueClasses = [...new Set(teacherAssignments.map(ta => ta.assignmentClass?.id).filter(Boolean))];
        const totalClasses = uniqueClasses.length;
        
        const subjects = [...new Set(teacherAssignments.map(ta => ta.assignmentSubject?.name).filter(Boolean))];
        const totalSubjects = subjects.length;

        // Get unique active students across all classes
        const studentIds = new Set();
        teacherAssignments.forEach(ta => {
          if (ta.assignmentClass && ta.assignmentClass.students) {
            ta.assignmentClass.students.forEach(s => studentIds.add(s.studentId));
          }
        });
        const totalStudents = studentIds.size;

        // Get assignments created by this teacher
        const assignments = await Assignment.findAll({
          where: { createdBy: teacher.id },
        });
        const assignmentCount = assignments.length;

        // Calculate average grade for all students in teacher's classes
        let averageGrade = 0;
        if (uniqueClasses.length > 0 && studentIds.size > 0) {
          const grades = await Grade.findAll({
            where: {
              ...gradeWhere,
              classId: uniqueClasses,
              studentId: Array.from(studentIds),
            },
            attributes: ['gradeValue'],
          });

          if (grades.length > 0) {
            const validGrades = grades.filter(g => g.gradeValue !== null);
            if (validGrades.length > 0) {
              const sum = validGrades.reduce((acc, g) => acc + parseFloat(g.gradeValue), 0);
              averageGrade = sum / validGrades.length;
            }
          }
        }

        return {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          avatar: null, // User model doesn't have avatar field
          totalClasses,
          totalSubjects,
          subjects,
          totalStudents,
          assignmentCount,
          averageGrade: Math.round(averageGrade * 100) / 100,
          activeStatus: teacher.isActive,
        };
      })
    );

    // Tính toán thống kê tổng hợp
    const totalStudents = teacherStats.reduce((sum, t) => sum + t.totalStudents, 0);
    const avgStudentsPerTeacher = teacherStats.length > 0 ? Math.round(totalStudents / teacherStats.length) : 0;
    const totalAssignments = teacherStats.reduce((sum, t) => sum + t.assignmentCount, 0);
    
    // Chỉ tính điểm trung bình cho những giáo viên có điểm > 0
    const teachersWithGrades = teacherStats.filter(t => t.averageGrade > 0);
    const overallAvgGrade = teachersWithGrades.length > 0
      ? Math.round((teachersWithGrades.reduce((sum, t) => sum + t.averageGrade, 0) / teachersWithGrades.length) * 100) / 100
      : 0;

    res.json({
      success: true,
      message: 'Thống kê giáo viên thành công',
      data: {
        data: teacherStats,
        summary: {
          totalTeachers: teacherStats.length,
          totalStudents,
          avgStudentsPerTeacher,
          totalAssignments,
          overallAvgGrade,
          teachersWithGrades: teachersWithGrades.length,
        },
      },
    });
  } catch (error) {
    console.error('Error getting teacher statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê giáo viên',
      error: error.message,
    });
  }
};

// Get academic performance statistics
exports.getAcademicPerformance = async (req, res) => {
  try {
    const { viewType = 'class', term, academicYear } = req.query;
    const { ClassStudent } = require('../models');

    // Build where clause for grades
    const gradeWhere = {};
    if (term) {
      gradeWhere.term = parseInt(term);
    }
    if (academicYear) {
      gradeWhere.academicYear = academicYear;
    }

    let performanceData = [];

    if (viewType === 'class') {
      // Get performance by class
      const classes = await Class.findAll({
        include: [
          {
            model: ClassStudent,
            as: 'students',
            where: { status: 'active' },
            required: false,
            attributes: ['studentId'],
          },
        ],
      });

      performanceData = await Promise.all(
        classes.map(async (classItem) => {
          const studentIds = classItem.students ? classItem.students.map(e => e.studentId) : [];
          const totalStudents = studentIds.length;

          if (totalStudents === 0) {
            return {
              id: classItem.id,
              name: classItem.name,
              type: 'class',
              code: classItem.code,
              totalStudents: 0,
              averageGrade: 0,
              excellentCount: 0,
              goodCount: 0,
              averageCount: 0,
              belowAverageCount: 0,
              passRate: 0,
            };
          }

          // Get grades for students in this class
          const grades = await Grade.findAll({
            where: {
              ...gradeWhere,
              classId: classItem.id,
              studentId: studentIds,
            },
            attributes: ['gradeValue', 'weight'], // Thêm weight
          });

          // Calculate statistics with weighted average (same as ClassStatistics)
          const validGrades = grades.filter(g => g.gradeValue !== null);
          let totalWeightedScore = 0;
          let totalWeight = 0;
          let excellentCount = 0;
          let goodCount = 0;
          let averageCount = 0;
          let belowAverageCount = 0;
          let passCount = 0;

          validGrades.forEach(g => {
            const grade = parseFloat(g.gradeValue);
            const weight = parseFloat(g.weight) || 1;
            
            totalWeightedScore += grade * weight;
            totalWeight += weight;

            if (grade >= 9) {
              excellentCount++; // Xuất sắc
              passCount++;
            } else if (grade >= 8) {
              goodCount++; // Giỏi
              passCount++;
            } else if (grade >= 7) {
              averageCount++; // Khá
              passCount++;
            } else if (grade >= 5) {
              belowAverageCount++; // Trung bình
              passCount++;
            } else {
              belowAverageCount++; // Yếu (< 5)
            }
          });

          // Weighted average (same as ClassStatistics)
          const averageGrade = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
          const passRate = validGrades.length > 0 ? (passCount / validGrades.length) * 100 : 0;

          return {
            id: classItem.id,
            name: classItem.name,
            type: 'class',
            code: classItem.code,
            totalStudents: totalStudents, // Số học sinh thực tế trong lớp
            averageGrade: Math.round(averageGrade * 100) / 100,
            excellentCount,
            goodCount,
            averageCount,
            belowAverageCount,
            passRate: Math.round(passRate * 100) / 100,
          };
        })
      );
    } else {
      // Get performance by subject
      const subjects = await Subject.findAll();

      performanceData = await Promise.all(
        subjects.map(async (subject) => {
          // Get all teacher assignments for this subject to find classes
          const teacherAssignments = await TeacherAssignment.findAll({
            where: { subjectId: subject.id },
            include: [
              {
                model: Class,
                as: 'assignmentClass',
                include: [
                  {
                    model: ClassStudent,
                    as: 'students',
                    where: { status: 'active' },
                    required: false,
                    attributes: ['studentId'],
                  },
                ],
              },
            ],
          });

          const classIds = [...new Set(teacherAssignments.map(ta => ta.assignmentClass?.id).filter(Boolean))];
          const allStudentIds = new Set();
          teacherAssignments.forEach(ta => {
            if (ta.assignmentClass && ta.assignmentClass.students) {
              ta.assignmentClass.students.forEach(s => allStudentIds.add(s.studentId));
            }
          });

          const totalStudents = allStudentIds.size;

          if (totalStudents === 0 || classIds.length === 0) {
            return {
              id: subject.id,
              name: subject.name,
              type: 'subject',
              code: subject.code,
              totalStudents: 0,
              averageGrade: 0,
              excellentCount: 0,
              goodCount: 0,
              averageCount: 0,
              belowAverageCount: 0,
              passRate: 0,
            };
          }

          // Get grades for all students in classes of this subject
          const grades = await Grade.findAll({
            where: {
              ...gradeWhere,
              classId: classIds,
              studentId: Array.from(allStudentIds),
            },
            attributes: ['gradeValue', 'weight'], // Thêm weight
          });

          // Calculate statistics with weighted average (same as ClassStatistics)
          const validGrades = grades.filter(g => g.gradeValue !== null);
          let totalWeightedScore = 0;
          let totalWeight = 0;
          let excellentCount = 0;
          let goodCount = 0;
          let averageCount = 0;
          let belowAverageCount = 0;
          let passCount = 0;

          validGrades.forEach(g => {
            const grade = parseFloat(g.gradeValue);
            const weight = parseFloat(g.weight) || 1;
            
            totalWeightedScore += grade * weight;
            totalWeight += weight;

            if (grade >= 9) {
              excellentCount++; // Xuất sắc
              passCount++;
            } else if (grade >= 8) {
              goodCount++; // Giỏi
              passCount++;
            } else if (grade >= 7) {
              averageCount++; // Khá
              passCount++;
            } else if (grade >= 5) {
              belowAverageCount++; // Trung bình
              passCount++;
            } else {
              belowAverageCount++; // Yếu (< 5)
            }
          });

          // Weighted average (same as ClassStatistics)
          const averageGrade = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
          const passRate = validGrades.length > 0 ? (passCount / validGrades.length) * 100 : 0;

          return {
            id: subject.id,
            name: subject.name,
            type: 'subject',
            code: subject.code,
            totalStudents: totalStudents, // Số học sinh thực tế học môn này
            averageGrade: Math.round(averageGrade * 100) / 100,
            excellentCount,
            goodCount,
            averageCount,
            belowAverageCount,
            passRate: Math.round(passRate * 100) / 100,
          };
        })
      );
    }

    // Sort by average grade descending
    performanceData.sort((a, b) => b.averageGrade - a.averageGrade);

    // Tính toán thống kê tổng hợp
    const totalItems = performanceData.length;
    const totalStudents = performanceData.reduce((sum, p) => sum + p.totalStudents, 0);
    const totalExcellent = performanceData.reduce((sum, p) => sum + p.excellentCount, 0);
    const totalGood = performanceData.reduce((sum, p) => sum + p.goodCount, 0);
    const totalAverage = performanceData.reduce((sum, p) => sum + p.averageCount, 0);
    const totalBelowAverage = performanceData.reduce((sum, p) => sum + p.belowAverageCount, 0);
    
    // Tính điểm trung bình tổng thể
    const itemsWithGrades = performanceData.filter(p => p.averageGrade > 0);
    const overallAvgGrade = itemsWithGrades.length > 0
      ? Math.round((itemsWithGrades.reduce((sum, p) => sum + p.averageGrade, 0) / itemsWithGrades.length) * 100) / 100
      : 0;
    
    // Tính tỷ lệ đạt tổng thể
    const overallPassRate = totalStudents > 0
      ? Math.round(((totalStudents - totalBelowAverage) / totalStudents) * 100 * 10) / 10
      : 0;

    res.json({
      success: true,
      message: 'Thống kê kết quả học tập thành công',
      data: {
        data: performanceData,
        summary: {
          totalItems,
          totalStudents,
          overallAvgGrade,
          overallPassRate,
          totalExcellent,
          totalGood,
          totalAverage,
          totalBelowAverage,
          itemsWithGrades: itemsWithGrades.length,
        },
      },
    });
  } catch (error) {
    console.error('Error getting academic performance:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê kết quả học tập',
      error: error.message,
    });
  }
};

// Get available academic years from grades
exports.getAcademicYears = async (req, res) => {
  try {
    const { sequelize } = require('../models');
    
    // Get distinct academic years from grades table
    const academicYears = await Grade.findAll({
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('academicYear')), 'academicYear']
      ],
      where: {
        academicYear: {
          [Op.not]: null
        }
      },
      order: [[sequelize.col('academicYear'), 'DESC']],
      raw: true,
    });

    const years = academicYears.map(item => item.academicYear).filter(Boolean);

    res.json({
      success: true,
      message: 'Lấy danh sách năm học thành công',
      data: years,
    });
  } catch (error) {
    console.error('Error getting academic years:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách năm học',
      error: error.message,
    });
  }
};

// Get grade statistics for teacher's classes
exports.getTeacherGradeStatistics = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { academicYear, term } = req.query;
    const { TeacherAssignment, ClassStudent } = require('../models');

    // Build where clause for grades
    const gradeWhere = {};
    if (term) {
      gradeWhere.term = parseInt(term);
    }
    if (academicYear) {
      gradeWhere.academicYear = academicYear;
    }

    // Get all classes where teacher is assigned
    const teacherAssignments = await TeacherAssignment.findAll({
      where: { teacherId, isActive: true },
      include: [
        {
          model: Class,
          as: 'assignmentClass',
          attributes: ['id', 'name', 'code'],
          include: [
            {
              model: ClassStudent,
              as: 'students',
              where: { status: 'active' },
              required: false,
              attributes: ['studentId'],
            },
          ],
        },
        {
          model: Subject,
          as: 'assignmentSubject',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (teacherAssignments.length === 0) {
      return res.json({
        success: true,
        message: 'Giáo viên chưa được phân công giảng dạy',
        data: {
          data: [],
          summary: {
            totalClasses: 0,
            totalSubjects: 0,
            totalStudents: 0,
            overallAvgGrade: 0,
            classesWithGrades: 0,
          },
        },
      });
    }

    // Calculate statistics for each class-subject combination
    const classStats = await Promise.all(
      teacherAssignments.map(async (assignment) => {
        const classItem = assignment.assignmentClass;
        const subject = assignment.assignmentSubject;

        if (!classItem) return null;

        const studentIds = classItem.students ? classItem.students.map(e => e.studentId) : [];
        const totalStudents = studentIds.length;

        if (totalStudents === 0) {
          return {
            id: `${classItem.id}-${subject.id}`,
            classId: classItem.id,
            className: classItem.name,
            classCode: classItem.code,
            subjectId: subject.id,
            subjectName: subject.name,
            totalStudents: 0,
            averageGrade: 0,
            excellentCount: 0,
            goodCount: 0,
            averageCount: 0,
            belowAverageCount: 0,
            passRate: 0,
          };
        }

        // Get grades for this class and subject
        const grades = await Grade.findAll({
          where: {
            ...gradeWhere,
            classId: classItem.id,
            subjectId: subject.id,
            studentId: studentIds,
          },
          attributes: ['gradeValue', 'weight'],
        });

        // Calculate weighted average and classification
        const validGrades = grades.filter(g => g.gradeValue !== null);
        let totalWeightedScore = 0;
        let totalWeight = 0;
        let excellentCount = 0;
        let goodCount = 0;
        let averageCount = 0;
        let belowAverageCount = 0;
        let passCount = 0;
        let avgGrade = 0;

        validGrades.forEach(g => {
          const grade = parseFloat(g.gradeValue);
          const weight = parseFloat(g.weight) || 1;
          
          totalWeightedScore += grade * weight;
          totalWeight += weight;
          avgGrade += grade;

          if (grade >= 9) {
            excellentCount++;
            passCount++;
          } else if (grade >= 8) {
            goodCount++;
            passCount++;
          } else if (grade >= 7) {
            averageCount++;
            passCount++;
          } else if (grade >= 5) {
            belowAverageCount++;
            passCount++;
          } else {
            belowAverageCount++;
          }
        });

        const averageGrade = validGrades.length > 0 ? avgGrade / validGrades.length : 0;
        const passRate = validGrades.length > 0 ? (passCount / validGrades.length) * 100 : 0;

        return {
          id: `${classItem.id}-${subject.id}`,
          classId: classItem.id,
          className: classItem.name,
          classCode: classItem.code,
          subjectId: subject.id,
          subjectName: subject.name,
          totalStudents,
          averageGrade: Math.round(averageGrade * 100) / 100,
          excellentCount,
          goodCount,
          averageCount,
          belowAverageCount,
          passRate: Math.round(passRate * 100) / 100,
        };
      })
    );

    // Filter out null values and sort by average grade
    const validClassStats = classStats.filter(stat => stat !== null);
    validClassStats.sort((a, b) => b.averageGrade - a.averageGrade);

    // Calculate summary
    const uniqueClasses = [...new Set(validClassStats.map(s => s.classId))];
    const uniqueSubjects = [...new Set(validClassStats.map(s => s.subjectId))];
    const totalStudents = [...new Set(validClassStats.flatMap(s => 
      Array(s.totalStudents).fill(`${s.classId}-student`)
    ))].length;

    const classesWithGrades = validClassStats.filter(s => s.averageGrade > 0);
    const overallAvgGrade = classesWithGrades.length > 0
      ? Math.round((classesWithGrades.reduce((sum, s) => sum + s.averageGrade, 0) / classesWithGrades.length) * 100) / 100
      : 0;

    res.json({
      success: true,
      message: 'Lấy thống kê điểm lớp học thành công',
      data: {
        data: validClassStats,
        summary: {
          totalClasses: uniqueClasses.length,
          totalSubjects: uniqueSubjects.length,
          totalStudents,
          overallAvgGrade,
          classesWithGrades: classesWithGrades.length,
        },
      },
    });
  } catch (error) {
    console.error('Error getting teacher grade statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê điểm lớp học',
      error: error.message,
    });
  }
};
