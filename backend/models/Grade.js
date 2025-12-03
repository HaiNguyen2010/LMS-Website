const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Grade = sequelize.define('Grade', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    validate: {
      notNull: {
        msg: 'ID học sinh không được để trống'
      },
      isInt: {
        msg: 'ID học sinh phải là số nguyên'
      }
    }
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Subjects',
      key: 'id'
    },
    validate: {
      notNull: {
        msg: 'ID môn học không được để trống'
      },
      isInt: {
        msg: 'ID môn học phải là số nguyên'
      }
    }
  },
  classId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Classes',
      key: 'id'
    },
    validate: {
      notNull: {
        msg: 'ID lớp học không được để trống'
      },
      isInt: {
        msg: 'ID lớp học phải là số nguyên'
      }
    }
  },
  gradeValue: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Điểm số không được để trống'
      },
      min: {
        args: [0],
        msg: 'Điểm số không được nhỏ hơn 0'
      },
      max: {
        args: [10],
        msg: 'Điểm số không được lớn hơn 10'
      },
      isDecimal: {
        msg: 'Điểm số phải là số thập phân'
      }
    }
  },
  gradeType: {
    type: DataTypes.ENUM('homework', 'quiz', 'midterm', 'final', 'assignment', 'participation'),
    allowNull: false,
    defaultValue: 'homework',
    validate: {
      notNull: {
        msg: 'Loại điểm không được để trống'
      },
      isIn: {
        args: [['homework', 'quiz', 'midterm', 'final', 'assignment', 'participation']],
        msg: 'Loại điểm không hợp lệ'
      }
    }
  },
  weight: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 1.0,
    validate: {
      notNull: {
        msg: 'Trọng số không được để trống'
      },
      min: {
        args: [0],
        msg: 'Trọng số không được nhỏ hơn 0'
      },
      max: {
        args: [100],
        msg: 'Trọng số không được lớn hơn 100'
      }
    },
    comment: 'Trọng số của loại điểm (homework: 1, quiz: 1.5, midterm: 2, final: 3)'
  },
  term: {
    type: DataTypes.ENUM('1', '2', 'final'),
    allowNull: false,
    defaultValue: '1',
    validate: {
      notNull: {
        msg: 'Học kỳ không được để trống'
      },
      isIn: {
        args: [['1', '2', 'final']],
        msg: 'Học kỳ phải là 1, 2 hoặc final'
      }
    }
  },
  academicYear: {
    type: DataTypes.STRING(9),
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Năm học không được để trống'
      },
      len: {
        args: [9, 9],
        msg: 'Năm học phải có định dạng YYYY-YYYY (ví dụ: 2024-2025)'
      },
      is: {
        args: /^\d{4}-\d{4}$/,
        msg: 'Năm học phải có định dạng YYYY-YYYY'
      }
    },
    comment: 'Năm học theo định dạng YYYY-YYYY'
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 1000],
        msg: 'Ghi chú không được vượt quá 1000 ký tự'
      }
    }
  },
  recordedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    validate: {
      notNull: {
        msg: 'ID người nhập điểm không được để trống'
      }
    },
    comment: 'ID của giáo viên nhập điểm'
  },
  recordedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    validate: {
      notNull: {
        msg: 'Thời gian nhập điểm không được để trống'
      },
      isDate: {
        msg: 'Thời gian nhập điểm phải là định dạng ngày'
      }
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Trạng thái hoạt động của điểm (để soft delete)'
  }
}, {
  tableName: 'Grades',
  timestamps: true,
  paranoid: true, // Soft delete
  indexes: [
    {
      fields: ['studentId', 'subjectId', 'classId', 'term', 'academicYear'],
      name: 'idx_grade_lookup'
    },
    {
      fields: ['classId', 'subjectId', 'term'],
      name: 'idx_class_subject_term'
    },
    {
      fields: ['studentId', 'term', 'academicYear'],
      name: 'idx_student_term_year'
    },
    {
      fields: ['gradeType', 'term'],
      name: 'idx_grade_type_term'
    },
    {
      fields: ['recordedBy'],
      name: 'idx_recorded_by'
    },
    {
      fields: ['recordedAt'],
      name: 'idx_recorded_at'
    }
  ],
  hooks: {
    beforeValidate: (grade, options) => {
      // Tự động set academicYear nếu chưa có
      if (!grade.academicYear) {
        const currentYear = new Date().getFullYear();
        const month = new Date().getMonth() + 1;
        
        // Năm học bắt đầu từ tháng 9
        if (month >= 9) {
          grade.academicYear = `${currentYear}-${currentYear + 1}`;
        } else {
          grade.academicYear = `${currentYear - 1}-${currentYear}`;
        }
      }
      
      // Set weight dựa trên gradeType nếu chưa có
      if (grade.gradeType && !grade.weight) {
        const weights = {
          homework: 1.0,
          quiz: 1.5,
          assignment: 2.0,
          midterm: 2.5,
          final: 3.0,
          participation: 0.5
        };
        grade.weight = weights[grade.gradeType] || 1.0;
      }
      
      // Set recordedAt nếu chưa có
      if (!grade.recordedAt) {
        grade.recordedAt = new Date();
      }
    },
    
    afterCreate: async (grade, options) => {
      // Log việc tạo điểm mới
      console.log(`📝 New grade created: Student ${grade.studentId}, Subject ${grade.subjectId}, Grade: ${grade.gradeValue}`);
    },
    
    afterUpdate: async (grade, options) => {
      // Log việc cập nhật điểm
      console.log(`📝 Grade updated: Student ${grade.studentId}, Subject ${grade.subjectId}, New Grade: ${grade.gradeValue}`);
    }
  },
  
  // Instance methods
  instanceMethods: {
    // Tính điểm có trọng số
    getWeightedGrade() {
      return parseFloat(this.gradeValue) * parseFloat(this.weight);
    },
    
    // Kiểm tra điểm có đạt không (>= 5.0)
    isPassing() {
      return parseFloat(this.gradeValue) >= 5.0;
    },
    
    // Lấy xếp loại điểm
    getGradeRank() {
      const grade = parseFloat(this.gradeValue);
      if (grade >= 9.0) return 'Xuất sắc';
      if (grade >= 8.0) return 'Giỏi';
      if (grade >= 6.5) return 'Khá';
      if (grade >= 5.0) return 'Trung bình';
      return 'Yếu';
    }
  }
});

// Class methods
Grade.getAverageByStudent = async function(studentId, subjectId, classId, term, academicYear) {
  const grades = await this.findAll({
    where: {
      studentId,
      subjectId,
      classId,
      term,
      academicYear,
      isActive: true
    }
  });
  
  if (grades.length === 0) return 0;
  
  // Tính điểm trung bình có trọng số
  let totalWeightedGrade = 0;
  let totalWeight = 0;
  
  grades.forEach(grade => {
    const gradeValue = parseFloat(grade.gradeValue);
    const weight = parseFloat(grade.weight);
    totalWeightedGrade += gradeValue * weight;
    totalWeight += weight;
  });
  
  return totalWeight > 0 ? (totalWeightedGrade / totalWeight) : 0;
};

Grade.getTermAverageByStudent = async function(studentId, classId, term, academicYear) {
  const { Sequelize } = require('sequelize');
  
  const result = await this.findAll({
    attributes: [
      'subjectId',
      [Sequelize.fn('AVG', 
        Sequelize.literal('(gradeValue * weight) / weight')
      ), 'averageGrade'],
      [Sequelize.fn('SUM', Sequelize.col('weight')), 'totalWeight']
    ],
    where: {
      studentId,
      classId,
      term,
      academicYear,
      isActive: true
    },
    group: ['subjectId'],
    raw: true
  });
  
  return result;
};

Grade.getClassAverageBySubject = async function(classId, subjectId, term, academicYear) {
  const { Sequelize } = require('sequelize');
  
  const result = await this.findOne({
    attributes: [
      [Sequelize.fn('AVG', 
        Sequelize.literal('(gradeValue * weight) / weight')
      ), 'classAverage']
    ],
    where: {
      classId,
      subjectId,
      term,
      academicYear,
      isActive: true
    },
    raw: true
  });
  
  return result ? parseFloat(result.classAverage) || 0 : 0;
};

module.exports = Grade;