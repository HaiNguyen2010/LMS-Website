"use client";

import { useState, useEffect } from "react";
import { submissionAPI, assignmentAPI } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { APP_CONFIG } from "@/constants";
import type { Submission, Class, Subject } from "@/types";
import {
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Paperclip,
  Eye,
  User,
  BookOpen,
  School,
  AlertCircle,
  Edit,
  Save,
} from "lucide-react";

export function TeacherSubmissionManagement() {
  const { user: currentUser } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [filters, setFilters] = useState({
    status: "",
    classId: "",
    subjectId: "",
    studentSearch: "",
    assignmentSearch: "",
    page: 1,
    limit: 20,
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    grade: "",
    feedback: "",
    status: "",
    gradedBy: "", // Thêm gradedBy
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    loadClassesAndSubjects();
  }, []);

  const loadClassesAndSubjects = async () => {
    try {
      // Load teacher's assignments (which includes both classes and subjects)
      const assignmentsRes = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
        }/api/v1/teacher-assignments/my-assignments`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const assignmentsData = await assignmentsRes.json();
      console.log("📦 Assignments Response:", assignmentsData);

      const myAssignments =
        assignmentsData.data?.assignments || assignmentsData.data || [];
      console.log("📋 My Assignments:", myAssignments);
      console.log("📋 Assignment count:", myAssignments.length);

      // Extract unique classes and subjects from assignments
      const classesMap = new Map();
      const subjectsMap = new Map();

      myAssignments.forEach(
        (assignment: {
          assignmentClass?: Class;
          assignmentSubject?: Subject;
        }) => {
          console.log("🔍 Processing assignment:", assignment);
          // Add class
          if (
            assignment.assignmentClass &&
            !classesMap.has(assignment.assignmentClass.id)
          ) {
            console.log("➕ Adding class:", assignment.assignmentClass);
            classesMap.set(
              assignment.assignmentClass.id,
              assignment.assignmentClass
            );
          }
          // Add subject
          if (
            assignment.assignmentSubject &&
            !subjectsMap.has(assignment.assignmentSubject.id)
          ) {
            console.log("➕ Adding subject:", assignment.assignmentSubject);
            subjectsMap.set(
              assignment.assignmentSubject.id,
              assignment.assignmentSubject
            );
          }
        }
      );

      const classes = Array.from(classesMap.values());
      const subjects = Array.from(subjectsMap.values());

      console.log("✅ Final classes:", classes);
      console.log("✅ Final subjects:", subjects);

      setClasses(classes); // Use teacher's classes for filter dropdown
      setSubjects(subjects); // Use only teacher's subjects
    } catch (err) {
      console.error("❌ Error loading classes and subjects:", err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: {
        page: number;
        limit: number;
        status?: string;
        classId?: number;
        subjectId?: number;
      } = {
        page: filters.page,
        limit: filters.limit,
      };

      if (filters.status) params.status = filters.status;
      if (filters.classId) params.classId = parseInt(filters.classId);
      if (filters.subjectId) params.subjectId = parseInt(filters.subjectId);

      console.log("🔍 Fetching submissions with params:", params);
      const response = await submissionAPI.getTeacherSubmissions(params);
      console.log("📦 Full API Response:", response);
      console.log("📦 Response.data:", response.data);

      // Response structure: { success: true, data: { submissions: [...], pagination: {...} } }
      let submissionData: Submission[] = [];

      if (response.data) {
        if (Array.isArray(response.data)) {
          // Direct array
          submissionData = response.data;
        } else if (response.data.submissions) {
          // Nested in submissions property
          submissionData = response.data.submissions;
        } else if (response.data.items) {
          // Nested in items property
          submissionData = response.data.items;
        }
      }

      console.log("📋 Parsed submissions data:", submissionData);
      if (submissionData.length > 0) {
        console.log("👤 First submission:", submissionData[0]);
        console.log(
          "👤 First submission student:",
          submissionData[0].submissionStudent || submissionData[0].student
        );
        console.log(
          "👤 First submission assignment:",
          submissionData[0].submissionAssignment || submissionData[0].assignment
        );
      }

      // Backend đã filter theo teacher rồi, không cần filter phía client nữa
      console.log("✅ Teacher submissions:", submissionData.length);

      setSubmissions(submissionData);

      // Handle pagination
      if (
        response.data &&
        typeof response.data === "object" &&
        "pagination" in response.data
      ) {
        const pag = response.data.pagination as {
          currentPage?: number;
          page?: number;
          totalPages?: number;
          totalItems?: number;
          total?: number;
        };
        setPagination({
          currentPage: pag.currentPage || pag.page || 1,
          totalPages: pag.totalPages || 1,
          totalItems: pag.totalItems || pag.total || submissionData.length,
        });
      } else {
        // If no pagination info, set defaults
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalItems: submissionData.length,
        });
      }
    } catch (err) {
      console.error("❌ Error loading submissions:", err);
      setError("Không thể tải danh sách bài nộp");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return "text-gray-600 bg-gray-50";
    switch (status) {
      case "submitted":
        return "text-blue-600 bg-blue-50";
      case "graded":
        return "text-green-600 bg-green-50";
      case "late":
        return "text-orange-600 bg-orange-50";
      case "missing":
        return "text-red-600 bg-red-50";
      case "draft":
        return "text-gray-600 bg-gray-100";
      case "returned":
        return "text-purple-600 bg-purple-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status?: string) => {
    if (!status) return <FileText size={16} />;
    switch (status) {
      case "submitted":
        return <Clock size={16} />;
      case "graded":
        return <CheckCircle size={16} />;
      case "late":
        return <AlertCircle size={16} />;
      case "missing":
        return <XCircle size={16} />;
      case "draft":
        return <FileText size={16} />;
      case "returned":
        return <CheckCircle size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const getStatusLabel = (status?: string) => {
    if (!status) return "Chưa xác định";
    switch (status) {
      case "submitted":
        return "Đã nộp";
      case "graded":
        return "Đã chấm";
      case "late":
        return "Nộp trễ";
      case "missing":
        return "Thiếu";
      case "draft":
        return "Nháp";
      case "returned":
        return "Đã trả lại";
      default:
        return status;
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filter changes
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleViewDetail = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowDetailModal(true);
  };

  const handleEdit = (submission: Submission) => {
    setSelectedSubmission(submission);
    setEditFormData({
      grade: submission.grade?.toString() || "",
      feedback: submission.feedback || "",
      status: submission.status || "submitted",
      gradedBy: submission.gradedBy?.toString() || "", // Thêm gradedBy
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedSubmission) return;

    try {
      setSaving(true);
      setError(null);

      const updateData: {
        grade?: number;
        feedback?: string;
        status?: string;
        gradedBy?: number;
      } = {};

      if (editFormData.grade) {
        updateData.grade = parseFloat(editFormData.grade);
      }
      if (editFormData.feedback) {
        updateData.feedback = editFormData.feedback;
      }
      if (editFormData.status) {
        updateData.status = editFormData.status;
      }
      // Tự động gán người chấm là user hiện tại
      if (currentUser?.id) {
        updateData.gradedBy = currentUser.id;
      }

      // Use assignmentAPI.gradeSubmission if we have grade, otherwise use submissionAPI.update
      if (updateData.grade !== undefined) {
        await assignmentAPI.gradeSubmission(
          selectedSubmission.assignmentId,
          selectedSubmission.id,
          {
            grade: updateData.grade,
            feedback: updateData.feedback || "",
            status: updateData.status as
              | "submitted"
              | "graded"
              | "late"
              | "missing"
              | "draft"
              | "returned"
              | undefined,
            gradedBy: updateData.gradedBy, // Thêm gradedBy
          }
        );
      } else {
        // For status-only updates, use FormData
        const formData = new FormData();
        if (updateData.status) {
          formData.append("status", updateData.status);
        }
        if (updateData.feedback) {
          formData.append("feedback", updateData.feedback);
        }
        await submissionAPI.update(selectedSubmission.id, formData);
      }

      // Reload data
      await loadData();

      setShowEditModal(false);
      setSelectedSubmission(null);
    } catch (err) {
      console.error("Error updating submission:", err);
      setError("Không thể cập nhật bài nộp");
    } finally {
      setSaving(false);
    }
  };

  if (loading && submissions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-600">Đang tải...</div>
      </div>
    );
  }

  // Filter submissions based on search terms (client-side filtering)
  const filteredSubmissions = submissions.filter((submission) => {
    // Student search filter
    if (filters.studentSearch) {
      const searchLower = filters.studentSearch.toLowerCase();
      const studentName = (
        submission.submissionStudent?.name ||
        submission.student?.name ||
        ""
      ).toLowerCase();
      const studentCode = (
        submission.submissionStudent?.code ||
        submission.student?.code ||
        ""
      ).toLowerCase();
      const studentEmail = (
        submission.submissionStudent?.email ||
        submission.student?.email ||
        ""
      ).toLowerCase();

      if (
        !studentName.includes(searchLower) &&
        !studentCode.includes(searchLower) &&
        !studentEmail.includes(searchLower)
      ) {
        return false;
      }
    }

    // Assignment search filter
    if (filters.assignmentSearch) {
      const searchLower = filters.assignmentSearch.toLowerCase();
      const assignmentTitle = (
        submission.submissionAssignment?.title ||
        submission.assignment?.title ||
        ""
      ).toLowerCase();

      if (!assignmentTitle.includes(searchLower)) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý Bài nộp</h2>
          <p className="text-sm text-gray-600 mt-1">
            Tổng số: {pagination.totalItems} bài nộp
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Student Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm học sinh
            </label>
            <input
              type="text"
              value={filters.studentSearch}
              onChange={(e) =>
                handleFilterChange("studentSearch", e.target.value)
              }
              placeholder="Tên, mã, email học sinh..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Assignment Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm bài tập
            </label>
            <input
              type="text"
              value={filters.assignmentSearch}
              onChange={(e) =>
                handleFilterChange("assignmentSearch", e.target.value)
              }
              placeholder="Tên bài tập..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value="submitted">Đã nộp</option>
              <option value="graded">Đã chấm</option>
              <option value="late">Nộp trễ</option>
              <option value="missing">Thiếu</option>
              <option value="draft">Nháp</option>
              <option value="returned">Đã trả lại</option>
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lớp học
            </label>
            <select
              value={filters.classId}
              onChange={(e) => handleFilterChange("classId", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả lớp</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.code ? `(${cls.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Môn học
            </label>
            <select
              value={filters.subjectId}
              onChange={(e) => handleFilterChange("subjectId", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả môn</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} {subject.code ? `(${subject.code})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Submissions List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">Không có bài nộp nào</p>
            <p className="text-sm mt-2">
              {filters.status ||
              filters.classId ||
              filters.subjectId ||
              filters.studentSearch ||
              filters.assignmentSearch
                ? "Thử thay đổi bộ lọc để xem kết quả khác"
                : "Chưa có học sinh nào nộp bài"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Học sinh
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bài tập
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lớp / Môn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Điểm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Người chấm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày nộp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {submission.submissionStudent?.name ||
                                submission.student?.name ||
                                "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {submission.submissionStudent?.code ||
                                submission.student?.code ||
                                submission.submissionStudent?.email ||
                                submission.student?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {submission.submissionAssignment?.title ||
                            submission.assignment?.title ||
                            "N/A"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {submission.submissionAssignment?.type === "essay" ||
                          submission.assignment?.type === "essay"
                            ? "Bài luận"
                            : submission.submissionAssignment?.type ===
                                "file_upload" ||
                              submission.assignment?.type === "file_upload"
                            ? "Nộp file"
                            : "Trắc nghiệm"}
                        </div>
                      </td>
                      <td className="pl-6 py-4">
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-1 text-gray-700">
                            <School size={14} />
                            <span>
                              {submission.submissionAssignment?.assignmentClass
                                ?.name ||
                                submission.assignment?.assignmentClass?.name ||
                                submission.assignment?.class?.name ||
                                "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <BookOpen size={14} />
                            <span>
                              {submission.submissionAssignment
                                ?.assignmentSubject?.name ||
                                submission.assignment?.assignmentSubject
                                  ?.name ||
                                submission.assignment?.subject?.name ||
                                "N/A"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            submission.status
                          )}`}
                        >
                          {getStatusIcon(submission.status)}
                          {getStatusLabel(submission.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {submission.grade !== null &&
                        submission.grade !== undefined ? (
                          <span className="text-sm font-semibold text-green-600">
                            {submission.grade} /{" "}
                            {submission.submissionAssignment?.maxGrade}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">
                            Chưa chấm
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {submission.submissionGrader || submission.grader ? (
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-blue-500" />
                            <div>
                              <div className="text-sm text-gray-900">
                                {submission.submissionGrader?.name ||
                                  submission.grader?.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {submission.submissionGrader?.role ===
                                  "teacher" ||
                                submission.grader?.role === "teacher"
                                  ? "Giáo viên"
                                  : submission.submissionGrader?.role ===
                                      "admin" ||
                                    submission.grader?.role === "admin"
                                  ? "Quản trị"
                                  : ""}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar size={14} />
                          <span>
                            {new Date(
                              submission.submittedAt
                            ).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(submission.submittedAt).toLocaleTimeString(
                            "vi-VN",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleViewDetail(submission)}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEdit(submission)}
                            className="text-green-600 hover:text-green-800 flex items-center gap-1 text-sm"
                          >
                            <Edit size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Trang {pagination.currentPage} / {pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Chi tiết bài nộp
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  ID: {selectedSubmission.id}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Student Info */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Thông tin học sinh
                </h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm">
                    <span className="font-medium">Tên:</span>{" "}
                    {selectedSubmission.submissionStudent?.name ||
                      selectedSubmission.student?.name}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Email:</span>{" "}
                    {selectedSubmission.submissionStudent?.email ||
                      selectedSubmission.student?.email}
                  </p>
                  {(selectedSubmission.submissionStudent?.code ||
                    selectedSubmission.student?.code) && (
                    <p className="text-sm">
                      <span className="font-medium">Mã SV:</span>{" "}
                      {selectedSubmission.submissionStudent?.code ||
                        selectedSubmission.student?.code}
                    </p>
                  )}
                </div>
              </div>

              {/* Assignment Info */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Thông tin bài tập
                </h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm">
                    <span className="font-medium">Tiêu đề:</span>{" "}
                    {selectedSubmission.submissionAssignment?.title ||
                      selectedSubmission.assignment?.title}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Lớp:</span>{" "}
                    {selectedSubmission.submissionAssignment?.assignmentClass
                      ?.name ||
                      selectedSubmission.assignment?.assignmentClass?.name ||
                      selectedSubmission.assignment?.class?.name}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Môn:</span>{" "}
                    {selectedSubmission.submissionAssignment?.assignmentSubject
                      ?.name ||
                      selectedSubmission.assignment?.assignmentSubject?.name ||
                      selectedSubmission.assignment?.subject?.name}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Điểm tối đa:</span>{" "}
                    {selectedSubmission.submissionAssignment?.maxGrade ||
                      selectedSubmission.assignment?.maxGrade}
                  </p>
                </div>
              </div>

              {/* Submission Info */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Thông tin nộp bài
                </h4>
                <div className="bg-gray-50 p-3 rounded space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Trạng thái:</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        selectedSubmission.status
                      )}`}
                    >
                      {getStatusIcon(selectedSubmission.status)}
                      {getStatusLabel(selectedSubmission.status)}
                    </span>
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">Ngày nộp:</span>{" "}
                    {new Date(selectedSubmission.submittedAt).toLocaleString(
                      "vi-VN"
                    )}
                  </p>
                  {selectedSubmission.isLate && (
                    <p className="text-sm text-orange-600">
                      <AlertCircle size={14} className="inline mr-1" />
                      Nộp trễ hạn
                    </p>
                  )}
                </div>
              </div>

              {/* Content */}
              {selectedSubmission.content && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Nội dung bài làm
                  </h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedSubmission.content}
                    </p>
                  </div>
                </div>
              )}

              {/* File Attachments */}
              {selectedSubmission.attachments &&
                selectedSubmission.attachments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Paperclip size={16} />
                      File đính kèm ({selectedSubmission.attachments.length})
                    </h4>
                    <div className="bg-gray-50 p-3 rounded space-y-2">
                      {selectedSubmission.attachments.map(
                        (
                          attachment: {
                            id: number;
                            fileName: string;
                            fileUrl: string;
                            fileSize?: number;
                            fileType?: string;
                            mimeType?: string;
                          },
                          index: number
                        ) => {
                          // Get file icon based on file extension
                          const getFileIcon = (fileName: string) => {
                            const extension = fileName
                              .split(".")
                              .pop()
                              ?.toLowerCase();
                            switch (extension) {
                              case "pdf":
                                return "📄";
                              case "doc":
                              case "docx":
                                return "📝";
                              case "xls":
                              case "xlsx":
                                return "📊";
                              case "ppt":
                              case "pptx":
                                return "📽️";
                              case "jpg":
                              case "jpeg":
                              case "png":
                              case "gif":
                                return "🖼️";
                              case "zip":
                              case "rar":
                                return "🗜️";
                              default:
                                return "📎";
                            }
                          };

                          // Format file size
                          const formatFileSize = (bytes?: number) => {
                            if (!bytes) return "";
                            if (bytes < 1024) return `${bytes} B`;
                            if (bytes < 1024 * 1024)
                              return `${(bytes / 1024).toFixed(1)} KB`;
                            return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                          };

                          // Build full file URL
                          const getFullFileUrl = (fileUrl: string) => {
                            if (fileUrl.startsWith("http")) {
                              return fileUrl;
                            }
                            return `${APP_CONFIG.API_BASE_URL}${fileUrl}`;
                          };

                          return (
                            <a
                              key={attachment.id || index}
                              href={getFullFileUrl(attachment.fileUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className="text-2xl flex-shrink-0">
                                  {getFileIcon(attachment.fileName)}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {attachment.fileName}
                                  </p>
                                  {attachment.fileSize && (
                                    <p className="text-xs text-gray-500">
                                      {formatFileSize(attachment.fileSize)}
                                      {attachment.fileType &&
                                        ` • ${attachment.fileType.toUpperCase()}`}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-blue-600 flex-shrink-0 ml-2">
                                <Eye size={16} />
                              </div>
                            </a>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

              {/* Grade and Feedback */}
              {selectedSubmission.grade !== null &&
                selectedSubmission.grade !== undefined && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Chấm điểm
                    </h4>
                    <div className="bg-green-50 p-3 rounded space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">Điểm:</span>{" "}
                        <span className="text-lg font-bold text-green-600">
                          {selectedSubmission.grade} /{" "}
                          {selectedSubmission.submissionAssignment?.maxGrade}
                        </span>
                      </p>
                      {selectedSubmission.gradedAt && (
                        <p className="text-sm">
                          <span className="font-medium">Ngày chấm:</span>{" "}
                          {new Date(selectedSubmission.gradedAt).toLocaleString(
                            "vi-VN"
                          )}
                        </p>
                      )}
                      {/* Grader Info */}
                      {(selectedSubmission.submissionGrader ||
                        selectedSubmission.grader) && (
                        <div className="pt-2 border-t border-green-200">
                          <p className="text-sm flex items-center gap-2">
                            <User size={14} className="text-green-600" />
                            <span className="font-medium">
                              Người chấm:
                            </span>{" "}
                            {selectedSubmission.submissionGrader?.name ||
                              selectedSubmission.grader?.name}
                          </p>
                          {(selectedSubmission.submissionGrader?.email ||
                            selectedSubmission.grader?.email) && (
                            <p className="text-sm text-gray-600 ml-6">
                              {selectedSubmission.submissionGrader?.email ||
                                selectedSubmission.grader?.email}
                            </p>
                          )}
                        </div>
                      )}
                      {selectedSubmission.feedback && (
                        <div>
                          <span className="text-sm font-medium">Nhận xét:</span>
                          <p className="text-sm mt-1 whitespace-pre-wrap">
                            {selectedSubmission.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Chỉnh sửa bài nộp
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedSubmission.submissionStudent?.name ||
                    selectedSubmission.student?.name}{" "}
                  -{" "}
                  {selectedSubmission.submissionAssignment?.title ||
                    selectedSubmission.assignment?.title}
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Grade Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Điểm (Max:{" "}
                  {selectedSubmission.submissionAssignment?.maxGrade ||
                    selectedSubmission.assignment?.maxGrade}
                  )
                </label>
                <input
                  type="number"
                  min="0"
                  max={
                    selectedSubmission.submissionAssignment?.maxGrade ||
                    selectedSubmission.assignment?.maxGrade ||
                    100
                  }
                  step="0.5"
                  value={editFormData.grade}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, grade: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập điểm"
                />
              </div>

              {/* Feedback Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhận xét
                </label>
                <textarea
                  value={editFormData.feedback}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      feedback: e.target.value,
                    })
                  }
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập nhận xét cho học sinh..."
                />
              </div>

              {/* Status Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, status: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Nháp</option>
                  <option value="submitted">Đã nộp</option>
                  <option value="graded">Đã chấm</option>
                  <option value="late">Nộp trễ</option>
                  <option value="missing">Thiếu</option>
                  <option value="returned">Đã trả lại</option>
                </select>
              </div>

              {/* Graded By Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Người chấm
                </label>
                <input
                  type="text"
                  value={currentUser?.name || currentUser?.email || ""}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Bài chấm sẽ được gán cho bạn
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={saving}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save size={16} />
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
