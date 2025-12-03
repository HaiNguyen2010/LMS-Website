const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'LMS Backend API',
    version: '1.0.0',
    description: 'API documentation cho hệ thống Learning Management System (LMS)',
    contact: {
      name: 'LMS Team',
      email: 'admin@lms.com'
    },
    license: {
      name: 'ISC',
      url: 'https://opensource.org/licenses/ISC'
    }
  },
  servers: [
    {
      url: process.env.API_BASE_URL || 'http://localhost:5000',
      description: 'Development server'
    },
    {
      url: 'https://api.lms.com',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Nhập JWT token để xác thực'
      }
    },
    schemas: {
      User: {
        type: 'object',
        required: ['name', 'email', 'role'],
        properties: {
          id: {
            type: 'integer',
            description: 'ID duy nhất của người dùng',
            example: 1
          },
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            description: 'Tên người dùng',
            example: 'Nguyễn Văn A'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Email của người dùng',
            example: 'nguyenvana@example.com'
          },
          role: {
            type: 'string',
            enum: ['admin', 'teacher', 'student'],
            description: 'Vai trò của người dùng',
            example: 'student'
          },
          phoneNumber: {
            type: 'string',
            maxLength: 20,
            description: 'Số điện thoại của người dùng',
            example: '0901234567'
          },
          code: {
            type: 'string',
            maxLength: 50,
            description: 'Mã số sinh viên hoặc mã số giáo viên (duy nhất)',
            example: 'SV001'
          },
          address: {
            type: 'string',
            description: 'Địa chỉ của người dùng',
            example: 'Hà Nội'
          },
          isActive: {
            type: 'boolean',
            description: 'Trạng thái kích hoạt tài khoản',
            example: true
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Thời gian tạo tài khoản',
            example: '2023-10-07T10:30:00Z'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Thời gian cập nhật cuối',
            example: '2023-10-07T10:30:00Z'
          }
        }
      },
      UserRegister: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            description: 'Tên người dùng',
            example: 'Nguyễn Văn A'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Email của người dùng',
            example: 'nguyenvana@example.com'
          },
          password: {
            type: 'string',
            minLength: 6,
            maxLength: 50,
            pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)',
            description: 'Mật khẩu (ít nhất 6 ký tự, có chữ hoa, chữ thường và số)',
            example: 'Password123'
          },
          role: {
            type: 'string',
            enum: ['admin', 'teacher', 'student'],
            description: 'Vai trò của người dùng',
            example: 'student',
            default: 'student'
          },
          code: {
            type: 'string',
            maxLength: 50,
            description: 'Mã số (mã giáo viên/học sinh)',
            example: 'GV001'
          },
          phoneNumber: {
            type: 'string',
            maxLength: 20,
            description: 'Số điện thoại',
            example: '0123456789'
          },
          address: {
            type: 'string',
            maxLength: 255,
            description: 'Địa chỉ',
            example: 'Hà Nội, Việt Nam'
          },
          isActive: {
            type: 'boolean',
            description: 'Trạng thái kích hoạt tài khoản',
            example: true,
            default: true
          }
        },
        description: 'Thông tin để tạo người dùng mới. Khi đăng ký qua endpoint /register, isActive mặc định là false. Khi admin tạo qua /users, isActive mặc định là true.'
      },
      UserLogin: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'Email đăng nhập',
            example: 'nguyenvana@example.com'
          },
          password: {
            type: 'string',
            description: 'Mật khẩu',
            example: 'Password123'
          }
        }
      },
      UserUpdate: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            description: 'Tên người dùng',
            example: 'Nguyễn Văn B'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Email của người dùng',
            example: 'nguyenvanb@example.com'
          },
          password: {
            type: 'string',
            minLength: 6,
            maxLength: 50,
            description: 'Mật khẩu mới (nếu muốn thay đổi). Để trống nếu không đổi mật khẩu.',
            example: 'NewPassword123'
          },
          role: {
            type: 'string',
            enum: ['admin', 'teacher', 'student'],
            description: 'Vai trò của người dùng (chỉ admin mới có thể thay đổi)',
            example: 'teacher'
          },
          phoneNumber: {
            type: 'string',
            maxLength: 20,
            description: 'Số điện thoại của người dùng. Để trống để xóa số điện thoại.',
            example: '0901234567'
          },
          code: {
            type: 'string',
            maxLength: 50,
            description: 'Mã số sinh viên hoặc mã số giáo viên (phải duy nhất). Chỉ admin có thể thay đổi. Để trống để xóa mã số.',
            example: 'GV001'
          },
          address: {
            type: 'string',
            maxLength: 500,
            description: 'Địa chỉ của người dùng. Để trống để xóa địa chỉ.',
            example: 'TP. Hồ Chí Minh'
          },
          isActive: {
            type: 'boolean',
            description: 'Trạng thái kích hoạt tài khoản (chỉ admin mới có thể thay đổi)',
            example: true
          }
        },
        description: 'Tất cả các trường đều là optional. Chỉ gửi các trường cần cập nhật. Admin có thể cập nhật tất cả, user thường chỉ có thể cập nhật thông tin cá nhân (name, email, password, phoneNumber, address).'
      },
      ChangePassword: {
        type: 'object',
        required: ['email', 'currentPassword', 'newPassword', 'confirmPassword'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'Email của tài khoản (để xác nhận)',
            example: 'user@example.com'
          },
          currentPassword: {
            type: 'string',
            description: 'Mật khẩu hiện tại',
            example: 'Password123'
          },
          newPassword: {
            type: 'string',
            minLength: 6,
            maxLength: 50,
            pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)',
            description: 'Mật khẩu mới',
            example: 'NewPassword456'
          },
          confirmPassword: {
            type: 'string',
            description: 'Xác nhận mật khẩu mới',
            example: 'NewPassword456'
          }
        }
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'Đăng nhập thành công'
          },
          data: {
            type: 'object',
            properties: {
              user: {
                $ref: '#/components/schemas/User'
              },
              token: {
                type: 'string',
                description: 'JWT token',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
              }
            }
          }
        }
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'Thành công'
          },
          data: {
            type: 'object'
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: 'Có lỗi xảy ra'
          },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: {
                  type: 'string',
                  example: 'email'
                },
                message: {
                  type: 'string',
                  example: 'Email không hợp lệ'
                }
              }
            }
          }
        }
      },
      PaginationInfo: {
        type: 'object',
        properties: {
          currentPage: {
            type: 'integer',
            example: 1
          },
          totalPages: {
            type: 'integer',
            example: 5
          },
          totalUsers: {
            type: 'integer',
            example: 50
          },
          hasNextPage: {
            type: 'boolean',
            example: true
          },
          hasPrevPage: {
            type: 'boolean',
            example: false
          },
          limit: {
            type: 'integer',
            example: 10
          }
        }
      },
      UserListResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'Lấy danh sách người dùng thành công'
          },
          data: {
            type: 'object',
            properties: {
              users: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/User'
                }
              },
              pagination: {
                $ref: '#/components/schemas/PaginationInfo'
              }
            }
          }
        }
      },
      UserStats: {
        type: 'object',
        properties: {
          totalUsers: {
            type: 'integer',
            example: 100
          },
          newUsersThisMonth: {
            type: 'integer',
            example: 15
          },
          roleStats: {
            type: 'object',
            properties: {
              admin: {
                type: 'integer',
                example: 2
              },
              teacher: {
                type: 'integer',
                example: 10
              },
              student: {
                type: 'integer',
                example: 88
              }
            }
          }
        }
      },
      Class: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'ID duy nhất của lớp học',
            example: 1
          },
          name: {
            type: 'string',
            description: 'Tên lớp học',
            example: 'Lớp 10A1'
          },
          grade: {
            type: 'integer',
            minimum: 1,
            maximum: 12,
            description: 'Khối',
            example: 10
          },
          description: {
            type: 'string',
            description: 'Mô tả lớp học',
            example: 'Lớp chuyên Toán - Tin'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00Z'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00Z'
          }
        }
      },
      Subject: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'ID duy nhất của môn học',
            example: 1
          },
          name: {
            type: 'string',
            description: 'Tên môn học',
            example: 'Toán học'
          },
          code: {
            type: 'string',
            description: 'Mã môn học',
            example: 'MATH'
          },
          description: {
            type: 'string',
            description: 'Mô tả môn học',
            example: 'Môn toán học cơ bản và nâng cao'
          },
          credits: {
            type: 'integer',
            minimum: 1,
            maximum: 10,
            description: 'Số tín chỉ',
            example: 4
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00Z'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00Z'
          }
        }
      },
      TeacherAssignment: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'ID duy nhất của phân công',
            example: 1
          },
          teacherId: {
            type: 'integer',
            description: 'ID giáo viên',
            example: 1
          },
          classId: {
            type: 'integer',
            description: 'ID lớp học',
            example: 1
          },
          subjectId: {
            type: 'integer',
            description: 'ID môn học',
            example: 1
          },
          startDate: {
            type: 'string',
            format: 'date',
            description: 'Ngày bắt đầu',
            example: '2024-01-01'
          },
          endDate: {
            type: 'string',
            format: 'date',
            description: 'Ngày kết thúc',
            example: '2024-06-30'
          },
          isActive: {
            type: 'boolean',
            description: 'Trạng thái hoạt động',
            example: true
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00Z'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00Z'
          },
          Teacher: {
            $ref: '#/components/schemas/User'
          },
          Class: {
            $ref: '#/components/schemas/Class'
          },
          Subject: {
            $ref: '#/components/schemas/Subject'
          }
        }
      },
      Assignment: {
        type: 'object',
        required: ['title', 'type', 'classId', 'subjectId', 'dueDate', 'maxGrade'],
        properties: {
          id: {
            type: 'integer',
            description: 'ID duy nhất của bài tập',
            example: 1
          },
          title: {
            type: 'string',
            minLength: 1,
            maxLength: 200,
            description: 'Tiêu đề bài tập',
            example: 'Bài tập tuần 1 - Toán học'
          },
          description: {
            type: 'string',
            description: 'Mô tả chi tiết bài tập',
            example: 'Làm bài tập về phương trình bậc hai'
          },
          type: {
            type: 'string',
            enum: ['essay', 'mcq', 'file_upload'],
            description: 'Loại bài tập: essay (tự luận), mcq (trắc nghiệm), file_upload (nộp file)',
            example: 'essay'
          },
          dueDate: {
            type: 'string',
            format: 'date-time',
            description: 'Hạn nộp bài',
            example: '2024-12-31T23:59:59Z'
          },
          classId: {
            type: 'integer',
            description: 'ID lớp học',
            example: 1
          },
          subjectId: {
            type: 'integer',
            description: 'ID môn học',
            example: 1
          },
          createdBy: {
            type: 'integer',
            description: 'ID giáo viên tạo bài tập',
            example: 2
          },
          maxGrade: {
            type: 'number',
            format: 'float',
            minimum: 0.01,
            maximum: 100,
            description: 'Điểm tối đa',
            example: 10.0
          },
          instructions: {
            type: 'string',
            description: 'Hướng dẫn làm bài cho học sinh',
            example: 'Giải các bài tập từ 1 đến 10 trong sách giáo khoa'
          },
          allowedFileTypes: {
            type: 'string',
            description: 'Các loại file được phép upload (cách nhau bởi dấu phẩy)',
            example: 'pdf,doc,docx,jpg,png'
          },
          maxFileSize: {
            type: 'integer',
            description: 'Kích thước file tối đa (bytes)',
            example: 10485760
          },
          mcqQuestions: {
            type: 'array',
            description: 'Danh sách câu hỏi trắc nghiệm (chỉ áp dụng cho type=mcq)',
            items: {
              type: 'object',
              properties: {
                question: {
                  type: 'string',
                  example: 'Kết quả của 2+2 là?'
                },
                options: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  example: ['3', '4', '5', '6']
                },
                correctAnswer: {
                  type: 'integer',
                  description: 'Index của đáp án đúng (0-based)',
                  example: 1
                }
              }
            }
          },
          status: {
            type: 'string',
            enum: ['draft', 'published', 'closed'],
            description: 'Trạng thái bài tập',
            example: 'published'
          },
          autoGrade: {
            type: 'boolean',
            description: 'Tự động chấm điểm cho bài trắc nghiệm',
            example: true
          },
          fileUrl: {
            type: 'string',
            description: 'URL file đính kèm của bài tập',
            example: '/uploads/assignments/file.pdf'
          },
          fileName: {
            type: 'string',
            description: 'Tên file đính kèm',
            example: 'baitap.pdf'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00Z'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00Z'
          },
          assignmentClass: {
            $ref: '#/components/schemas/Class'
          },
          assignmentSubject: {
            $ref: '#/components/schemas/Subject'
          },
          creator: {
            $ref: '#/components/schemas/User'
          }
        }
      },
      Submission: {
        type: 'object',
        required: ['assignmentId', 'studentId'],
        properties: {
          id: {
            type: 'integer',
            description: 'ID duy nhất của bài nộp',
            example: 1
          },
          assignmentId: {
            type: 'integer',
            description: 'ID bài tập',
            example: 1
          },
          studentId: {
            type: 'integer',
            description: 'ID học sinh',
            example: 3
          },
          content: {
            type: 'string',
            description: 'Nội dung bài làm (dành cho essay)',
            example: 'Đây là bài làm của tôi...'
          },
          fileUrl: {
            type: 'string',
            description: 'URL file nộp bài',
            example: '/uploads/submissions/file.pdf'
          },
          fileName: {
            type: 'string',
            description: 'Tên file nộp bài',
            example: 'bailam.pdf'
          },
          mcqAnswers: {
            type: 'array',
            description: 'Danh sách đáp án trắc nghiệm (index của đáp án được chọn)',
            items: {
              type: 'integer'
            },
            example: [1, 0, 2, 3]
          },
          grade: {
            type: 'number',
            format: 'float',
            description: 'Điểm số',
            example: 8.5
          },
          feedback: {
            type: 'string',
            description: 'Nhận xét của giáo viên',
            example: 'Bài làm tốt, cần cải thiện phần 2'
          },
          status: {
            type: 'string',
            enum: ['pending', 'graded', 'late'],
            description: 'Trạng thái bài nộp',
            example: 'graded'
          },
          submittedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Thời gian nộp bài',
            example: '2024-01-15T10:30:00Z'
          },
          gradedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Thời gian chấm điểm',
            example: '2024-01-16T14:00:00Z'
          },
          gradedBy: {
            type: 'integer',
            description: 'ID giáo viên chấm bài',
            example: 2
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00Z'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00Z'
          },
          assignment: {
            $ref: '#/components/schemas/Assignment'
          },
          student: {
            $ref: '#/components/schemas/User'
          },
          grader: {
            $ref: '#/components/schemas/User'
          }
        }
      },
      StudentEnrollment: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'ID duy nhất của ghi danh',
            example: 1
          },
          studentId: {
            type: 'integer',
            description: 'ID học sinh',
            example: 1
          },
          classId: {
            type: 'integer',
            description: 'ID lớp học',
            example: 1
          },
          enrollmentDate: {
            type: 'string',
            format: 'date',
            description: 'Ngày ghi danh',
            example: '2024-01-15'
          },
          isActive: {
            type: 'boolean',
            description: 'Trạng thái hoạt động',
            example: true
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T00:00:00Z'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T00:00:00Z'
          },
          Student: {
            $ref: '#/components/schemas/User'
          },
          Class: {
            $ref: '#/components/schemas/Class'
          }
        }
      },
      Attachment: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'ID duy nhất của file đính kèm',
            example: 1
          },
          attachableType: {
            type: 'string',
            enum: ['lesson', 'assignment', 'submission'],
            description: 'Loại đối tượng đính kèm',
            example: 'lesson'
          },
          attachableId: {
            type: 'integer',
            description: 'ID của đối tượng đính kèm',
            example: 1
          },
          fileName: {
            type: 'string',
            description: 'Tên file gốc',
            example: 'bai-giang-toan.pdf'
          },
          fileUrl: {
            type: 'string',
            description: 'Đường dẫn đến file',
            example: '/uploads/lessons/1234567890-bai-giang-toan.pdf'
          },
          fileSize: {
            type: 'integer',
            description: 'Kích thước file (bytes)',
            example: 1048576
          },
          fileType: {
            type: 'string',
            description: 'Loại file (extension)',
            example: 'pdf'
          },
          mimeType: {
            type: 'string',
            description: 'MIME type của file',
            example: 'application/pdf'
          },
          sortOrder: {
            type: 'integer',
            description: 'Thứ tự sắp xếp',
            example: 0
          },
          description: {
            type: 'string',
            description: 'Mô tả file (optional)',
            example: 'Tài liệu bài giảng chính'
          },
          uploadedBy: {
            type: 'integer',
            description: 'ID người upload',
            example: 1
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00Z'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00Z'
          }
        }
      },
      Lesson: {
        type: 'object',
        required: ['classId', 'subjectId', 'title', 'createdBy'],
        properties: {
          id: {
            type: 'integer',
            description: 'ID duy nhất của bài giảng',
            example: 1
          },
          classId: {
            type: 'integer',
            description: 'ID lớp học',
            example: 1
          },
          subjectId: {
            type: 'integer',
            description: 'ID môn học',
            example: 1
          },
          title: {
            type: 'string',
            minLength: 1,
            maxLength: 200,
            description: 'Tiêu đề bài giảng',
            example: 'Bài 1: Giới thiệu về Toán học'
          },
          description: {
            type: 'string',
            maxLength: 1000,
            description: 'Mô tả chi tiết bài giảng',
            example: 'Bài giảng giới thiệu các khái niệm cơ bản về toán học'
          },
          attachments: {
            type: 'array',
            description: 'Danh sách file đính kèm',
            items: {
              $ref: '#/components/schemas/Attachment'
            }
          },
          createdBy: {
            type: 'integer',
            description: 'ID người tạo bài giảng',
            example: 1
          },
          status: {
            type: 'string',
            enum: ['draft', 'published', 'archived'],
            description: 'Trạng thái bài giảng',
            example: 'published'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00Z'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00Z'
          },
          class: {
            $ref: '#/components/schemas/Class'
          },
          subject: {
            $ref: '#/components/schemas/Subject'
          },
          creator: {
            $ref: '#/components/schemas/User'
          }
        }
      },
      LessonCreateRequest: {
        type: 'object',
        required: ['classId', 'subjectId', 'title'],
        properties: {
          classId: {
            type: 'integer',
            description: 'ID lớp học',
            example: 1
          },
          subjectId: {
            type: 'integer',
            description: 'ID môn học',
            example: 1
          },
          title: {
            type: 'string',
            minLength: 1,
            maxLength: 200,
            description: 'Tiêu đề bài giảng',
            example: 'Bài 1: Giới thiệu về Toán học'
          },
          description: {
            type: 'string',
            maxLength: 1000,
            description: 'Mô tả chi tiết bài giảng',
            example: 'Bài giảng giới thiệu các khái niệm cơ bản về toán học'
          },
          status: {
            type: 'string',
            enum: ['draft', 'published', 'archived'],
            description: 'Trạng thái bài giảng',
            example: 'published'
          },
          files: {
            type: 'array',
            items: {
              type: 'string',
              format: 'binary'
            },
            description: 'Danh sách file đính kèm (tối đa 10 files, mỗi file tối đa 100MB). Hỗ trợ: pdf, docx, doc, pptx, ppt, mp4, avi, mkv, xlsx, xls, jpg, jpeg, png, zip, rar, txt',
            maxItems: 10
          }
        }
      },
      LessonListResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          data: {
            type: 'object',
            properties: {
              lessons: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Lesson'
                }
              },
              pagination: {
                type: 'object',
                properties: {
                  currentPage: {
                    type: 'integer',
                    example: 1
                  },
                  totalPages: {
                    type: 'integer',
                    example: 5
                  },
                  totalItems: {
                    type: 'integer',
                    example: 50
                  },
                  itemsPerPage: {
                    type: 'integer',
                    example: 10
                  }
                }
              }
            }
          }
        }
      },
      ValidationError: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: 'Dữ liệu đầu vào không hợp lệ'
          },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: {
                  type: 'string',
                  example: 'name'
                },
                message: {
                  type: 'string',
                  example: 'Tên không được để trống'
                },
                value: {
                  type: 'string',
                  example: ''
                }
              }
            }
          }
        }
      },
      NotFoundError: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: 'Không tìm thấy tài nguyên'
          }
        }
      },
      UnauthorizedError: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: 'Token không được cung cấp hoặc không hợp lệ'
          }
        }
      },
      ForbiddenError: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: 'Bạn không có quyền truy cập tài nguyên này'
          }
        }
      }
    },
    responses: {
      ValidationError: {
        description: 'Lỗi validation dữ liệu đầu vào',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ValidationError'
            }
          }
        }
      },
      NotFoundError: {
        description: 'Không tìm thấy tài nguyên',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/NotFoundError'
            }
          }
        }
      },
      UnauthorizedError: {
        description: 'Token không được cung cấp hoặc không hợp lệ',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UnauthorizedError'
            }
          }
        }
      },
      ForbiddenError: {
        description: 'Không có quyền truy cập',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ForbiddenError'
            }
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Authentication',
      description: 'Các API liên quan đến xác thực người dùng'
    },
    {
      name: 'User Management',
      description: 'Các API quản lý người dùng (chỉ dành cho Admin)'
    },
    {
      name: 'Class Management',
      description: 'Các API quản lý lớp học (chỉ dành cho Admin)'
    },
    {
      name: 'Subject Management',
      description: 'Các API quản lý môn học (chỉ dành cho Admin)'
    },
    {
      name: 'Teacher Assignment',
      description: 'Các API quản lý phân công giáo viên (chỉ dành cho Admin)'
    },
    {
      name: 'Student Enrollment',
      description: 'Các API quản lý ghi danh học sinh (chỉ dành cho Admin)'
    },
    {
      name: 'Lesson Management',
      description: 'Các API quản lý bài giảng và tài liệu (Admin, Teacher, Student)'
    },
    {
      name: 'Assignments',
      description: 'Các API quản lý bài tập - Tạo, sửa, xóa, xem bài tập (Admin, Teacher, Student)'
    },
    {
      name: 'Submissions',
      description: 'Các API nộp bài và chấm điểm - Học sinh nộp bài, giáo viên chấm điểm'
    },
    {
      name: 'Health Check',
      description: 'Kiểm tra trạng thái server'
    }
  ]
};

// Options for swagger-jsdoc
const swaggerOptions = {
  definition: swaggerDefinition,
  apis: [
    './routes/*.js',
    './controllers/*.js',
    './models/*.js'
  ]
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI options
const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestHeaders: true,
    showCommonExtensions: true,
    syntaxHighlight: {
      activate: true,
      theme: 'agate'
    }
  },
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { color: #3b82f6; }
    .swagger-ui .info .description { font-size: 16px; }
    .swagger-ui .scheme-container { background: #f8fafc; padding: 15px; border-radius: 5px; }
  `,
  customSiteTitle: 'LMS API Documentation',
  customfavIcon: '/favicon.ico'
};

module.exports = {
  swaggerSpec,
  swaggerUi,
  swaggerUiOptions
};