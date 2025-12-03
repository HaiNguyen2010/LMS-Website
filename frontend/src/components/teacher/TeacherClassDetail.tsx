"use client";

import { useEffect, useState, useCallback } from "react";
import { Assignment, Lesson } from "@/types";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import { assignmentAPI, lessonAPI } from "@/lib/apiClient";
import { TeacherLessonDetail } from "./TeacherLessonDetail";
import { TeacherAssignmentDetail } from "./TeacherAssignmentDetail";
import { TeacherCreateLessonModal } from "./TeacherCreateLessonModal";
import { TeacherEditLessonModal } from "./TeacherEditLessonModal";
import { TeacherCreateAssignmentModal } from "./TeacherCreateAssignmentModal";
import { TeacherEditAssignmentModal } from "./TeacherEditAssignmentModal";

interface TeacherClassDetailProps {
  classId: number;
  className: string;
  initialSubject?: number;
  onBack: () => void;
  onTabChange?: (tab: string) => void;
}

export function TeacherClassDetail({
  classId,
  className,
  initialSubject,
  onBack,
  onTabChange,
}: TeacherClassDetailProps) {
  const [activeTab, setActiveTab] = useState<"lessons" | "assignments">(
    "lessons"
  );
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<number | "all">("all");
  const [showCreateLessonModal, setShowCreateLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] =
    useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(
    null
  );

  const loadClassData = useCallback(async () => {
    try {
      setLoading(true);

      console.log("Loading class data for classId:", classId);

      // Load lessons - Backend automatically filters by teacher's assignments
      // Teacher only sees lessons in classes/subjects they are assigned to teach
      const lessonsResponse = await lessonAPI.getAll({
        page: 1,
        limit: 100,
        classId: classId,
      });
      console.log("Lessons Response:", lessonsResponse);

      // API trả về { success: true, data: { lessons: [...], pagination: {...} } }
      let lessonsData: Lesson[] = [];

      if (lessonsResponse.data && lessonsResponse.data.lessons) {
        lessonsData = lessonsResponse.data.lessons;
      } else if (Array.isArray(lessonsResponse.data)) {
        lessonsData = lessonsResponse.data;
      } else if (lessonsResponse.data?.items) {
        lessonsData = lessonsResponse.data.items;
      }

      console.log("Lessons Data:", lessonsData);
      console.log("Lessons Count:", lessonsData.length);

      // Load assignments - Backend automatically filters by teacher's assignments
      // Teacher only sees assignments in classes/subjects they are assigned to teach
      const assignmentsResponse = await assignmentAPI.getAll({
        page: 1,
        limit: 100,
      });
      const allAssignments =
        assignmentsResponse.data?.assignments ||
        assignmentsResponse.data?.items ||
        [];
      const classAssignments = allAssignments.filter(
        (a: Assignment) => a.classId === classId
      );

      console.log("Final lessons to set:", lessonsData);
      setLessons(lessonsData);
      setAssignments(classAssignments);
    } catch (error) {
      console.error("Error loading class data:", error);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    loadClassData();
  }, [loadClassData]);

  // Set initial subject filter if provided
  useEffect(() => {
    if (initialSubject) {
      setSelectedSubject(initialSubject);
    }
  }, [initialSubject]);

  // Get unique subjects from lessons and assignments
  const getUniqueSubjects = () => {
    const subjectsMap = new Map<
      number,
      { id: number; name: string; code: string }
    >();

    lessons.forEach((lesson) => {
      if (lesson.lessonSubject) {
        subjectsMap.set(lesson.lessonSubject.id, {
          id: lesson.lessonSubject.id,
          name: lesson.lessonSubject.name,
          code: lesson.lessonSubject.code,
        });
      }
    });

    assignments.forEach((assignment) => {
      if (assignment.assignmentSubject) {
        subjectsMap.set(assignment.assignmentSubject.id, {
          id: assignment.assignmentSubject.id,
          name: assignment.assignmentSubject.name,
          code: assignment.assignmentSubject.code,
        });
      }
    });

    return Array.from(subjectsMap.values());
  };

  // Filter lessons by subject
  const filteredLessons =
    selectedSubject === "all"
      ? lessons
      : lessons.filter(
          (lesson) => lesson.lessonSubject?.id === selectedSubject
        );

  // Filter assignments by subject
  const filteredAssignments =
    selectedSubject === "all"
      ? assignments
      : assignments.filter(
          (assignment) => assignment.assignmentSubject?.id === selectedSubject
        );

  const uniqueSubjects = getUniqueSubjects();

  const handleDeleteLesson = async (lessonId: number) => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn xóa bài giảng này? Hành động này không thể hoàn tác."
      )
    ) {
      return;
    }

    try {
      await lessonAPI.delete(lessonId);
      // Reload data after deletion
      loadClassData();
    } catch (error) {
      console.error("Error deleting lesson:", error);
      alert("Có lỗi xảy ra khi xóa bài giảng. Vui lòng thử lại.");
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn xóa bài tập này? Hành động này không thể hoàn tác."
      )
    ) {
      return;
    }

    try {
      await assignmentAPI.delete(assignmentId);
      // Reload data after deletion
      loadClassData();
    } catch (error) {
      console.error("Error deleting assignment:", error);
      alert("Có lỗi xảy ra khi xóa bài tập. Vui lòng thử lại.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu lớp học...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại danh sách lớp học
        </button>
        <h2 className="text-2xl font-bold text-gray-800">{className}</h2>
        <p className="text-gray-600 mt-1">Bài giảng và bài tập của lớp học</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("lessons")}
              className={`flex items-center gap-2 pb-3 px-2 border-b-2 font-medium transition ${
                activeTab === "lessons"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              <BookOpen className="w-5 h-5" />
              Bài giảng ({filteredLessons.length})
            </button>
            <button
              onClick={() => setActiveTab("assignments")}
              className={`flex items-center gap-2 pb-3 px-2 border-b-2 font-medium transition ${
                activeTab === "assignments"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              <FileText className="w-5 h-5" />
              Bài tập ({filteredAssignments.length})
            </button>
          </div>

          {/* Add Lesson Button - Only show on lessons tab */}
          {activeTab === "lessons" && (
            <button
              onClick={() => setShowCreateLessonModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <Plus className="w-5 h-5" />
              Tạo bài giảng
            </button>
          )}

          {/* Add Assignment Button - Only show on assignments tab */}
          {activeTab === "assignments" && (
            <button
              onClick={() => setShowCreateAssignmentModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <Plus className="w-5 h-5" />
              Tạo bài tập
            </button>
          )}
        </div>
      </div>

      {/* Subject Filter */}
      {uniqueSubjects.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-700">
              Lọc theo môn học:
            </span>
            <button
              onClick={() => setSelectedSubject("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedSubject === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Tất cả ({lessons.length + assignments.length})
            </button>
            {uniqueSubjects.map((subject) => {
              const subjectLessonsCount = lessons.filter(
                (l) => l.lessonSubject?.id === subject.id
              ).length;
              const subjectAssignmentsCount = assignments.filter(
                (a) => a.assignmentSubject?.id === subject.id
              ).length;
              const totalCount = subjectLessonsCount + subjectAssignmentsCount;

              return (
                <button
                  key={subject.id}
                  onClick={() => setSelectedSubject(subject.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    selectedSubject === subject.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {subject.name} ({totalCount})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === "lessons" ? (
        <div className="space-y-4">
          {filteredLessons.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {selectedSubject === "all"
                  ? "Chưa có bài giảng nào"
                  : "Không có bài giảng cho môn học này"}
              </h3>
              <p className="text-gray-500">
                {selectedSubject === "all"
                  ? "Giáo viên chưa đăng bài giảng cho lớp học này"
                  : "Thử chọn môn học khác hoặc xem tất cả bài giảng"}
              </p>
            </div>
          ) : (
            filteredLessons.map((lesson, index) => (
              <div
                key={lesson.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg w-12 h-12 flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-md">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {lesson.title}
                        </h3>
                        {lesson.status === "published" && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Đã xuất bản
                          </span>
                        )}
                      </div>
                      {lesson.description && (
                        <p className="text-gray-600 text-sm">
                          {lesson.description}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3 mb-3 flex-wrap">
                      {lesson.lessonClass && (
                        <div className="flex items-center text-sm text-gray-600">
                          <BookOpen className="w-4 h-4 mr-2 text-blue-500" />
                          <span>
                            <span className="font-medium">Lớp:</span>{" "}
                            {lesson.lessonClass.name}
                          </span>
                        </div>
                      )}
                      {lesson.lessonSubject && (
                        <div className="flex items-center text-sm text-gray-600">
                          <FileText className="w-4 h-4 mr-2 text-purple-500" />
                          <span>
                            <span className="font-medium">Môn:</span>{" "}
                            {lesson.lessonSubject.name}
                          </span>
                        </div>
                      )}
                      {lesson.lessonCreator && (
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="w-4 h-4 mr-2 text-green-500">
                            👤
                          </span>
                          <span>
                            <span className="font-medium">GV:</span>{" "}
                            {lesson.lessonCreator.name}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(lesson.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(lesson.createdAt).toLocaleTimeString(
                          "vi-VN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </div>
                      {lesson.attachments && lesson.attachments.length > 0 && (
                        <div className="flex items-center text-blue-600">
                          <FileText className="w-4 h-4 mr-1" />
                          <span className="font-medium">
                            {lesson.attachments.length} tài liệu
                          </span>
                        </div>
                      )}
                    </div>

                    {lesson.updatedAt &&
                      lesson.updatedAt !== lesson.createdAt && (
                        <div className="mt-2 text-xs text-gray-500 italic">
                          Cập nhật:{" "}
                          {new Date(lesson.updatedAt).toLocaleString("vi-VN")}
                        </div>
                      )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setSelectedLesson(lesson)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center gap-2 whitespace-nowrap"
                    >
                      <BookOpen className="w-4 h-4" />
                      Xem chi tiết
                    </button>
                    <button
                      onClick={() => setEditingLesson(lesson)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium flex items-center gap-2 whitespace-nowrap"
                    >
                      <Edit className="w-4 h-4" />
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteLesson(lesson.id)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium flex items-center gap-2 whitespace-nowrap"
                    >
                      <Trash2 className="w-4 h-4" />
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {selectedSubject === "all"
                  ? "Chưa có bài tập nào"
                  : "Không có bài tập cho môn học này"}
              </h3>
              <p className="text-gray-500">
                {selectedSubject === "all"
                  ? "Giáo viên chưa giao bài tập cho lớp học này"
                  : "Thử chọn môn học khác hoặc xem tất cả bài tập"}
              </p>
            </div>
          ) : (
            filteredAssignments.map((assignment) => {
              return (
                <div
                  key={assignment.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
                >
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {assignment.title}
                        </h3>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                          {assignment.status === "published"
                            ? "Đã xuất bản"
                            : "Nháp"}
                        </span>
                      </div>
                      {assignment.description && (
                        <p className="text-sm text-gray-600 mb-3">
                          {assignment.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(assignment.dueDate).toLocaleDateString(
                            "vi-VN"
                          )}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {new Date(assignment.dueDate).toLocaleTimeString(
                            "vi-VN",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </div>
                        <div>Điểm tối đa: {assignment.maxGrade}</div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setSelectedAssignment(assignment)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center gap-2 whitespace-nowrap"
                      >
                        <FileText className="w-4 h-4" />
                        Xem chi tiết
                      </button>
                      <button
                        onClick={() => setEditingAssignment(assignment)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium flex items-center gap-2 whitespace-nowrap"
                      >
                        <Edit className="w-4 h-4" />
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium flex items-center gap-2 whitespace-nowrap"
                      >
                        <Trash2 className="w-4 h-4" />
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Lesson Detail Modal */}
      {selectedLesson && (
        <TeacherLessonDetail
          lesson={selectedLesson}
          onClose={() => setSelectedLesson(null)}
        />
      )}

      {/* Assignment Detail Modal */}
      {selectedAssignment && (
        <TeacherAssignmentDetail
          assignment={selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
        />
      )}

      {/* Create Lesson Modal */}
      {showCreateLessonModal && (
        <TeacherCreateLessonModal
          classId={classId}
          className={className}
          onClose={() => setShowCreateLessonModal(false)}
          onSuccess={() => {
            setShowCreateLessonModal(false);
            loadClassData(); // Reload lessons after creating
          }}
        />
      )}

      {/* Edit Lesson Modal */}
      {editingLesson && (
        <TeacherEditLessonModal
          lesson={editingLesson}
          onClose={() => setEditingLesson(null)}
          onSuccess={() => {
            setEditingLesson(null);
            loadClassData(); // Reload lessons after updating
          }}
        />
      )}

      {/* Create Assignment Modal */}
      {showCreateAssignmentModal && (
        <TeacherCreateAssignmentModal
          classId={classId}
          className={className}
          onClose={() => setShowCreateAssignmentModal(false)}
          onSuccess={() => {
            setShowCreateAssignmentModal(false);
            loadClassData(); // Reload assignments after creating
          }}
        />
      )}

      {/* Edit Assignment Modal */}
      {editingAssignment && (
        <TeacherEditAssignmentModal
          assignment={editingAssignment}
          onClose={() => setEditingAssignment(null)}
          onSuccess={() => {
            setEditingAssignment(null);
            loadClassData(); // Reload assignments after updating
          }}
        />
      )}
    </div>
  );
}
