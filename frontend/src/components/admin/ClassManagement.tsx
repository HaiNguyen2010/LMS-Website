"use client";

import { useEffect, useState } from "react";
import {
  classAPI,
  studentEnrollmentAPI,
  teacherAssignmentAPI,
} from "@/lib/apiClient";
import type { Class, StudentEnrollment, TeacherAssignment } from "@/types";
import {
  Eye,
  Edit,
  Trash2,
  X,
  School,
  Users,
  GraduationCap,
} from "lucide-react";

interface ClassFormData {
  name: string;
  code: string;
  description?: string;
  maxStudents?: number;
}

export function ClassManagement() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [showTeachersModal, setShowTeachersModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [deletingClass, setDeletingClass] = useState<Class | null>(null);
  const [viewingClass, setViewingClass] = useState<Class | null>(null);
  const [selectedClassForStudents, setSelectedClassForStudents] =
    useState<Class | null>(null);
  const [selectedClassForTeachers, setSelectedClassForTeachers] =
    useState<Class | null>(null);
  const [students, setStudents] = useState<StudentEnrollment[]>([]);
  const [teachers, setTeachers] = useState<TeacherAssignment[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [formData, setFormData] = useState<ClassFormData>({
    name: "",
    code: "",
    description: "",
    maxStudents: 0,
  });

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await classAPI.getAll({ page: 1, limit: 50 });
      setClasses(response.data?.classes || response.data?.items || []);
    } catch (err) {
      setError("Không thể tải danh sách lớp học");
      console.error("Error loading classes:", err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      maxStudents: 0,
    });
    setEditingClass(null);
    setShowModal(true);
  };

  const openEditModal = (cls: Class) => {
    setFormData({
      name: cls.name,
      code: cls.code,
      description: cls.description || "",
      maxStudents: cls.maxStudents || 0,
    });
    setEditingClass(cls);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingClass(null);
    setFormData({
      name: "",
      code: "",
      description: "",
      maxStudents: 0,
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "maxStudents" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingClass) {
        await classAPI.update(editingClass.id, formData);
        alert("Cập nhật lớp học thành công!");
      } else {
        await classAPI.create(formData);
        alert("Thêm lớp học thành công!");
      }

      closeModal();
      await loadClasses();
    } catch (err) {
      console.error("Error saving class:", err);
      alert(editingClass ? "Lỗi khi cập nhật lớp học" : "Lỗi khi thêm lớp học");
    }
  };

  const openDeleteModal = (cls: Class) => {
    setDeletingClass(cls);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingClass(null);
  };

  const handleDelete = async () => {
    if (!deletingClass) return;
    try {
      await classAPI.delete(deletingClass.id);
      await loadClasses();
      closeDeleteModal();
    } catch (err) {
      setError("Không thể xóa lớp học");
      console.error("Error deleting class:", err);
    }
  };

  const openDetailModal = (cls: Class) => {
    setViewingClass(cls);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setViewingClass(null);
  };

  const openStudentsModal = async (cls: Class) => {
    setSelectedClassForStudents(cls);
    setShowStudentsModal(true);
    setLoadingStudents(true);
    try {
      const response = await studentEnrollmentAPI.getByClassId(cls.id);
      setStudents(response.data || []);
    } catch (err) {
      console.error("Error loading students:", err);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const closeStudentsModal = () => {
    setShowStudentsModal(false);
    setSelectedClassForStudents(null);
    setStudents([]);
  };

  const openTeachersModal = async (cls: Class) => {
    setSelectedClassForTeachers(cls);
    setShowTeachersModal(true);
    setLoadingTeachers(true);
    try {
      const response = await teacherAssignmentAPI.getByClassId(cls.id);
      setTeachers(response.data || []);
    } catch (err) {
      console.error("Error loading teachers:", err);
      setTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const closeTeachersModal = () => {
    setShowTeachersModal(false);
    setSelectedClassForTeachers(null);
    setTeachers([]);
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
          onClick={loadClasses}
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
          Quản lý lớp học {classes.length > 0 && `(${classes.length})`}
        </h2>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + Thêm lớp học
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => (
          <div
            key={cls.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{cls.name}</h3>
                <p className="text-sm text-gray-500">{cls.code}</p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                ID: {cls.id}
              </span>
            </div>

            {cls.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {cls.description}
              </p>
            )}

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>
                👥 Sĩ số tối đa: {cls.maxStudents || "Không giới hạn"}
              </span>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => openDetailModal(cls)}
                className="px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition inline-flex items-center justify-center gap-2"
                title="Xem chi tiết"
              >
                <Eye size={16} />
              </button>
              <button
                onClick={() => {
                  // TODO: Xem danh sách sinh viên
                  openStudentsModal(cls);
                }}
                className="px-3 py-2 bg-green-50 text-green-600 rounded hover:bg-green-100 transition inline-flex items-center justify-center gap-2"
                title="Danh sách sinh viên"
              >
                <Users size={16} />
              </button>
              <button
                onClick={() => {
                  // TODO: Xem danh sách giảng viên
                  openTeachersModal(cls);
                }}
                className="px-3 py-2 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition inline-flex items-center justify-center gap-2"
                title="Danh sách giảng viên"
              >
                <GraduationCap size={16} />
              </button>
              <button
                onClick={() => openEditModal(cls)}
                className="px-3 py-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition inline-flex items-center justify-center gap-2"
                title="Chỉnh sửa"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => openDeleteModal(cls)}
                className="px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition inline-flex items-center justify-center"
                title="Xóa"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {classes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Không có lớp học nào
        </div>
      )}

      {/* Modal for Add/Edit Class */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">
                {editingClass ? "Sửa lớp học" : "Thêm lớp học mới"}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên lớp học <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="VD: 10A1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã lớp học <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  placeholder="VD: INT101, ELT102"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sĩ số tối đa
                </label>
                <input
                  type="number"
                  name="maxStudents"
                  value={formData.maxStudents}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="VD: 40"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Nhập mô tả lớp học"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingClass ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Delete Confirmation */}
      {showDeleteModal && deletingClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <Trash2 size={24} className="text-red-600" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Xác nhận xóa lớp học
              </h3>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800 mb-2">
                  ⚠️ <strong>Cảnh báo:</strong> Hành động này không thể hoàn
                  tác!
                </p>
                <p className="text-sm text-yellow-700">
                  Xóa lớp học sẽ ảnh hưởng đến:
                </p>
                <ul className="list-disc list-inside text-sm text-yellow-700 mt-2 space-y-1">
                  <li>Phân công giảng dạy</li>
                  <li>Danh sách học sinh</li>
                  <li>Bài giảng</li>
                  <li>Bài tập và điểm số</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-600">Bạn đang xóa:</p>
                <p className="font-semibold text-gray-900 mt-1">
                  {deletingClass.name}
                </p>
                <p className="text-sm text-gray-500">
                  Mã lớp: {deletingClass.code}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Xóa lớp học
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chi tiết lớp học */}
      {showDetailModal && viewingClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <School className="text-blue-600" size={28} />
                Chi tiết lớp học
              </h3>
              <button
                onClick={closeDetailModal}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Thông tin cơ bản */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  Thông tin cơ bản
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Tên lớp học
                    </label>
                    <p className="text-gray-900 font-medium">
                      {viewingClass.name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Mã lớp
                    </label>
                    <p className="text-gray-900 font-medium">
                      {viewingClass.code}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Sĩ số tối đa
                    </label>
                    <p className="text-gray-900 font-medium">
                      {viewingClass.maxStudents || "Không giới hạn"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      ID lớp học
                    </label>
                    <p className="text-gray-900 font-medium">
                      #{viewingClass.id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mô tả */}
              {viewingClass.description && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">
                    Mô tả lớp học
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    {viewingClass.description}
                  </p>
                </div>
              )}

              {/* Thông tin hệ thống */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  Thông tin hệ thống
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Ngày tạo
                    </label>
                    <p className="text-gray-900">
                      {new Date(viewingClass.createdAt).toLocaleDateString(
                        "vi-VN",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Cập nhật lần cuối
                    </label>
                    <p className="text-gray-900">
                      {new Date(viewingClass.updatedAt).toLocaleDateString(
                        "vi-VN",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeDetailModal}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  closeDetailModal();
                  openEditModal(viewingClass);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium inline-flex items-center gap-2"
              >
                <Edit size={18} />
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Danh sách sinh viên */}
      {showStudentsModal && selectedClassForStudents && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="text-green-600" size={28} />
                Danh sách sinh viên - {selectedClassForStudents.name}
              </h3>
              <button
                onClick={closeStudentsModal}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {loadingStudents ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-lg text-gray-600">Đang tải...</div>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">
                    Chưa có sinh viên nào trong lớp này
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-green-50 rounded-lg p-3 mb-4">
                    <p className="text-sm font-medium text-green-800">
                      Tổng số sinh viên: {students.length}
                    </p>
                  </div>
                  {students.map((enrollment, index) => (
                    <div
                      key={enrollment.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {enrollment.student?.name || "N/A"}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {enrollment.student?.email || "N/A"}
                            </p>
                            {enrollment.student?.code && (
                              <p className="text-xs text-gray-500">
                                Mã SV: {enrollment.student.code}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              enrollment.status == "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {enrollment.status == "active"
                              ? "Đang học"
                              : "Ngưng học"}
                          </span>
                          {enrollment.enrollmentDate && (
                            <p className="text-xs text-gray-500 mt-1">
                              Ngày nhập học:{" "}
                              {new Date(
                                enrollment.enrollmentDate
                              ).toLocaleDateString("vi-VN")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={closeStudentsModal}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Danh sách giảng viên */}
      {showTeachersModal && selectedClassForTeachers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <GraduationCap className="text-purple-600" size={28} />
                Danh sách giảng viên - {selectedClassForTeachers.name}
              </h3>
              <button
                onClick={closeTeachersModal}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {loadingTeachers ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-lg text-gray-600">Đang tải...</div>
                </div>
              ) : teachers.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap
                    size={48}
                    className="mx-auto text-gray-400 mb-4"
                  />
                  <p className="text-gray-600">
                    Chưa có giảng viên nào được phân công dạy lớp này
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-purple-50 rounded-lg p-3 mb-4">
                    <p className="text-sm font-medium text-purple-800">
                      Tổng số giảng viên: {teachers.length}
                    </p>
                  </div>
                  {teachers.map((assignment, index) => (
                    <div
                      key={assignment.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {assignment.teacher?.name || "N/A"}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {assignment.teacher?.email || "N/A"}
                            </p>
                            {assignment.subject?.name && (
                              <p className="text-xs text-blue-600 mt-1">
                                📚 Môn: {assignment.subject.name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              assignment.isActive
                                ? "bg-purple-100 text-purple-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {assignment.isActive
                              ? "Đang giảng dạy"
                              : "Ngưng giảng dạy"}
                          </span>
                          {assignment.startDate && (
                            <p className="text-xs text-gray-500 mt-1">
                              Ngày bắt đầu:{" "}
                              {new Date(
                                assignment.startDate
                              ).toLocaleDateString("vi-VN")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={closeTeachersModal}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
