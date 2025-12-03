"use client";

import { useEffect, useState } from "react";
import {
  teacherAssignmentAPI,
  userAPI,
  classAPI,
  subjectAPI,
} from "@/lib/apiClient";
import type { TeacherAssignment, User, Class, Subject } from "@/types";
import {
  Edit,
  Trash2,
  X,
  UserCheck,
  School,
  BookOpen,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface TeacherAssignmentBackendResponse {
  id: number;
  teacherId: number;
  classId: number;
  subjectId: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  teacher?: User;
  assignmentClass?: Class;
  assignmentSubject?: Subject;
  class?: Class;
  subject?: Subject;
  createdAt: string;
  updatedAt: string;
}

export function TeacherAssignmentManagement() {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingAssignment, setEditingAssignment] =
    useState<TeacherAssignment | null>(null);
  const [deletingAssignment, setDeleteingAssignment] =
    useState<TeacherAssignment | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    teacherId: "",
    classId: "",
    subjectId: "",
    startDate: "",
    endDate: "",
    isActive: true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Autocomplete states
  const [teacherSearchTerm, setTeacherSearchTerm] = useState("");
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load assignments
      const assignmentsResponse = await teacherAssignmentAPI.getAll({
        page: 1,
        limit: 100,
      });
      const assignmentsData =
        assignmentsResponse.data?.assignments ||
        assignmentsResponse.data?.items ||
        [];

      // Map backend response to frontend types
      const mappedAssignments: TeacherAssignment[] = assignmentsData.map(
        (assignment: TeacherAssignmentBackendResponse) => ({
          ...assignment,
          class: assignment.assignmentClass || assignment.class,
          subject: assignment.assignmentSubject || assignment.subject,
        })
      );

      setAssignments(mappedAssignments);

      // Load teachers (users with role teacher)
      const usersResponse = await userAPI.getAll({ page: 1, limit: 100 });
      const allUsers =
        usersResponse.data?.users || usersResponse.data?.items || [];
      const teacherUsers = allUsers.filter(
        (user: User) => user.role === "teacher"
      );
      setTeachers(teacherUsers);

      // Load classes
      const classesResponse = await classAPI.getAll({ page: 1, limit: 100 });
      const classesData =
        classesResponse.data?.classes || classesResponse.data?.items || [];
      setClasses(classesData);

      // Load subjects
      const subjectsResponse = await subjectAPI.getAll({ page: 1, limit: 100 });
      const subjectsData =
        subjectsResponse.data?.subjects || subjectsResponse.data?.items || [];
      setSubjects(subjectsData);
    } catch (err) {
      setError("Không thể tải dữ liệu");
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      teacherId: "",
      classId: "",
      subjectId: "",
      startDate: "",
      endDate: "",
      isActive: true,
    });
    setFormErrors({});
    setTeacherSearchTerm("");
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Chỉ validate khi tạo mới (không phải edit)
    if (!editingAssignment) {
      if (!formData.teacherId) errors.teacherId = "Vui lòng chọn giáo viên";
      if (!formData.classId) errors.classId = "Vui lòng chọn lớp";
      if (!formData.subjectId) errors.subjectId = "Vui lòng chọn môn học";
    }

    // Validate dates
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (endDate <= startDate) {
        errors.endDate = "Ngày kết thúc phải sau ngày bắt đầu";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddClick = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditClick = (assignment: TeacherAssignment) => {
    setEditingAssignment(assignment);
    setFormData({
      teacherId: assignment.teacherId.toString(),
      classId: assignment.classId.toString(),
      subjectId: assignment.subjectId.toString(),
      startDate: assignment.startDate ? assignment.startDate.split("T")[0] : "",
      endDate: assignment.endDate ? assignment.endDate.split("T")[0] : "",
      isActive: assignment.isActive,
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleDeleteClick = (assignment: TeacherAssignment) => {
    setDeleteingAssignment(assignment);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitLoading(true);
    try {
      if (editingAssignment) {
        // Khi edit chỉ gửi startDate, endDate và isActive
        const submitData = {
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
          isActive: formData.isActive,
        };
        await teacherAssignmentAPI.update(editingAssignment.id, submitData);
      } else {
        // Khi tạo mới gửi đầy đủ
        const submitData = {
          teacherId: parseInt(formData.teacherId),
          classId: parseInt(formData.classId),
          subjectId: parseInt(formData.subjectId),
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
          isActive: formData.isActive,
        };
        await teacherAssignmentAPI.create(submitData);
      }

      await loadData();
      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setFormErrors({ submit: error.message || "Có lỗi xảy ra" });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAssignment) return;

    setSubmitLoading(true);
    try {
      await teacherAssignmentAPI.delete(deletingAssignment.id);
      await loadData();
      setShowDeleteModal(false);
      setDeleteingAssignment(null);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setFormErrors({ submit: error.message || "Có lỗi xảy ra khi xóa" });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Filter and handler functions for teacher autocomplete
  const filteredTeachers = teachers.filter((teacher) => {
    const searchLower = teacherSearchTerm.toLowerCase();
    return (
      teacher.name.toLowerCase().includes(searchLower) ||
      teacher.email.toLowerCase().includes(searchLower) ||
      teacher.code?.toLowerCase().includes(searchLower)
    );
  });

  const handleTeacherSelect = (teacher: User) => {
    setFormData({ ...formData, teacherId: teacher.id.toString() });
    setTeacherSearchTerm(`${teacher.name} (${teacher.email})`);
    setShowTeacherDropdown(false);
  };

  const handleTeacherInputChange = (value: string) => {
    setTeacherSearchTerm(value);
    setShowTeacherDropdown(true);
    if (!value) {
      setFormData({ ...formData, teacherId: "" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-600">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={loadData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Phân công giảng dạy{" "}
          {assignments.length > 0 && `(${assignments.length})`}
        </h2>
        <button
          onClick={handleAddClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2"
        >
          <UserCheck size={20} />
          <span>Thêm phân công</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Giáo viên
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lớp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mã lớp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Môn học
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thời gian
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assignments.map((assignment) => (
              <tr key={assignment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <UserCheck size={16} className="text-blue-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {assignment.teacher?.name ||
                          `ID ${assignment.teacherId}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {assignment.teacher?.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <School size={16} className="text-purple-600" />
                    <span className="text-sm text-gray-900">
                      {assignment.class?.name || `ID ${assignment.classId}`}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600 font-mono">
                    {assignment.class?.code || "N/A"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-green-600" />
                    <span className="text-sm text-gray-900">
                      {assignment.subject?.name || `ID ${assignment.subjectId}`}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {assignment.startDate && assignment.endDate ? (
                      <>
                        <div>
                          Bắt đầu:{" "}
                          {new Date(assignment.startDate).toLocaleDateString(
                            "vi-VN"
                          )}
                        </div>
                        <div>
                          Kết thúc:{" "}
                          {new Date(assignment.endDate).toLocaleDateString(
                            "vi-VN"
                          )}
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-400">Chưa xác định</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {assignment.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                      <CheckCircle size={14} />
                      Hoạt động
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded">
                      <XCircle size={14} />
                      Không hoạt động
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEditClick(assignment)}
                    className="text-blue-600 hover:text-blue-900 mr-3 inline-flex items-center gap-1"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(assignment)}
                    className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {assignments.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Chưa có phân công giảng dạy nào
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Thêm phân công giảng dạy
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giáo viên <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={teacherSearchTerm}
                    onChange={(e) => handleTeacherInputChange(e.target.value)}
                    onFocus={() => setShowTeacherDropdown(true)}
                    onBlur={() => {
                      setTimeout(() => setShowTeacherDropdown(false), 200);
                    }}
                    placeholder="Gõ tên, mã hoặc email giáo viên..."
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.teacherId
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {showTeacherDropdown && filteredTeachers.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredTeachers.slice(0, 50).map((teacher) => (
                        <div
                          key={teacher.id}
                          onClick={() => handleTeacherSelect(teacher)}
                          className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                            formData.teacherId === teacher.id.toString()
                              ? "bg-blue-100"
                              : ""
                          }`}
                        >
                          <div className="font-medium text-gray-900">
                            {teacher.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {teacher.code && `${teacher.code} • `}
                            {teacher.email}
                          </div>
                        </div>
                      ))}
                      {filteredTeachers.length > 50 && (
                        <div className="px-3 py-2 text-sm text-gray-500 italic">
                          Còn {filteredTeachers.length - 50} giáo viên khác...
                        </div>
                      )}
                    </div>
                  )}
                  {showTeacherDropdown &&
                    teacherSearchTerm &&
                    filteredTeachers.length === 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                        <div className="px-3 py-2 text-sm text-gray-500">
                          Không tìm thấy giáo viên nào
                        </div>
                      </div>
                    )}
                </div>
                {formErrors.teacherId && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.teacherId}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lớp <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.classId}
                  onChange={(e) =>
                    setFormData({ ...formData, classId: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.classId ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">-- Chọn lớp --</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} - {cls.code}
                    </option>
                  ))}
                </select>
                {formErrors.classId && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.classId}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Môn học <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.subjectId}
                  onChange={(e) =>
                    setFormData({ ...formData, subjectId: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.subjectId ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">-- Chọn môn học --</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
                {formErrors.subjectId && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.subjectId}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.endDate ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {formErrors.endDate && (
                    <p className="mt-1 text-sm text-red-500">
                      {formErrors.endDate}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isActive"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Hoạt động
                </label>
              </div>

              {formErrors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{formErrors.submit}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {submitLoading ? "Đang thêm..." : "Thêm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Sửa phân công giảng dạy
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giáo viên
                </label>
                <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
                  {editingAssignment.teacher?.name ||
                    `ID ${editingAssignment.teacherId}`}
                  {editingAssignment.teacher?.email && (
                    <span className="ml-2 text-gray-500">
                      ({editingAssignment.teacher.email})
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lớp
                </label>
                <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
                  {editingAssignment.class?.name ||
                    `ID ${editingAssignment.classId}`}
                  {editingAssignment.class?.code && (
                    <span className="ml-2 text-gray-500">
                      - {editingAssignment.class.code}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Môn học
                </label>
                <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
                  {editingAssignment.subject?.name ||
                    `ID ${editingAssignment.subjectId}`}
                  {editingAssignment.subject?.code && (
                    <span className="ml-2 text-gray-500">
                      ({editingAssignment.subject.code})
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.endDate ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {formErrors.endDate && (
                    <p className="mt-1 text-sm text-red-500">
                      {formErrors.endDate}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActiveEdit"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isActiveEdit"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Hoạt động
                </label>
              </div>

              {formErrors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{formErrors.submit}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {submitLoading ? "Đang cập nhật..." : "Cập nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-red-600">Xác nhận xóa</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Bạn có chắc chắn muốn xóa phân công này?
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <p>
                  <strong>Giáo viên:</strong>{" "}
                  {deletingAssignment.teacher?.name ||
                    `ID ${deletingAssignment.teacherId}`}
                </p>
                <p>
                  <strong>Lớp:</strong>{" "}
                  {deletingAssignment.class?.name ||
                    `ID ${deletingAssignment.classId}`}
                </p>
                <p>
                  <strong>Môn học:</strong>{" "}
                  {deletingAssignment.subject?.name ||
                    `ID ${deletingAssignment.subjectId}`}
                </p>

                {(deletingAssignment.startDate ||
                  deletingAssignment.endDate) && (
                  <p>
                    <strong>Thời gian:</strong>{" "}
                    {deletingAssignment.startDate && deletingAssignment.endDate
                      ? `${new Date(
                          deletingAssignment.startDate
                        ).toLocaleDateString("vi-VN")} - ${new Date(
                          deletingAssignment.endDate
                        ).toLocaleDateString("vi-VN")}`
                      : deletingAssignment.startDate
                      ? `Từ ${new Date(
                          deletingAssignment.startDate
                        ).toLocaleDateString("vi-VN")}`
                      : deletingAssignment.endDate
                      ? `Đến ${new Date(
                          deletingAssignment.endDate
                        ).toLocaleDateString("vi-VN")}`
                      : "Chưa xác định"}
                  </p>
                )}
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Lưu ý:</strong> Xóa phân công này có thể ảnh hưởng
                  đến các bài học, bài tập và điểm số liên quan.
                </p>
              </div>
            </div>

            {formErrors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-600">{formErrors.submit}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={submitLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                {submitLoading ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
