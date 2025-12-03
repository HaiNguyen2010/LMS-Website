"use client";

import { useEffect, useState } from "react";
import { subjectAPI } from "@/lib/apiClient";
import type { Subject } from "@/types";
import { Edit, Trash2, X, BookOpen, Eye } from "lucide-react";

interface SubjectFormData {
  name: string;
  code: string;
  description?: string;
  credits?: number;
}

export function SubjectManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);
  const [viewingSubject, setViewingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState<SubjectFormData>({
    name: "",
    code: "",
    description: "",
    credits: 0,
  });

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await subjectAPI.getAll({ page: 1, limit: 50 });
      setSubjects(response.data?.subjects || response.data?.items || []);
    } catch (err) {
      setError("Không thể tải danh sách môn học");
      console.error("Error loading subjects:", err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingSubject(null);
    setFormData({
      name: "",
      code: "",
      description: "",
      credits: 0,
    });
    setShowModal(true);
  };

  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      description: subject.description || "",
      credits: subject.credits || 0,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSubject(null);
  };

  const openDeleteModal = (subject: Subject) => {
    setDeletingSubject(subject);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingSubject(null);
  };

  const openDetailModal = (subject: Subject) => {
    setViewingSubject(subject);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setViewingSubject(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "credits" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSubject) {
        await subjectAPI.update(editingSubject.id, formData);
        alert("Cập nhật môn học thành công!");
      } else {
        await subjectAPI.create(formData);
        alert("Thêm môn học thành công!");
      }

      closeModal();
      await loadSubjects();
    } catch (err: any) {
      console.error("Error saving subject:", err);
      const errorMessage = err?.message || "Không thể lưu thông tin môn học";
      alert(errorMessage);
    }
  };

  const handleDeleteSubject = async () => {
    if (!deletingSubject) return;

    try {
      await subjectAPI.delete(deletingSubject.id);
      alert("Xóa môn học thành công!");
      closeDeleteModal();
      await loadSubjects();
    } catch (err: any) {
      console.error("Error deleting subject:", err);
      alert("Không thể xóa môn học. Môn học có thể đang được sử dụng.");
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
          onClick={loadSubjects}
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
          Quản lý môn học {subjects.length > 0 && `(${subjects.length})`}
        </h2>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + Thêm môn học
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {subject.name}
                </h3>
                <p className="text-sm text-gray-500">
                  Mã: {subject.code} •{" "}
                  {subject.credits
                    ? `${subject.credits} tín chỉ`
                    : "Chưa có tín chỉ"}
                </p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                ID: {subject.id}
              </span>
            </div>

            {subject.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {subject.description}
              </p>
            )}

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span className="inline-flex items-center gap-1">
                <BookOpen size={16} />
                Số tín chỉ: {subject.credits || "Chưa định"}
              </span>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => openDetailModal(subject)}
                className="px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition inline-flex items-center justify-center gap-2"
              >
                <Eye size={16} />
              </button>
              <button
                onClick={() => openEditModal(subject)}
                className="px-3 py-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition inline-flex items-center justify-center gap-2"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => openDeleteModal(subject)}
                className="px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition inline-flex items-center justify-center"
                title="Xóa"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {subjects.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Không có môn học nào
        </div>
      )}

      {/* Modal for Add/Edit Subject */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">
                {editingSubject ? "Sửa môn học" : "Thêm môn học mới"}
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
                  Tên môn học <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="VD: Toán học"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã môn học <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  placeholder="VD: MATH101"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số tín chỉ
                </label>
                <input
                  type="number"
                  name="credits"
                  value={formData.credits}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="VD: 3"
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
                  placeholder="Nhập mô tả môn học"
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
                  {editingSubject ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Delete Confirmation */}
      {showDeleteModal && deletingSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <Trash2 size={24} className="text-red-600" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Xác nhận xóa môn học
              </h3>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800 mb-2">
                  ⚠️ <strong>Cảnh báo:</strong> Hành động này không thể hoàn
                  tác!
                </p>
                <p className="text-sm text-yellow-700">
                  Xóa môn học sẽ ảnh hưởng đến:
                </p>
                <ul className="list-disc list-inside text-sm text-yellow-700 mt-2 space-y-1">
                  <li>Phân công giảng dạy</li>
                  <li>Bài giảng</li>
                  <li>Bài tập</li>
                  <li>Điểm số</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-600">Bạn đang xóa:</p>
                <p className="font-semibold text-gray-900 mt-1">
                  {deletingSubject.name}
                </p>
                <p className="text-sm text-gray-500">
                  Mã: {deletingSubject.code}
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
                  onClick={handleDeleteSubject}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Xóa môn học
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chi tiết môn học */}
      {showDetailModal && viewingSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <BookOpen className="text-blue-600" size={28} />
                Chi tiết môn học
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
                      Tên môn học
                    </label>
                    <p className="text-gray-900 font-medium">
                      {viewingSubject.name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Mã môn học
                    </label>
                    <p className="text-gray-900 font-medium">
                      {viewingSubject.code}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Số tín chỉ
                    </label>
                    <p className="text-gray-900 font-medium">
                      {viewingSubject.credits || "Chưa định"} tín chỉ
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      ID môn học
                    </label>
                    <p className="text-gray-900 font-medium">
                      #{viewingSubject.id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mô tả */}
              {viewingSubject.description && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">
                    Mô tả môn học
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    {viewingSubject.description}
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
                      {new Date(viewingSubject.createdAt).toLocaleDateString(
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
                      {new Date(viewingSubject.updatedAt).toLocaleDateString(
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
                  openEditModal(viewingSubject);
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
    </div>
  );
}
