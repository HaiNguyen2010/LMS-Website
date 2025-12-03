"use client";

import { useEffect, useState } from "react";
import { studentEnrollmentAPI, userAPI, classAPI } from "@/lib/apiClient";
import type { StudentEnrollment, User, Class } from "@/types";
import {
  Edit,
  Trash2,
  X,
  Users,
  School,
  Calendar,
  CheckCircle,
  XCircle,
  UserPlus,
} from "lucide-react";

interface StudentEnrollmentBackendResponse {
  id: number;
  studentId: number;
  classId: number;
  enrolledAt: string;
  status: string;
  student?: User;
  enrollmentClass?: Class;
  class?: Class;
  createdAt: string;
  updatedAt: string;
}

export function StudentEnrollmentManagement() {
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingEnrollment, setEditingEnrollment] =
    useState<StudentEnrollment | null>(null);
  const [deletingEnrollment, setDeletingEnrollment] =
    useState<StudentEnrollment | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    studentId: "",
    classId: "",
    enrollmentDate: new Date().toISOString().split("T")[0],
    isActive: true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Autocomplete states for student input
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>("");
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load enrollments
      const enrollmentsResponse = await studentEnrollmentAPI.getAll({
        page: 1,
        limit: 100,
      });
      console.log("Enrollments API Response:", enrollmentsResponse);

      const enrollmentsData =
        enrollmentsResponse.data?.enrollments ||
        enrollmentsResponse.data?.items ||
        [];
      console.log("Enrollments Data:", enrollmentsData);

      // Map backend response to frontend types
      const mappedEnrollments: StudentEnrollment[] = (
        enrollmentsData as unknown as StudentEnrollmentBackendResponse[]
      ).map((enrollment: StudentEnrollmentBackendResponse) => ({
        id: enrollment.id,
        studentId: enrollment.studentId,
        classId: enrollment.classId,
        enrollmentDate: enrollment.enrolledAt,
        isActive: enrollment.status === "active",
        student: enrollment.student,
        class: enrollment.enrollmentClass || enrollment.class,
        createdAt: enrollment.createdAt,
        updatedAt: enrollment.updatedAt,
      }));

      setEnrollments(mappedEnrollments);

      // Load students (users with role student)
      const usersResponse = await userAPI.getAll({ page: 1, limit: 100 });
      const allUsers =
        usersResponse.data?.users || usersResponse.data?.items || [];
      const studentUsers = allUsers.filter(
        (user: User) => user.role === "student"
      );
      setStudents(studentUsers);

      // Load classes
      const classesResponse = await classAPI.getAll({ page: 1, limit: 100 });
      const classesData =
        classesResponse.data?.classes || classesResponse.data?.items || [];
      setClasses(classesData);
    } catch (err) {
      setError("Không thể tải dữ liệu");
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      studentId: "",
      classId: "",
      enrollmentDate: new Date().toISOString().split("T")[0],
      isActive: true,
    });
    setFormErrors({});
    setStudentSearchTerm("");
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Chỉ validate studentId và classId khi tạo mới (không phải edit)
    if (!editingEnrollment) {
      if (!formData.studentId) errors.studentId = "Vui lòng chọn học sinh";
      if (!formData.classId) errors.classId = "Vui lòng chọn lớp";
    }

    if (!formData.enrollmentDate) {
      errors.enrollmentDate = "Vui lòng chọn ngày đăng ký";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddClick = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditClick = (enrollment: StudentEnrollment) => {
    setEditingEnrollment(enrollment);
    setFormData({
      studentId: enrollment.studentId.toString(),
      classId: enrollment.classId.toString(),
      enrollmentDate: enrollment.enrollmentDate.split("T")[0],
      isActive: enrollment.isActive,
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleDeleteClick = (enrollment: StudentEnrollment) => {
    setDeletingEnrollment(enrollment);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitLoading(true);
    try {
      if (editingEnrollment) {
        // Khi edit chỉ gửi enrollmentDate và isActive
        const submitData = {
          enrollmentDate: formData.enrollmentDate,
          isActive: formData.isActive,
        };
        await studentEnrollmentAPI.update(editingEnrollment.id, submitData);
      } else {
        // Khi tạo mới gửi đầy đủ
        const submitData = {
          studentId: parseInt(formData.studentId),
          classId: parseInt(formData.classId),
          enrollmentDate: formData.enrollmentDate,
          isActive: formData.isActive,
        };
        await studentEnrollmentAPI.create(submitData);
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
    if (!deletingEnrollment) return;

    setSubmitLoading(true);
    try {
      await studentEnrollmentAPI.delete(deletingEnrollment.id);
      await loadData();
      setShowDeleteModal(false);
      setDeletingEnrollment(null);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setFormErrors({ submit: error.message || "Có lỗi xảy ra khi xóa" });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Filter students based on search term
  const filteredStudents = students.filter((student) => {
    const searchLower = studentSearchTerm.toLowerCase();
    return (
      student.name?.toLowerCase().includes(searchLower) ||
      student.code?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower)
    );
  });

  const handleStudentSelect = (student: User) => {
    setFormData({ ...formData, studentId: String(student.id) });
    setStudentSearchTerm(`${student.name}`);
    setShowStudentDropdown(false);
  };

  const handleStudentInputChange = (value: string) => {
    setStudentSearchTerm(value);
    setShowStudentDropdown(true);

    // If input is cleared, clear the selected student
    if (!value) {
      setFormData({ ...formData, studentId: "" });
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
          Đăng ký học sinh {enrollments.length > 0 && `(${enrollments.length})`}
        </h2>
        <button
          onClick={handleAddClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2"
        >
          <UserPlus size={20} />
          <span>Thêm đăng ký</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Học sinh
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mã số SV
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lớp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mã lớp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày đăng ký
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
            {enrollments.map((enrollment) => (
              <tr key={enrollment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-blue-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {enrollment.student?.name ||
                          `ID ${enrollment.studentId}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {enrollment.student?.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600 font-mono">
                    {enrollment.student?.code || "N/A"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <School size={16} className="text-purple-600" />
                    <div>
                      <div className="text-sm text-gray-900">
                        {enrollment.class?.name || `ID ${enrollment.classId}`}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600 font-mono">
                    {enrollment.class?.code || "N/A"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-orange-600" />
                    <span className="text-sm text-gray-900">
                      {new Date(enrollment.enrollmentDate).toLocaleDateString(
                        "vi-VN"
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {enrollment.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                      <CheckCircle size={14} />
                      Đang học
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded">
                      <XCircle size={14} />
                      Đã nghỉ
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEditClick(enrollment)}
                    className="text-blue-600 hover:text-blue-900 mr-3 inline-flex items-center gap-1"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(enrollment)}
                    className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {enrollments.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Chưa có đăng ký học sinh nào
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Thêm đăng ký học sinh
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Học sinh <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={studentSearchTerm}
                  onChange={(e) => handleStudentInputChange(e.target.value)}
                  onFocus={() => setShowStudentDropdown(true)}
                  onBlur={() => {
                    // Delay to allow click on dropdown
                    setTimeout(() => setShowStudentDropdown(false), 200);
                  }}
                  placeholder="Gõ tên, mã hoặc email học sinh..."
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.studentId ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {formErrors.studentId && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.studentId}
                  </p>
                )}

                {/* Dropdown list */}
                {showStudentDropdown && filteredStudents.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredStudents.slice(0, 50).map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => handleStudentSelect(student)}
                        className={`w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 ${
                          formData.studentId === String(student.id)
                            ? "bg-blue-100"
                            : ""
                        }`}
                      >
                        <div className="font-medium text-gray-900">
                          {student.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Mã: {student.code} • {student.email}
                        </div>
                      </button>
                    ))}
                    {filteredStudents.length > 50 && (
                      <div className="px-3 py-2 text-sm text-gray-500 bg-gray-50">
                        Hiển thị 50/{filteredStudents.length} kết quả. Gõ thêm
                        để lọc...
                      </div>
                    )}
                  </div>
                )}

                {/* Show message when no results */}
                {showStudentDropdown &&
                  studentSearchTerm &&
                  filteredStudents.length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-sm text-gray-500">
                      Không tìm thấy học sinh phù hợp
                    </div>
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
                  Ngày đăng ký <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.enrollmentDate}
                  onChange={(e) =>
                    setFormData({ ...formData, enrollmentDate: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.enrollmentDate
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {formErrors.enrollmentDate && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.enrollmentDate}
                  </p>
                )}
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
                  Đang học
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
      {showEditModal && editingEnrollment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Sửa đăng ký học sinh
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
                  Học sinh
                </label>
                <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
                  {editingEnrollment.student?.name ||
                    `ID ${editingEnrollment.studentId}`}
                  {editingEnrollment.student?.code && (
                    <span className="ml-1 text-gray-500">
                      ({editingEnrollment.student.code})
                    </span>
                  )}
                  {editingEnrollment.student?.email && (
                    <span className="ml-2 text-gray-500">
                      - {editingEnrollment.student.email}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lớp
                </label>
                <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
                  {editingEnrollment.class?.name ||
                    `ID ${editingEnrollment.classId}`}
                  {editingEnrollment.class?.code && (
                    <span className="ml-2 text-gray-500">
                      - {editingEnrollment.class.code}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày đăng ký <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.enrollmentDate}
                  onChange={(e) =>
                    setFormData({ ...formData, enrollmentDate: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.enrollmentDate
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {formErrors.enrollmentDate && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.enrollmentDate}
                  </p>
                )}
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
                  Đang học
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
      {showDeleteModal && deletingEnrollment && (
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
                Bạn có chắc chắn muốn xóa đăng ký này?
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <p>
                  <strong>Học sinh:</strong>{" "}
                  {deletingEnrollment.student?.name ||
                    `ID ${deletingEnrollment.studentId}`}
                </p>
                <p>
                  <strong>Lớp:</strong>{" "}
                  {deletingEnrollment.class?.name ||
                    `ID ${deletingEnrollment.classId}`}
                </p>
                <p>
                  <strong>Ngày đăng ký:</strong>{" "}
                  {new Date(
                    deletingEnrollment.enrollmentDate
                  ).toLocaleDateString("vi-VN")}
                </p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Lưu ý:</strong> Xóa đăng ký này có thể ảnh hưởng
                  đến các bài nộp và điểm số của học sinh trong lớp này.
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
