"use client";

import { useEffect, useState, useCallback } from "react";
import { Assignment, Submission, Lesson } from "@/types";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Upload,
  X,
} from "lucide-react";
import { assignmentAPI, submissionAPI, lessonAPI } from "@/lib/apiClient";
import { LessonDetail } from "./LessonDetail";
import { AssignmentDetail } from "./AssignmentDetail";

interface ClassDetailProps {
  classId: number;
  className: string;
  initialSubject?: number;
  onBack: () => void;
  onTabChange?: (tab: string) => void;
}

export function ClassDetail({
  classId,
  className,
  initialSubject,
  onBack,
  onTabChange,
}: ClassDetailProps) {
  const [activeTab, setActiveTab] = useState<"lessons" | "assignments">(
    "lessons"
  );
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submissionContent, setSubmissionContent] = useState("");
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<number | "all">("all");

  const loadClassData = useCallback(async () => {
    try {
      setLoading(true);

      console.log("Loading class data for classId:", classId);

      // Load lessons
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

      // Load assignments
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

      // Load submissions
      const submissionsResponse = await submissionAPI.getMySubmissions({
        page: 1,
        limit: 100,
      });
      const userSubmissions = Array.isArray(submissionsResponse.data)
        ? submissionsResponse.data
        : submissionsResponse.data?.submissions ||
          submissionsResponse.data?.items ||
          [];

      console.log("Final lessons to set:", lessonsData);
      setLessons(lessonsData);
      setAssignments(classAssignments);
      setSubmissions(userSubmissions);
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

  const handleSubmitAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmitModal(true);
    setSubmissionContent("");
    setSubmissionFiles([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSubmissionFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    if (!selectedAssignment) return;

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("assignmentId", selectedAssignment.id.toString());
      formData.append("content", submissionContent);

      submissionFiles.forEach((file) => {
        formData.append("files", file);
      });

      await submissionAPI.create(selectedAssignment.id, formData);

      alert("Nộp bài thành công!");
      setShowSubmitModal(false);
      setSelectedAssignment(null);
      setSubmissionContent("");
      setSubmissionFiles([]);

      // Reload data
      await loadClassData();
    } catch (error) {
      console.error("Error submitting assignment:", error);
      alert("Có lỗi xảy ra khi nộp bài. Vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  const getSubmissionStatus = (assignmentId: number) => {
    return submissions.find((s) => s.assignmentId === assignmentId);
  };

  const isOverdue = (dueDate: string, hasSubmission: boolean) => {
    if (hasSubmission) return false;
    return new Date(dueDate) < new Date();
  };

  const getDaysUntilDue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

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
                  <button
                    onClick={() => setSelectedLesson(lesson)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    Xem chi tiết
                  </button>
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
              const submission = getSubmissionStatus(assignment.id);
              const overdue = isOverdue(assignment.dueDate, !!submission);
              const daysUntilDue = getDaysUntilDue(assignment.dueDate);

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
                        {submission ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Đã nộp
                          </span>
                        ) : overdue ? (
                          <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Quá hạn
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                            Chưa nộp
                          </span>
                        )}
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

                      {!submission && !overdue && (
                        <div
                          className={`text-sm font-medium mt-2 ${
                            daysUntilDue <= 1
                              ? "text-red-600"
                              : daysUntilDue <= 3
                              ? "text-orange-600"
                              : "text-gray-600"
                          }`}
                        >
                          {daysUntilDue === 0
                            ? "⏰ Hạn nộp hôm nay"
                            : daysUntilDue === 1
                            ? "⏰ Hạn nộp ngày mai"
                            : `📅 Còn ${daysUntilDue} ngày`}
                        </div>
                      )}

                      {submission && (
                        <div className="mt-3 p-3 w-fit bg-green-50 rounded-lg border border-green-200">
                          <div className="text-sm">
                            <span className="text-gray-600">Nộp lúc: </span>
                            <span className="font-medium text-gray-900">
                              {new Date(submission.submittedAt).toLocaleString(
                                "vi-VN"
                              )}
                            </span>
                            {submission.grade !== null && (
                              <span className="ml-4">
                                <span className="text-gray-600">Điểm: </span>
                                <span className="font-bold text-green-600">
                                  {submission.grade}/{assignment.maxGrade}
                                </span>
                              </span>
                            )}
                          </div>
                          {submission.feedback && (
                            <p className="text-sm text-gray-600 mt-2">
                              <span className="font-medium">Nhận xét: </span>
                              {submission.feedback}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setSelectedAssignment(assignment)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center gap-2 whitespace-nowrap"
                      >
                        <FileText className="w-4 h-4" />
                        Xem chi tiết
                      </button>
                      {!submission && !overdue && (
                        <button
                          onClick={() => handleSubmitAssignment(assignment)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium flex items-center gap-2 whitespace-nowrap"
                        >
                          <Upload className="w-4 h-4" />
                          {assignment.type === "mcq" ? "Làm bài" : "Nộp bài"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedAssignment.type === "mcq"
                    ? "Làm bài: "
                    : "Nộp bài: "}
                  {selectedAssignment.title}
                </h3>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Assignment Info */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Hạn nộp:{" "}
                        {new Date(selectedAssignment.dueDate).toLocaleString(
                          "vi-VN"
                        )}
                      </span>
                    </div>
                    <div>Điểm tối đa: {selectedAssignment.maxGrade}</div>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nội dung bài làm{" "}
                    {selectedAssignment.type === "essay" && "(Bắt buộc)"}
                  </label>
                  <textarea
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập nội dung bài làm của bạn..."
                  />
                </div>

                {/* File Upload */}
                {selectedAssignment.type === "file_upload" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tệp đính kèm (Bắt buộc)
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    {submissionFiles.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        Đã chọn {submissionFiles.length} tệp
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={
                      submitting ||
                      (selectedAssignment.type === "essay" &&
                        !submissionContent.trim()) ||
                      (selectedAssignment.type === "file_upload" &&
                        submissionFiles.length === 0)
                    }
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-medium"
                  >
                    {submitting ? "Đang nộp..." : "Nộp bài"}
                  </button>
                  <button
                    onClick={() => setShowSubmitModal(false)}
                    disabled={submitting}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition font-medium"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Detail Modal */}
      {selectedLesson && (
        <LessonDetail
          lesson={selectedLesson}
          onClose={() => setSelectedLesson(null)}
        />
      )}

      {/* Assignment Detail Modal */}
      {selectedAssignment && (
        <AssignmentDetail
          assignment={selectedAssignment}
          submission={getSubmissionStatus(selectedAssignment.id)}
          onClose={() => setSelectedAssignment(null)}
          onSubmitted={() => {
            loadClassData();
            setSelectedAssignment(null);
          }}
        />
      )}
    </div>
  );
}
