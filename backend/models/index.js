const { sequelize } = require('../config/database');
const User = require('./User');
const Class = require('./Class');
const Subject = require('./Subject');
const TeacherAssignment = require('./TeacherAssignment');
const ClassStudent = require('./ClassStudent');
const Lesson = require('./Lesson');
const Assignment = require('./Assignment');
const Submission = require('./Submission');
const Grade = require('./Grade');
const ForumPost = require('./ForumPost');
const ForumComment = require('./ForumComment');
const ForumLike = require('./ForumLike');
const Notification = require('./Notification');
const ChatMessage = require('./ChatMessage');
const Attachment = require('./Attachment');

// Khởi tạo quan hệ giữa các model
const initializeModels = () => {
  // User relationships
  User.hasMany(TeacherAssignment, { 
    foreignKey: 'teacherId', 
    as: 'userTeacherAssignments',
    onDelete: 'CASCADE'
  });
  User.hasMany(ClassStudent, { 
    foreignKey: 'studentId', 
    as: 'classEnrollments',
    onDelete: 'CASCADE'
  });

  // Class relationships
  Class.hasMany(TeacherAssignment, { 
    foreignKey: 'classId', 
    as: 'classTeacherAssignments',
    onDelete: 'CASCADE'
  });
  Class.hasMany(ClassStudent, { 
    foreignKey: 'classId', 
    as: 'students',
    onDelete: 'CASCADE'
  });

  // Subject relationships
  Subject.hasMany(TeacherAssignment, { 
    foreignKey: 'subjectId', 
    as: 'subjectTeacherAssignments',
    onDelete: 'CASCADE'
  });

  // TeacherAssignment relationships
  TeacherAssignment.belongsTo(User, { 
    foreignKey: 'teacherId', 
    as: 'teacher',
    onDelete: 'CASCADE'
  });
  TeacherAssignment.belongsTo(Class, { 
    foreignKey: 'classId', 
    as: 'assignmentClass',
    onDelete: 'CASCADE'
  });
  TeacherAssignment.belongsTo(Subject, { 
    foreignKey: 'subjectId', 
    as: 'assignmentSubject',
    onDelete: 'CASCADE'
  });

  // ClassStudent relationships
  ClassStudent.belongsTo(Class, { 
    foreignKey: 'classId', 
    as: 'enrollmentClass',
    onDelete: 'CASCADE'
  });
  ClassStudent.belongsTo(User, { 
    foreignKey: 'studentId', 
    as: 'student',
    onDelete: 'CASCADE'
  });

  // Lesson relationships - Main associations
  Lesson.belongsTo(Class, {
    foreignKey: 'classId',
    as: 'lessonClass',
    onDelete: 'CASCADE'
  });
  
  Lesson.belongsTo(Subject, {
    foreignKey: 'subjectId',
    as: 'lessonSubject',
    onDelete: 'CASCADE'
  });
  
  Lesson.belongsTo(User, {
    foreignKey: 'createdBy',
    as: 'lessonCreator',
    onDelete: 'CASCADE'
  });

  // Reverse relationships for Lesson
  Class.hasMany(Lesson, {
    foreignKey: 'classId',
    as: 'classLessons',
    onDelete: 'CASCADE'
  });
  
  Subject.hasMany(Lesson, {
    foreignKey: 'subjectId',
    as: 'subjectLessons',
    onDelete: 'CASCADE'
  });
  
  User.hasMany(Lesson, {
    foreignKey: 'createdBy',
    as: 'userCreatedLessons',
    onDelete: 'CASCADE'
  });

  // Many-to-Many relationships through junction tables
  User.belongsToMany(Class, {
    through: ClassStudent,
    foreignKey: 'studentId',
    otherKey: 'classId',
    as: 'enrolledClasses'
  });
  
  Class.belongsToMany(User, {
    through: ClassStudent,
    foreignKey: 'classId',
    otherKey: 'studentId',
    as: 'enrolledStudents'
  });

  Class.belongsToMany(Subject, {
    through: TeacherAssignment,
    foreignKey: 'classId',
    otherKey: 'subjectId',
    as: 'classSubjects'
  });

  Subject.belongsToMany(Class, {
    through: TeacherAssignment,
    foreignKey: 'subjectId',
    otherKey: 'classId',
    as: 'subjectClasses'
  });

  // Assignment relationships
  Assignment.belongsTo(Class, {
    foreignKey: 'classId',
    as: 'assignmentClass',
    onDelete: 'CASCADE'
  });
  
  Assignment.belongsTo(Subject, {
    foreignKey: 'subjectId',
    as: 'assignmentSubject',
    onDelete: 'CASCADE'
  });
  
  Assignment.belongsTo(User, {
    foreignKey: 'createdBy',
    as: 'assignmentCreator',
    onDelete: 'CASCADE'
  });

  // Reverse relationships for Assignment
  Class.hasMany(Assignment, {
    foreignKey: 'classId',
    as: 'classAssignments',
    onDelete: 'CASCADE'
  });
  
  Subject.hasMany(Assignment, {
    foreignKey: 'subjectId',
    as: 'subjectAssignments',
    onDelete: 'CASCADE'
  });
  
  User.hasMany(Assignment, {
    foreignKey: 'createdBy',
    as: 'userCreatedAssignments',
    onDelete: 'CASCADE'
  });

  // Submission relationships
  Submission.belongsTo(Assignment, {
    foreignKey: 'assignmentId',
    as: 'submissionAssignment',
    onDelete: 'CASCADE'
  });
  
  Submission.belongsTo(User, {
    foreignKey: 'studentId',
    as: 'submissionStudent',
    onDelete: 'CASCADE'
  });
  
  Submission.belongsTo(User, {
    foreignKey: 'gradedBy',
    as: 'submissionGrader',
    onDelete: 'SET NULL'
  });

  // Reverse relationships for Submission
  Assignment.hasMany(Submission, {
    foreignKey: 'assignmentId',
    as: 'assignmentSubmissions',
    onDelete: 'CASCADE'
  });
  
  User.hasMany(Submission, {
    foreignKey: 'studentId',
    as: 'userSubmissions',
    onDelete: 'CASCADE'
  });
  
  User.hasMany(Submission, {
    foreignKey: 'gradedBy',
    as: 'userGradedSubmissions',
    onDelete: 'SET NULL'
  });

  // Grade relationships
  Grade.belongsTo(User, {
    foreignKey: 'studentId',
    as: 'gradeStudent',
    onDelete: 'CASCADE'
  });
  
  Grade.belongsTo(Subject, {
    foreignKey: 'subjectId',
    as: 'gradeSubject',
    onDelete: 'CASCADE'
  });
  
  Grade.belongsTo(Class, {
    foreignKey: 'classId',
    as: 'gradeClass',
    onDelete: 'CASCADE'
  });
  
  Grade.belongsTo(User, {
    foreignKey: 'recordedBy',
    as: 'gradeRecorder',
    onDelete: 'CASCADE'
  });

  // Reverse relationships for Grade
  User.hasMany(Grade, {
    foreignKey: 'studentId',
    as: 'studentGrades',
    onDelete: 'CASCADE'
  });
  
  User.hasMany(Grade, {
    foreignKey: 'recordedBy',
    as: 'recordedGrades',
    onDelete: 'CASCADE'
  });
  
  Subject.hasMany(Grade, {
    foreignKey: 'subjectId',
    as: 'subjectGrades',
    onDelete: 'CASCADE'
  });
  
  Class.hasMany(Grade, {
    foreignKey: 'classId',
    as: 'classGrades',
    onDelete: 'CASCADE'
  });

  // Forum relationships
  User.hasMany(ForumPost, {
    foreignKey: 'authorId',
    as: 'forumPosts',
    onDelete: 'CASCADE'
  });
  ForumPost.belongsTo(User, {
    foreignKey: 'authorId',
    as: 'author'
  });

  Class.hasMany(ForumPost, {
    foreignKey: 'classId',
    as: 'classPosts',
    onDelete: 'CASCADE'
  });
  ForumPost.belongsTo(Class, {
    foreignKey: 'classId',
    as: 'class'
  });

  User.hasMany(ForumComment, {
    foreignKey: 'authorId',
    as: 'forumComments',
    onDelete: 'CASCADE'
  });
  ForumComment.belongsTo(User, {
    foreignKey: 'authorId',
    as: 'author'
  });

  ForumPost.hasMany(ForumComment, {
    foreignKey: 'postId',
    as: 'comments',
    onDelete: 'CASCADE'
  });
  ForumComment.belongsTo(ForumPost, {
    foreignKey: 'postId',
    as: 'post'
  });

  ForumComment.hasMany(ForumComment, {
    foreignKey: 'parentId',
    as: 'replies',
    onDelete: 'CASCADE'
  });
  ForumComment.belongsTo(ForumComment, {
    foreignKey: 'parentId',
    as: 'parent'
  });

  // Forum likes relationships
  User.hasMany(ForumLike, {
    foreignKey: 'userId',
    as: 'forumLikes',
    onDelete: 'CASCADE'
  });
  ForumLike.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });

  // Notification relationships
  User.hasMany(Notification, {
    foreignKey: 'senderId',
    as: 'sentNotifications',
    onDelete: 'CASCADE'
  });
  Notification.belongsTo(User, {
    foreignKey: 'senderId',
    as: 'sender'
  });

  Class.hasMany(Notification, {
    foreignKey: 'classId',
    as: 'classNotifications',
    onDelete: 'SET NULL'
  });
  Notification.belongsTo(Class, {
    foreignKey: 'classId',
    as: 'class'
  });

  Subject.hasMany(Notification, {
    foreignKey: 'subjectId',
    as: 'subjectNotifications',
    onDelete: 'SET NULL'
  });
  Notification.belongsTo(Subject, {
    foreignKey: 'subjectId',
    as: 'subject'
  });

  // Attachment relationships - Polymorphic associations
  // Attachment belongsTo User (uploader)
  Attachment.belongsTo(User, {
    foreignKey: 'uploadedBy',
    as: 'uploader',
    onDelete: 'RESTRICT'
  });

  User.hasMany(Attachment, {
    foreignKey: 'uploadedBy',
    as: 'uploadedAttachments',
    onDelete: 'RESTRICT'
  });

  // Polymorphic associations for Lesson
  Lesson.hasMany(Attachment, {
    foreignKey: 'attachableId',
    constraints: false,
    scope: {
      attachable_type: 'lesson'
    },
    as: 'attachments'
  });

  // Polymorphic associations for Assignment
  Assignment.hasMany(Attachment, {
    foreignKey: 'attachableId',
    constraints: false,
    scope: {
      attachable_type: 'assignment'
    },
    as: 'attachments'
  });

  // Polymorphic associations for Submission
  Submission.hasMany(Attachment, {
    foreignKey: 'attachableId',
    constraints: false,
    scope: {
      attachable_type: 'submission'
    },
    as: 'attachments'
  });

  // Chat message relationships
  User.hasMany(ChatMessage, {
    foreignKey: 'senderId',
    as: 'chatMessages',
    onDelete: 'CASCADE'
  });
  ChatMessage.belongsTo(User, {
    foreignKey: 'senderId',
    as: 'sender'
  });

  Class.hasMany(ChatMessage, {
    foreignKey: 'classId',
    as: 'classChatMessages',
    onDelete: 'CASCADE'
  });
  ChatMessage.belongsTo(Class, {
    foreignKey: 'classId',
    as: 'class'
  });

  ChatMessage.hasMany(ChatMessage, {
    foreignKey: 'replyToId',
    as: 'replies',
    onDelete: 'SET NULL'
  });
  ChatMessage.belongsTo(ChatMessage, {
    foreignKey: 'replyToId',
    as: 'replyTo'
  });
};

// Đồng bộ database
const syncDatabase = async (options = {}) => {
  try {
    initializeModels();
    await sequelize.sync(options);
    console.log('✅ Database synchronized successfully!');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  Class,
  Subject,
  TeacherAssignment,
  ClassStudent,
  Lesson,
  Assignment,
  Submission,
  Grade,
  ForumPost,
  ForumComment,
  ForumLike,
  Notification,
  ChatMessage,
  Attachment,
  syncDatabase,
  initializeModels
};