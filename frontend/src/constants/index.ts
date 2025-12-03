// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
    RESET_PASSWORD: '/api/v1/auth/reset-password',
    CHANGE_PASSWORD: '/api/v1/auth/change-password',
    PROFILE: '/api/v1/auth/profile',
  },
  
  // User endpoints
  USERS: {
    BASE: '/api/v1/users',
    PROFILE: (id: string) => `/api/v1/users/${id}`,
    BULK_IMPORT: '/api/v1/users/bulk-import',
    STATS: '/api/v1/users/stats',
  },
  
  // Class endpoints
  CLASSES: {
    BASE: '/api/v1/classes',
    DETAIL: (id: string) => `/api/v1/classes/${id}`,
    STUDENTS: (id: string) => `/api/v1/classes/${id}/students`,
    ENROLL: (id: string) => `/api/v1/classes/${id}/enroll`,
    STATS: '/api/v1/classes/stats',
  },
  
  // Subject endpoints
  SUBJECTS: {
    BASE: '/api/v1/subjects',
    DETAIL: (id: string) => `/api/v1/subjects/${id}`,
    ASSIGN_CLASS: (id: string) => `/api/v1/subjects/${id}/assign-class`,
    CLASSES: (id: string) => `/api/v1/subjects/${id}/classes`,
    STATS: '/api/v1/subjects/stats',
  },
  
  // Lesson endpoints
  LESSONS: {
    BASE: '/api/v1/lessons',
    DETAIL: (id: string) => `/api/v1/lessons/${id}`,
    ATTACHMENTS: (id: string) => `/api/v1/lessons/${id}/attachments`,
    PUBLISH: (id: string) => `/api/v1/lessons/${id}/publish`,
    STATS: (classId: string) => `/api/v1/lessons/class/${classId}/stats`,
  },
  
  // Assignment endpoints
  ASSIGNMENTS: {
    BASE: '/api/v1/assignments',
    DETAIL: (id: string) => `/api/v1/assignments/${id}`,
    SUBMISSIONS: (id: string) => `/api/v1/assignments/${id}/submissions`,
    STATISTICS: (id: string) => `/api/v1/assignments/${id}/statistics`,
    DUPLICATE: (id: string) => `/api/v1/assignments/${id}/duplicate`,
  },
  
  // Grade endpoints
  GRADES: {
    BASE: '/api/v1/grades',
    DETAIL: (id: string) => `/api/v1/grades/${id}`,
    STUDENT_REPORT: (studentId: string) => `/api/v1/grades/student/${studentId}/report`,
    CLASS_STATS: (classId: string) => `/api/v1/grades/class/${classId}/stats`,
    BULK_CREATE: '/api/v1/grades/bulk-create',
    BULK_PUBLISH: '/api/v1/grades/bulk-publish',
  },
} as const;

// App configuration
export const APP_CONFIG = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  API_TIMEOUT: 10000, // 10 seconds
  APP_NAME: 'LMS - Learning Management System',
  APP_VERSION: '1.0.0',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const;

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
} as const;

// Route paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  CHANGE_PASSWORD: '/change-password',
  DASHBOARD: {
    ADMIN: '/dashboard/admin',
    TEACHER: '/dashboard/teacher',
    STUDENT: '/dashboard/student',
  },
} as const;