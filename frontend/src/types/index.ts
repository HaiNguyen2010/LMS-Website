// ========================= BASIC TYPES =========================
export type UserRole = 'admin' | 'teacher' | 'student';
export type AssignmentType = 'essay' | 'file_upload' | 'mcq';
export type GradeType = 'homework' | 'quiz' | 'midterm' | 'final' | 'assignment' | 'participation';
export type Term = '1' | '2' | 'final';
export type NotificationType = 'announcement' | 'assignment' | 'grade' | 'forum' | 'system' | 'reminder';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type LessonStatus = 'draft' | 'published' | 'archived';

// ========================= USER INTERFACES =========================
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phoneNumber?: string;
  code?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  phoneNumber?: string;
  code?: string;
  address?: string;
  isActive?: boolean;
}

// ========================= CLASS INTERFACES =========================
export interface Class {
  id: number;
  name: string;
  code: string;
  description?: string;
  maxStudents?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClassData {
  name: string;
  code: string;
  description?: string;
  maxStudents?: number;
}

// ========================= SUBJECT INTERFACES =========================
export interface Subject {
  id: number;
  name: string;
  code: string;
  description?: string;
  credits?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubjectData {
  name: string;
  code: string;
  description?: string;
  credits?: number;
}

// ========================= TEACHER ASSIGNMENT INTERFACES =========================
export interface TeacherAssignment {
  id: number;
  teacherId: number;
  classId: number;
  subjectId: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  teacher?: User;
  class?: Class;
  subject?: Subject;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeacherAssignmentData {
  teacherId: number;
  classId: number;
  subjectId: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

// ========================= STUDENT ENROLLMENT INTERFACES =========================
export interface StudentEnrollment {
  id: number;
  studentId: number;
  classId: number;
  enrollmentDate: string;
  status: string;
  isActive: boolean;
  student?: User;
  class?: Class;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentEnrollmentData {
  studentId: number;
  classId: number;
  enrollmentDate: string;
  isActive?: boolean;
}

// ========================= ATTACHMENT INTERFACES =========================
export interface Attachment {
  id: number;
  attachableType: 'lesson' | 'assignment' | 'submission';
  attachableId: number;
  fileName: string;
  originalName: string;
  fileUrl: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  sortOrder: number;
  description?: string;
  uploadedBy: number;
  createdAt: string;
  updatedAt: string;
}

// ========================= LESSON INTERFACES =========================
export interface Lesson {
  id: number;
  classId: number;
  subjectId: number;
  teacherId?: number;
  title: string;
  description?: string;
  content?: string;
  status: LessonStatus;
  attachments?: Attachment[];
  lessonAttachments?: Attachment[];
  class?: Class;
  subject?: Subject;
  teacher?: User;
  lessonTeacher?: User;
  lessonClass?: Class; // For backend response with nested relation
  lessonSubject?: Subject; // For backend response with nested relation
  lessonCreator?: User; // For backend response with nested relation (createdBy)
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLessonData {
  classId: number;
  subjectId: number;
  title: string;
  description?: string;
  status?: LessonStatus;
  files?: File[];
  deleteAttachmentIds?: number[];
}

// ========================= ASSIGNMENT INTERFACES =========================
export interface Assignment {
  id: number;
  title: string;
  description?: string;
  type: AssignmentType;
  classId: number;
  subjectId: number;
  dueDate: string;
  maxGrade: number;
  instructions?: string;
  allowedFileTypes?: string;
  maxFileSize?: number;
  mcqQuestions?: MCQQuestion[];
  status?: 'draft' | 'published' | 'archived';
  autoGrade?: boolean;
  showCorrectAnswers?: boolean;
  fileUrl?: string;
  fileName?: string;
  attachments?: Attachment[];
  assignmentAttachments?: Attachment[];
  class?: Class;
  subject?: Subject;
  assignmentClass?: Class; // For backend response with nested relation
  assignmentSubject?: Subject; // For backend response with nested relation
  createdAt: string;
  updatedAt: string;
}

export interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface CreateAssignmentData {
  title: string;
  description?: string;
  type: AssignmentType;
  classId: number;
  subjectId: number;
  dueDate: string;
  maxGrade: number;
  instructions?: string;
  allowedFileTypes?: string;
  maxFileSize?: number;
  mcqQuestions?: MCQQuestion[];
  autoGrade?: boolean;
  showCorrectAnswers?: boolean;
  file?: File;
}

// ========================= SUBMISSION INTERFACES =========================
export interface Submission {
  id: number;
  assignmentId: number;
  studentId: number;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  mcqAnswers?: number[] | string; // Array of answer indices or JSON string
  grade?: number | null;
  feedback?: string;
  submittedAt: string;
  gradedAt?: string;
  gradedBy?: number;
  isLate?: boolean;
  status?: "submitted" | "graded" | "late" | "missing" | "draft" | "returned" | "pending";
  attemptNumber?: number;
  student?: User;
  assignment?: Assignment;
  submissionStudent?: User; // For backend nested relations
  submissionAssignment?: Assignment; // For backend nested relations
  submissionGrader?: User; // For backend nested relations
  grader?: User; // Alternative naming for grader
  attachments?: Attachment[];
  submissionAttachments?: Attachment[];
}

export interface CreateSubmissionData {
  content?: string;
  file?: File;
}

export interface GradeSubmissionData {
  grade: number;
  feedback?: string;
  status?: "submitted" | "graded" | "late" | "missing" | "draft" | "returned";
  gradedBy?: number;
}

// ========================= GRADE INTERFACES =========================
export interface Grade {
  id: number;
  studentId: number;
  subjectId: number;
  classId: number;
  gradeValue: number;
  gradeType: GradeType;
  weight?: number;
  term: Term;
  academicYear: string;
  remarks?: string;
  recordedAt: string;
  student?: User;
  subject?: Subject;
  class?: Class;
  gradeStudent?: User;
  gradeSubject?: Subject;
  gradeClass?: Class;
}

export interface StudentGradesResponse {
  grades: Grade[];
  averages: Array<{
    subjectId: number;
    term: string;
    averageGrade: number;
    totalGrades: number;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface CreateGradeData {
  studentId: number;
  subjectId: number;
  classId: number;
  gradeValue: number;
  gradeType: GradeType;
  weight?: number;
  term: Term;
  academicYear: string;
  remarks?: string;
}

// ========================= FORUM INTERFACES =========================
export interface ForumPost {
  id: number;
  title: string;
  content: string;
  authorId: number;
  classId: number;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isLikedByUser?: boolean; // Thêm field này
  tags?: string[];
  attachments?: Attachment[];
  author?: User;
  class?: Class;
  createdAt: string;
  updatedAt: string;
}

export interface CreateForumPostData {
  title: string;
  content: string;
  tags?: string[];
  attachments?: Attachment[];
}

export interface ForumComment {
  id: number;
  postId: number;
  authorId: number;
  content: string;
  parentId?: number;
  author?: User;
  replies?: ForumComment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateForumCommentData {
  content: string;
  parentId?: number;
}

// ========================= NOTIFICATION INTERFACES =========================
export interface Notification {
  id: number;
  title: string;
  message: string;
  senderId: number;
  receiverRole: UserRole | 'all';
  classId?: number;
  subjectId?: number;
  type: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  readCount?: number;
  targetCount?: number;
  scheduledAt?: string;
  sentAt?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
  attachments?: Attachment[];
  sender?: User;
  class?: Class;
  subject?: Subject;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationData {
  title: string;
  message: string;
  receiverRole: UserRole | 'all';
  classId?: number;
  subjectId?: number;
  type?: NotificationType;
  priority?: NotificationPriority;
  scheduledAt?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
  attachments?: Attachment[];
}

// ========================= PAGINATION INTERFACES =========================
export interface PaginationInfo {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  items?: T[]; // For generic paginated responses
  users?: T[]; // For user endpoints
  classes?: T[]; // For class endpoints
  subjects?: T[]; // For subject endpoints
  lessons?: T[]; // For lesson endpoints
  assignments?: T[]; // For assignment endpoints
  grades?: T[]; // For grade endpoints
  enrollments?: T[]; // For student enrollment endpoints
  posts?: T[]; // For forum posts endpoints
  submissions?: T[]; // For submission endpoints
  notifications?: T[]; // For notification endpoints
  pagination: PaginationInfo;
}

// ========================= API RESPONSE INTERFACES =========================
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
    value?: string | number | boolean;
  }>;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

// ========================= QUERY PARAMS INTERFACES =========================
export interface UserQueryParams {
  page?: number;
  limit?: number;
  role?: UserRole;
  search?: string;
  sortBy?: 'createdAt' | 'name' | 'email' | 'role';
  sortOrder?: 'ASC' | 'DESC';
}

export interface ClassQueryParams {
  page?: number;
  limit?: number;
  grade?: number;
  search?: string;
}

export interface SubjectQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface LessonQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  classId?: number;
  subjectId?: number;
  status?: LessonStatus;
}

export interface LessonsByClassResponse {
  lessons: Lesson[];
  classInfo: {
    id: number;
    name: string;
    code: string;
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface AssignmentQueryParams {
  page?: number;
  limit?: number;
  classId?: number;
  subjectId?: number;
  type?: AssignmentType;
  status?: string;
}

export interface GradeQueryParams {
  page?: number;
  limit?: number;
  classId?: number;
  subjectId?: number;
  term?: Term;
  academicYear?: string;
  gradeType?: GradeType;
  sortBy?: 'recordedAt' | 'gradeValue' | 'studentId' | 'subjectId';
  sortOrder?: 'ASC' | 'DESC';
}

export interface ForumQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'latest' | 'popular' | 'mostLiked';
  isPinned?: boolean;
  tags?: string;
}

export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  type?: NotificationType;
  priority?: NotificationPriority;
  isRead?: boolean;
  classId?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// ========================= AUTH CONTEXT =========================
export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

// Dashboard route config
export interface DashboardRoute {
  role: UserRole;
  path: string;
  name: string;
}

// Route protection config
export interface RouteProtection {
  requireAuth: boolean;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

// Navigation item
export interface NavItem {
  name: string;
  href: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  current?: boolean;
}



// Environment variables
export interface AppConfig {
  API_BASE_URL: string;
  APP_NAME: string;
  APP_VERSION: string;
}

// Navigation item interface
export interface NavigationItem {
  name: string;
  href: string;
  current: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

