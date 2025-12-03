import { APP_CONFIG, STORAGE_KEYS } from '@/constants';
import type {
  ApiResponse,
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
  Class,
  Subject,
  TeacherAssignment,
  StudentEnrollment,
  Lesson,
  Assignment,
  Submission,
  Grade,
  StudentGradesResponse,
  ForumPost,
  ForumComment,
  Notification,
  CreateClassData,
  CreateSubjectData,
  CreateTeacherAssignmentData,
  CreateStudentEnrollmentData,
  CreateLessonData,
  CreateAssignmentData,
  CreateSubmissionData,
  GradeSubmissionData,
  CreateGradeData,
  CreateForumPostData,
  CreateForumCommentData,
  CreateNotificationData,
  UserQueryParams,
  ClassQueryParams,
  SubjectQueryParams,
  LessonQueryParams,
  LessonsByClassResponse,
  AssignmentQueryParams,
  GradeQueryParams,
  ForumQueryParams,
  NotificationQueryParams,
  PaginatedResponse,
} from '@/types';

const API_BASE_URL = APP_CONFIG.API_BASE_URL;

// ========================= HELPER FUNCTIONS =========================
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
};

const buildQueryString = (params: Record<string, unknown> | undefined): string => {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
};

const toRecord = <T extends Record<string, unknown>>(obj: T): Record<string, unknown> => obj;

const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: Record<string, string> = {};

  // Don't add Content-Type for FormData
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const token = getAuthToken();
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  } else {
    console.warn('⚠️ No token found for API call:', endpoint);
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    console.log('🔄 API Call:', endpoint, { hasToken: !!token });
    const response = await fetch(url, config);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ Non-JSON response:', { endpoint, status: response.status, text: text.substring(0, 200) });
      throw new Error(`Server returned non-JSON response. Status: ${response.status}`);
    }

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API Error:', { endpoint, status: response.status, data });
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    console.log('✅ API Success:', endpoint);
    return data;
  } catch (error) {
    console.error('💥 API call failed:', { endpoint, error });
    throw error;
  }
};

// ========================= AUTHENTICATION APIs =========================
export const authAPI = {
  register: (data: RegisterData) =>
    apiCall<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (credentials: LoginCredentials) =>
    apiCall<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  logout: () =>
    apiCall('/api/v1/auth/logout', {
      method: 'POST',
    }),

  getProfile: () =>
    apiCall<User>('/api/v1/auth/profile', {
      method: 'GET',
    }),

  updateProfile: (data: Partial<User>) =>
    apiCall<User>('/api/v1/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  changePassword: (data: { 
    email: string; 
    currentPassword: string; 
    newPassword: string;
    confirmPassword: string;
  }) =>
    apiCall('/api/v1/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  refreshToken: () =>
    apiCall<{ token: string }>('/api/v1/auth/refresh-token', {
      method: 'POST',
    }),
};

// ========================= USER MANAGEMENT APIs =========================
export const userAPI = {
  getAll: (params?: UserQueryParams) => {
    const query = params ? `?${buildQueryString(params as Record<string, unknown>)}` : '';
    return apiCall<PaginatedResponse<User>>(`/api/v1/users${query}`, {
      method: 'GET',
    });
  },

  create: (data: RegisterData) =>
    apiCall<User>('/api/v1/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getStats: () =>
    apiCall<{ admin: number; teacher: number; student: number }>('/api/v1/users/stats', {
      method: 'GET',
    }),

  getById: (userId: number) =>
    apiCall<User>(`/api/v1/users/${userId}`, {
      method: 'GET',
    }),

  update: (userId: number, data: Partial<User>) =>
    apiCall<User>(`/api/v1/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (userId: number) =>
    apiCall(`/api/v1/users/${userId}`, {
      method: 'DELETE',
    }),

  resetPassword: (userId: number, newPassword: string) =>
    apiCall(`/api/v1/users/${userId}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword }),
    }),

  // API mới cho student profile (chỉ cập nhật phoneNumber và address)
  updateProfile: (data: { phoneNumber?: string; address?: string }) =>
    apiCall<User>('/api/v1/users/profile/update', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ========================= CLASS MANAGEMENT APIs =========================
export const classAPI = {
  getAll: (params?: ClassQueryParams) => {
    const query = params ? `?${buildQueryString(params as Record<string, unknown>)}` : '';
    return apiCall<PaginatedResponse<Class>>(`/api/v1/classes${query}`, {
      method: 'GET',
    });
  },

  getTeacherClasses: () =>
    apiCall<Class[]>('/api/v1/teacher-assignments/my-classes', {
      method: 'GET',
    }),

  create: (data: CreateClassData) =>
    apiCall<Class>('/api/v1/classes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getById: (id: number) =>
    apiCall<Class>(`/api/v1/classes/${id}`, {
      method: 'GET',
    }),

  update: (id: number, data: Partial<CreateClassData>) =>
    apiCall<Class>(`/api/v1/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiCall(`/api/v1/classes/${id}`, {
      method: 'DELETE',
    }),

  getStudents: (id: number) =>
    apiCall<User[]>(`/api/v1/classes/${id}/students`, {
      method: 'GET',
    }),

  addStudent: (id: number, studentId: number) =>
    apiCall(`/api/v1/classes/${id}/students`, {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    }),

  removeStudent: (id: number, studentId: number) =>
    apiCall(`/api/v1/classes/${id}/students/${studentId}`, {
      method: 'DELETE',
    }),

  getStats: (id: number) =>
    apiCall(`/api/v1/classes/${id}/stats`, {
      method: 'GET',
    }),
};

// ========================= SUBJECT MANAGEMENT APIs =========================
export const subjectAPI = {
  getAll: (params?: SubjectQueryParams) => {
    const query = params ? `?${buildQueryString(params as Record<string, unknown>)}` : '';
    return apiCall<PaginatedResponse<Subject>>(`/api/v1/subjects${query}`, {
      method: 'GET',
    });
  },

  create: (data: CreateSubjectData) =>
    apiCall<Subject>('/api/v1/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getById: (id: number) =>
    apiCall<Subject>(`/api/v1/subjects/${id}`, {
      method: 'GET',
    }),

  update: (id: number, data: Partial<CreateSubjectData>) =>
    apiCall<Subject>(`/api/v1/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiCall(`/api/v1/subjects/${id}`, {
      method: 'DELETE',
    }),

  getStats: (id: number) =>
    apiCall(`/api/v1/subjects/${id}/stats`, {
      method: 'GET',
    }),
};

// ========================= TEACHER ASSIGNMENT APIs =========================
export const teacherAssignmentAPI = {
  getAll: (params?: { page?: number; limit?: number; teacherId?: number; classId?: number; subjectId?: number; isActive?: boolean }) => {
    const query = params ? `?${buildQueryString(params as Record<string, unknown>)}` : '';
    return apiCall<PaginatedResponse<TeacherAssignment>>(`/api/v1/teacher-assignments${query}`, {
      method: 'GET',
    });
  },

  getMyAssignments: () =>
    apiCall<{ assignments: TeacherAssignment[] }>('/api/v1/teacher-assignments/my-assignments', {
      method: 'GET',
    }),

  create: (data: CreateTeacherAssignmentData) =>
    apiCall<TeacherAssignment>('/api/v1/teacher-assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getByTeacherId: (teacherId: number) =>
    apiCall<TeacherAssignment[]>(`/api/v1/teacher-assignments/teacher/${teacherId}`, {
      method: 'GET',
    }),

  getByClassId: (classId: number) =>
    apiCall<TeacherAssignment[]>(`/api/v1/teacher-assignments/class/${classId}`, {
      method: 'GET',
    }),

  getTeacherClasses: () =>
    apiCall<Class[]>('/api/v1/teacher-assignments/my-classes', {
      method: 'GET',
    }),

  getById: (id: number) =>
    apiCall<TeacherAssignment>(`/api/v1/teacher-assignments/${id}`, {
      method: 'GET',
    }),

  update: (id: number, data: Partial<CreateTeacherAssignmentData>) =>
    apiCall<TeacherAssignment>(`/api/v1/teacher-assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiCall(`/api/v1/teacher-assignments/${id}`, {
      method: 'DELETE',
    }),
};

// ========================= STUDENT ENROLLMENT APIs =========================
export const studentEnrollmentAPI = {
  getAll: (params?: { page?: number; limit?: number; classId?: number; studentId?: number; isActive?: boolean; search?: string }) => {
    const query = params ? `?${buildQueryString(params as Record<string, unknown>)}` : '';
    return apiCall<PaginatedResponse<StudentEnrollment>>(`/api/v1/student-enrollments${query}`, {
      method: 'GET',
    });
  },

  create: (data: CreateStudentEnrollmentData) =>
    apiCall<StudentEnrollment>('/api/v1/student-enrollments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getByStudentId: (studentId: number) =>
    apiCall<StudentEnrollment[]>(`/api/v1/student-enrollments/student/${studentId}`, {
      method: 'GET',
    }),

  getByClassId: (classId: number) =>
    apiCall<StudentEnrollment[]>(`/api/v1/student-enrollments/class/${classId}`, {
      method: 'GET',
    }),

  getById: (id: number) =>
    apiCall<StudentEnrollment>(`/api/v1/student-enrollments/${id}`, {
      method: 'GET',
    }),

  update: (id: number, data: Partial<CreateStudentEnrollmentData>) =>
    apiCall<StudentEnrollment>(`/api/v1/student-enrollments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiCall(`/api/v1/student-enrollments/${id}`, {
      method: 'DELETE',
    }),
};

// ========================= LESSON MANAGEMENT APIs =========================
export const lessonAPI = {
  getAll: (params?: LessonQueryParams) => {
    const query = params ? `?${buildQueryString(params as Record<string, unknown>)}` : '';
    return apiCall<PaginatedResponse<Lesson>>(`/api/v1/lessons${query}`, {
      method: 'GET',
    });
  },

  create: (data: CreateLessonData) => {
    const formData = new FormData();
    formData.append('classId', String(data.classId));
    formData.append('subjectId', String(data.subjectId));
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.status) formData.append('status', data.status);
    
    // Append multiple files
    if (data.files && data.files.length > 0) {
      data.files.forEach((file) => {
        formData.append('files', file);
      });
    }

    return apiCall<Lesson>('/api/v1/lessons', {
      method: 'POST',
      body: formData,
    });
  },

  getByClassId: (classId: number) =>
    apiCall<LessonsByClassResponse>(`/api/v1/lessons/class/${classId}`, {
      method: 'GET',
    }),

  getById: (id: number) =>
    apiCall<Lesson>(`/api/v1/lessons/${id}`, {
      method: 'GET',
    }),

  update: (id: number, data: Partial<CreateLessonData>) => {
    const formData = new FormData();
    if (data.classId) formData.append('classId', String(data.classId));
    if (data.subjectId) formData.append('subjectId', String(data.subjectId));
    if (data.title) formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.status) formData.append('status', data.status);
    
    // Append multiple files
    if (data.files && data.files.length > 0) {
      data.files.forEach((file) => {
        formData.append('files', file);
      });
    }

    // Append attachment IDs to delete
    if (data.deleteAttachmentIds && data.deleteAttachmentIds.length > 0) {
      formData.append('deleteAttachmentIds', JSON.stringify(data.deleteAttachmentIds));
    }

    return apiCall<Lesson>(`/api/v1/lessons/${id}`, {
      method: 'PUT',
      body: formData,
    });
  },

  delete: (id: number) =>
    apiCall(`/api/v1/lessons/${id}`, {
      method: 'DELETE',
    }),
};

// ========================= ASSIGNMENT MANAGEMENT APIs =========================
export const assignmentAPI = {
  getAll: (params?: AssignmentQueryParams) => {
    const query = params ? `?${buildQueryString(params as Record<string, unknown>)}` : '';
    return apiCall<PaginatedResponse<Assignment>>(`/api/v1/assignments${query}`, {
      method: 'GET',
    });
  },

  create: (data: CreateAssignmentData | FormData) => {
    // If already FormData, use it directly (for multiple files support)
    if (data instanceof FormData) {
      return apiCall<Assignment>('/api/v1/assignments', {
        method: 'POST',
        body: data,
      });
    }
    
    // Otherwise, build FormData from CreateAssignmentData
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    formData.append('type', data.type);
    formData.append('classId', String(data.classId));
    formData.append('subjectId', String(data.subjectId));
    formData.append('dueDate', data.dueDate);
    formData.append('maxGrade', String(data.maxGrade));
    if (data.instructions) formData.append('instructions', data.instructions);
    if (data.allowedFileTypes) formData.append('allowedFileTypes', data.allowedFileTypes);
    if (data.maxFileSize) formData.append('maxFileSize', String(data.maxFileSize));
    if (data.mcqQuestions) formData.append('mcqQuestions', JSON.stringify(data.mcqQuestions));
    if (data.autoGrade !== undefined) formData.append('autoGrade', String(data.autoGrade));
    if (data.showCorrectAnswers !== undefined) formData.append('showCorrectAnswers', String(data.showCorrectAnswers));
    if (data.file) formData.append('file', data.file);

    return apiCall<Assignment>('/api/v1/assignments', {
      method: 'POST',
      body: formData,
    });
  },

  getById: (id: number) =>
    apiCall<Assignment>(`/api/v1/assignments/${id}`, {
      method: 'GET',
    }),

  update: (id: number, data: Partial<CreateAssignmentData> | FormData) => {
    // If already FormData, use it directly (for multiple files support)
    if (data instanceof FormData) {
      return apiCall<Assignment>(`/api/v1/assignments/${id}`, {
        method: 'PUT',
        body: data,
      });
    }
    
    // Otherwise, build FormData from CreateAssignmentData
    const formData = new FormData();
    if (data.title) formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.dueDate) formData.append('dueDate', data.dueDate);
    if (data.maxGrade) formData.append('maxGrade', String(data.maxGrade));
    if (data.instructions) formData.append('instructions', data.instructions);
    if (data.allowedFileTypes) formData.append('allowedFileTypes', data.allowedFileTypes);
    if (data.maxFileSize) formData.append('maxFileSize', String(data.maxFileSize));
    if (data.mcqQuestions) formData.append('mcqQuestions', JSON.stringify(data.mcqQuestions));
    if (data.autoGrade !== undefined) formData.append('autoGrade', String(data.autoGrade));
    if (data.showCorrectAnswers !== undefined) formData.append('showCorrectAnswers', String(data.showCorrectAnswers));
    if (data.file) formData.append('file', data.file);

    return apiCall<Assignment>(`/api/v1/assignments/${id}`, {
      method: 'PUT',
      body: formData,
    });
  },

  delete: (id: number) =>
    apiCall(`/api/v1/assignments/${id}`, {
      method: 'DELETE',
    }),

  submit: (id: number, data: CreateSubmissionData) => {
    const formData = new FormData();
    if (data.content) formData.append('content', data.content);
    if (data.file) formData.append('file', data.file);

    return apiCall<Submission>(`/api/v1/assignments/${id}/submit`, {
      method: 'POST',
      body: formData,
    });
  },

  getSubmissions: (id: number) =>
    apiCall<Submission[]>(`/api/v1/assignments/${id}/submissions`, {
      method: 'GET',
    }),

  gradeSubmission: (assignmentId: number, submissionId: number, data: GradeSubmissionData) =>
    apiCall<Submission>(`/api/v1/assignments/${assignmentId}/submissions/${submissionId}/grade`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ========================= GRADE MANAGEMENT APIs =========================
export const gradeAPI = {
  getAll: (params?: GradeQueryParams) => {
    const query = params ? `?${buildQueryString(params as Record<string, unknown>)}` : '';
    return apiCall<PaginatedResponse<Grade>>(`/api/v1/grades${query}`, {
      method: 'GET',
    });
  },

  create: (data: CreateGradeData) =>
    apiCall<Grade>('/api/v1/grades', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getByStudentId: (studentId: number, params?: Omit<GradeQueryParams, 'studentId'>) => {
    const query = params ? `?${buildQueryString(params as Record<string, unknown>)}` : '';
    return apiCall<StudentGradesResponse>(`/api/v1/grades/student/${studentId}${query}`, {
      method: 'GET',
    });
  },

  getByClassId: (classId: number) =>
    apiCall<Grade[]>(`/api/v1/grades/class/${classId}`, {
      method: 'GET',
    }),

  getBySubjectId: (subjectId: number) =>
    apiCall<Grade[]>(`/api/v1/grades/subject/${subjectId}`, {
      method: 'GET',
    }),

  getById: (id: number) =>
    apiCall<Grade>(`/api/v1/grades/${id}`, {
      method: 'GET',
    }),

  update: (id: number, data: Partial<CreateGradeData>) =>
    apiCall<Grade>(`/api/v1/grades/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiCall(`/api/v1/grades/${id}`, {
      method: 'DELETE',
    }),

  getAverage: (studentId: number, params?: { subjectId?: number; term?: string; academicYear?: string }) => {
    const query = params ? `?${buildQueryString(params as Record<string, unknown>)}` : '';
    return apiCall<{ average: number }>(`/api/v1/grades/student/${studentId}/average${query}`, {
      method: 'GET',
    });
  },

  getStats: (params?: GradeQueryParams) => {
    const query = params ? `?${buildQueryString(params as Record<string, unknown>)}` : '';
    return apiCall(`/api/v1/grades/stats${query}`, {
      method: 'GET',
    });
  },
};

// ========================= SUBMISSION APIs =========================
export const submissionAPI = {
  // Admin: Get all submissions with filters
  getAll: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    classId?: number;
    subjectId?: number;
    assignmentId?: number;
    studentId?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) => {
    const query = params ? `?${buildQueryString(params as Record<string, unknown>)}` : '';
    return apiCall<PaginatedResponse<Submission>>(`/api/v1/assignments/submissions/all${query}`, {
      method: 'GET',
    });
  },

  // Teacher: Get submissions for assigned classes/subjects
  getTeacherSubmissions: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    classId?: number;
    subjectId?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) => {
    const query = params ? `?${buildQueryString(params as Record<string, unknown>)}` : '';
    return apiCall<PaginatedResponse<Submission>>(`/api/v1/assignments/submissions/teacher${query}`, {
      method: 'GET',
    });
  },

  // Student: Get my submissions
  getMySubmissions: (params?: { page?: number; limit?: number }) => {
    const query = params ? `?${buildQueryString(params as Record<string, unknown>)}` : '';
    return apiCall<PaginatedResponse<Submission>>(`/api/v1/assignments/my-submissions${query}`, {
      method: 'GET',
    });
  },

  getById: (id: number) =>
    apiCall<Submission>(`/api/v1/submissions/${id}`, {
      method: 'GET',
    }),

  create: (assignmentId: number, data: FormData) =>
    apiCall<Submission>(`/api/v1/assignments/${assignmentId}/submissions`, {
      method: 'POST',
      body: data,
    }),

  update: (id: number, data: FormData) =>
    apiCall<Submission>(`/api/v1/submissions/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: number) =>
    apiCall(`/api/v1/assignments/submissions/${id}`, {
      method: 'DELETE',
    }),
};

// ========================= FORUM APIs =========================
export const forumAPI = {
  getAllPosts: (params?: ForumQueryParams) => {
    const query = params ? `?${buildQueryString(params as Record<string, unknown>)}` : '';
    return apiCall<PaginatedResponse<ForumPost>>(`/api/v1/forum/posts/all${query}`, {
      method: 'GET',
    });
  },

  // Alias for getAllPosts
  getAll: (params?: ForumQueryParams) => {
    const query = params ? `?${buildQueryString(params as Record<string, unknown>)}` : '';
    return apiCall<PaginatedResponse<ForumPost>>(`/api/v1/forum/posts/all${query}`, {
      method: 'GET',
    });
  },

  getPostsByClass: (classId: number, params?: ForumQueryParams) => {
    const query = params ? `?${buildQueryString(params as Record<string, unknown>)}` : '';
    return apiCall<PaginatedResponse<ForumPost>>(`/api/v1/forum/classes/${classId}/posts${query}`, {
      method: 'GET',
    });
  },

  createPost: (classId: number, data: CreateForumPostData) =>
    apiCall<ForumPost>(`/api/v1/forum/posts`, {
      method: 'POST',
      body: JSON.stringify({ ...data, classId }),
    }),

  getPostById: (postId: number) =>
    apiCall<ForumPost>(`/api/v1/forum/posts/${postId}`, {
      method: 'GET',
    }),

  updatePost: (postId: number, data: Partial<CreateForumPostData>) =>
    apiCall<ForumPost>(`/api/v1/forum/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deletePost: (postId: number) =>
    apiCall(`/api/v1/forum/posts/${postId}`, {
      method: 'DELETE',
    }),

  // Alias for deletePost
  delete: (postId: number) =>
    apiCall(`/api/v1/forum/posts/${postId}`, {
      method: 'DELETE',
    }),

  pinPost: (postId: number) =>
    apiCall<ForumPost>(`/api/v1/forum/posts/${postId}/pin`, {
      method: 'PATCH',
    }),

  lockPost: (postId: number) =>
    apiCall<ForumPost>(`/api/v1/forum/posts/${postId}/lock`, {
      method: 'PATCH',
    }),

  likePost: (postId: number) =>
    apiCall(`/api/v1/forum/likes`, {
      method: 'POST',
      body: JSON.stringify({
        targetType: 'post',
        targetId: postId,
        likeType: 'like'
      }),
    }),

  getComments: (postId: number, params?: { page?: number; limit?: number; sortBy?: string }) => {
    const query = params ? `?${buildQueryString(params as Record<string, unknown>)}` : '';
    return apiCall<ForumComment[]>(`/api/v1/forum/posts/${postId}/comments${query}`, {
      method: 'GET',
    });
  },

  createComment: (postId: number, data: CreateForumCommentData) =>
    apiCall<ForumComment>(`/api/v1/forum/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateComment: (commentId: number, data: { content: string }) =>
    apiCall<ForumComment>(`/api/v1/forum/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteComment: (commentId: number) =>
    apiCall(`/api/v1/forum/comments/${commentId}`, {
      method: 'DELETE',
    }),
};

// ========================= NOTIFICATION APIs =========================
export const notificationAPI = {
  getAll: (params?: NotificationQueryParams) => {
    const query = params ? `?${buildQueryString(params as Record<string, unknown>)}` : '';
    return apiCall<PaginatedResponse<Notification>>(`/api/v1/notifications${query}`, {
      method: 'GET',
    });
  },

  getMy: (params?: NotificationQueryParams) => {
    const query = params ? `?${buildQueryString(params as Record<string, unknown>)}` : '';
    return apiCall<PaginatedResponse<Notification>>(`/api/v1/notifications/my${query}`, {
      method: 'GET',
    });
  },

  create: (data: CreateNotificationData) =>
    apiCall<Notification>('/api/v1/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<CreateNotificationData>) =>
    apiCall<Notification>(`/api/v1/notifications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getById: (id: number) =>
    apiCall<Notification>(`/api/v1/notifications/${id}`, {
      method: 'GET',
    }),

  markAsRead: (id: number) =>
    apiCall<Notification>(`/api/v1/notifications/${id}/read`, {
      method: 'PUT',
    }),

  markAllAsRead: () =>
    apiCall('/api/v1/notifications/mark-all-read', {
      method: 'PUT',
    }),

  delete: (id: number) =>
    apiCall(`/api/v1/notifications/${id}`, {
      method: 'DELETE',
    }),

  getUnreadCount: () =>
    apiCall<{ count: number }>('/api/v1/notifications/unread-count', {
      method: 'GET',
    }),

  getStats: () =>
    apiCall('/api/v1/notifications/stats', {
      method: 'GET',
    }),
};

// ========================= HEALTH CHECK API =========================
export const healthAPI = {
  check: () =>
    apiCall<{ success: boolean; message: string; timestamp: string; version: string }>('/health', {
      method: 'GET',
    }),
};

// ========================= DASHBOARD API =========================
export const dashboardAPI = {
  getAdminStats: (timeRange?: 'week' | 'month' | 'year') => {
    const query = timeRange ? `?timeRange=${timeRange}` : '';
    return apiCall<{
      totalUsers: number;
      totalStudents: number;
      totalTeachers: number;
      userGrowth: number;
      totalClasses: number;
      classGrowth: number;
      totalSubjects: number;
      totalLessons: number;
      totalAssignments: number;
      totalSubmissions: number;
      totalNotifications: number;
      totalGrades: number;
      recentActivities: Array<{
        id: number;
        type: string;
        name: string;
        createdAt: string;
      }>;
      userDistribution: {
        students: number;
        teachers: number;
        admins: number;
      };
    }>(`/api/v1/dashboard/admin/stats${query}`, {
      method: 'GET',
    });
  },

  getTeacherStats: () =>
    apiCall<{
      totalClasses: number;
      totalStudents: number;
      totalAssignments: number;
      pendingGrades: number;
    }>('/api/v1/dashboard/teacher/stats', {
      method: 'GET',
    }),

  getStudentStats: () =>
    apiCall<{
      enrolledClasses: number;
      totalAssignments: number;
      completedAssignments: number;
      pendingAssignments: number;
      averageGrade: number;
    }>('/api/v1/dashboard/student/stats', {
      method: 'GET',
    }),

  getSchoolGradeStats: (academicYear?: string, term?: '1' | '2' | 'final') => {
    const params = new URLSearchParams();
    if (academicYear) params.append('academicYear', academicYear);
    if (term) params.append('term', term);
    const query = params.toString() ? `?${params.toString()}` : '';
    
    return apiCall<{
      filters: {
        academicYear: string;
        term: string;
      };
      overall: {
        totalGrades: number;
        average: number;
      };
      byType: {
        [key: string]: {
          count: number;
          total: number;
          average: number;
          min: number;
          max: number;
        };
      };
      byTerm: {
        [key: string]: {
          count: number;
          total: number;
          average: number;
        };
      };
      byClass: Array<{
        classId: number;
        className: string;
        classCode: string;
        count: number;
        total: number;
        average: number;
      }>;
    }>(`/api/v1/dashboard/grades/school-stats${query}`, {
      method: 'GET',
    });
  },

  getClassGradeStats: (
    classId: number,
    academicYear?: string,
    term?: '1' | '2' | 'final',
    gradeType?: 'homework' | 'quiz' | 'midterm' | 'final' | 'assignment'
  ) => {
    const params = new URLSearchParams();
    if (academicYear) params.append('academicYear', academicYear);
    if (term) params.append('term', term);
    if (gradeType) params.append('gradeType', gradeType);
    const query = params.toString() ? `?${params.toString()}` : '';
    
    return apiCall<{
      classInfo: {
        id: number;
        name: string;
        code: string;
      };
      filters: {
        academicYear: string;
        term: string;
        gradeType: string;
      };
      overall: {
        totalGrades: number;
        totalStudents: number;
        average: number;
        min: number;
        max: number;
      };
      distribution: {
        excellent: number;
        good: number;
        average: number;
        below: number;
      };
      studentStats: Array<{
        studentId: number;
        studentName: string;
        studentCode: string;
        studentEmail: string;
        grades: {
          [key: string]: Array<{
            value: number;
            term: string;
            academicYear: string;
            subject: string;
          }>;
        };
        averages: {
          midterm: number;
          final: number;
          homework: number;
          overall: number;
        };
      }>;
    }>(`/api/v1/dashboard/grades/class-stats/${classId}${query}`, {
      method: 'GET',
    });
  },

  getClassStatistics: (params?: {
    academicYear?: string;
    term?: number;
  }) => {
    const query = params ? `?${buildQueryString(params as Record<string, unknown>)}` : '';
    return apiCall<{
      data: Array<{
        id: number;
        name: string;
        code: string;
        grade: string;
        totalStudents: number;
        activeStudents: number;
        inactiveStudents: number;
        totalSubjects: number;
        subjectName: string | null;
        teacherCount: number;
        teacherName: string | null;
        averageGrade: number;
      }>;
      summary: {
        totalClasses: number;
        totalStudents: number;
        totalActiveStudents: number;
        avgStudentsPerClass: number;
        overallAvgGrade: number;
        classesWithGrades: number;
      };
    }>(`/api/v1/dashboard/admin/class-statistics${query}`, {
      method: 'GET',
    });
  },

  getTeacherStatistics: (params?: {
    academicYear?: string;
    term?: number;
  }) => {
    const query = params ? `?${buildQueryString(params as Record<string, unknown>)}` : '';
    return apiCall<{
      data: Array<{
        id: number;
        name: string;
        email: string;
        avatar: string | null;
        totalClasses: number;
        totalSubjects: number;
        subjects: string[];
        totalStudents: number;
        assignmentCount: number;
        averageGrade: number;
        activeStatus: boolean;
      }>;
      summary: {
        totalTeachers: number;
        totalStudents: number;
        avgStudentsPerTeacher: number;
        totalAssignments: number;
        overallAvgGrade: number;
        teachersWithGrades: number;
      };
    }>(`/api/v1/dashboard/admin/teacher-statistics${query}`, {
      method: 'GET',
    });
  },

  getAcademicPerformance: (params?: {
    viewType?: 'class' | 'subject';
    term?: number;
    academicYear?: string;
  }) => {
    const query = params ? `?${new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString()}` : '';
    
    return apiCall<{
      data: Array<{
        id: number;
        name: string;
        type: 'class' | 'subject';
        code: string;
        totalStudents: number;
        averageGrade: number;
        excellentCount: number;
        goodCount: number;
        averageCount: number;
        belowAverageCount: number;
        passRate: number;
      }>;
      summary: {
        totalItems: number;
        totalStudents: number;
        overallAvgGrade: number;
        overallPassRate: number;
        totalExcellent: number;
        totalGood: number;
        totalAverage: number;
        totalBelowAverage: number;
        itemsWithGrades: number;
      };
    }>(`/api/v1/dashboard/admin/academic-performance${query}`, {
      method: 'GET',
    });
  },

  getAcademicYears: () =>
    apiCall<string[]>('/api/v1/dashboard/academic-years', {
      method: 'GET',
    }),

  getTeacherGradeStatistics: (params?: { academicYear?: string; term?: number }) => {
    const query = params ? `?${buildQueryString(params)}` : '';
    return apiCall<{
      data: Array<{
        id: string;
        classId: number;
        className: string;
        classCode: string;
        subjectId: number;
        subjectName: string;
        totalStudents: number;
        averageGrade: number;
        excellentCount: number;
        goodCount: number;
        averageCount: number;
        belowAverageCount: number;
        passRate: number;
      }>;
      summary: {
        totalClasses: number;
        totalSubjects: number;
        totalStudents: number;
        overallAvgGrade: number;
        classesWithGrades: number;
      };
    }>(`/api/v1/dashboard/teacher/grade-statistics${query}`, {
      method: 'GET',
    });
  },
};
