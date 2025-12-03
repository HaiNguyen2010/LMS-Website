"use client";

import { useEffect, useState } from "react";
import { lessonAPI, classAPI, subjectAPI } from "@/lib/apiClient";
import type { Lesson, Class, Subject } from "@/types";
import {
  Eye,
  Edit,
  Trash2,
  School,
  BookOpen,
  Paperclip,
  Calendar,
  X,
  Plus,
  CheckCircle,
  XCircle,
  Download,
  FileIcon,
} from "lucide-react";

export function LessonList() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);
  const [viewingLesson, setViewingLesson] = useState<Lesson | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    classId: "",
    subjectId: "",
    title: "",
    description: "",
    status: "published" as "draft" | "published" | "archived",
    files: [] as File[],
    deleteAttachmentIds: [] as number[],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load lessons
      const response = await lessonAPI.getAll({ page: 1, limit: 100 });
      const lessonsData = response.data?.lessons || response.data?.items || [];
      const mappedLessons = lessonsData.map(
        (
          lesson: Lesson & { lessonClass?: Class; lessonSubject?: Subject }
        ) => ({
          ...lesson,
          class: lesson.lessonClass || lesson.class,
          subject: lesson.lessonSubject || lesson.subject,
        })
      );
      setLessons(mappedLessons);

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
      classId: "",
      subjectId: "",
      title: "",
      description: "",
      status: "published",
      files: [],
      deleteAttachmentIds: [],
    });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.classId) errors.classId = "Vui lòng chọn lớp";
    if (!formData.subjectId) errors.subjectId = "Vui lòng chọn môn học";
    if (!formData.title.trim()) errors.title = "Vui lòng nhập tiêu đề";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddClick = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditClick = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      classId: lesson.classId.toString(),
      subjectId: lesson.subjectId.toString(),
      title: lesson.title,
      description: lesson.description || "",
      status: lesson.status,
      files: [],
      deleteAttachmentIds: [],
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleDeleteClick = (lesson: Lesson) => {
    setDeletingLesson(lesson);
    setShowDeleteModal(true);
  };

  const handleViewClick = (lesson: Lesson) => {
    setViewingLesson(lesson);
    setShowViewModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitLoading(true);
    try {
      const submitData = {
        classId: parseInt(formData.classId),
        subjectId: parseInt(formData.subjectId),
        title: formData.title,
        description: formData.description,
        status: formData.status,
        files: formData.files.length > 0 ? formData.files : undefined,
        deleteAttachmentIds:
          formData.deleteAttachmentIds.length > 0
            ? formData.deleteAttachmentIds
            : undefined,
      };

      if (editingLesson) {
        await lessonAPI.update(editingLesson.id, submitData);
      } else {
        await lessonAPI.create(submitData);
      }

      await loadData();
      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
      setEditingLesson(null);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setFormErrors({ submit: error.message || "Có lỗi xảy ra" });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingLesson) return;

    setSubmitLoading(true);
    try {
      await lessonAPI.delete(deletingLesson.id);
      await loadData();
      setShowDeleteModal(false);
      setDeletingLesson(null);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setFormErrors({ submit: error.message || "Có lỗi xảy ra khi xóa" });
    } finally {
      setSubmitLoading(false);
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
          Danh sách bài giảng {lessons.length > 0 && `(${lessons.length})`}
        </h2>
        <button
          onClick={handleAddClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2"
        >
          <Plus size={20} />
          <span>Thêm bài giảng</span>
        </button>
      </div>

      <div className="space-y-4">
        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {lesson.title}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded ${
                      lesson.status === "published"
                        ? "bg-green-100 text-green-800"
                        : lesson.status === "draft"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {lesson.status === "published"
                      ? "Đã xuất bản"
                      : lesson.status === "draft"
                      ? "Bản nháp"
                      : "Lưu trữ"}
                  </span>
                </div>

                {lesson.description && (
                  <p className="text-gray-600 text-sm mb-3">
                    {lesson.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <School size={16} />
                    <span>
                      Lớp: {lesson.class?.name || `ID ${lesson.classId}`}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <BookOpen size={16} />
                    <span>
                      Môn: {lesson.subject?.name || `ID ${lesson.subjectId}`}
                    </span>
                  </span>
                  {lesson.attachments && lesson.attachments.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-blue-600">
                      <Paperclip size={16} />
                      <span>{lesson.attachments.length} tệp đính kèm</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={16} />
                    <span>
                      {new Date(lesson.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleViewClick(lesson)}
                  className="px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition text-sm inline-flex items-center gap-1"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => handleEditClick(lesson)}
                  className="px-3 py-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition text-sm inline-flex items-center gap-1"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDeleteClick(lesson)}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition text-sm inline-flex items-center"
                  title="Xóa"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {lessons.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Không có bài giảng nào
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Thêm bài giảng mới
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
                      {cls.name} ({cls.code})
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.title ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Nhập tiêu đề bài giảng"
                />
                {formErrors.title && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập mô tả bài giảng"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as
                        | "draft"
                        | "published"
                        | "archived",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="draft">Bản nháp</option>
                  <option value="published">Đã xuất bản</option>
                  <option value="archived">Lưu trữ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tệp đính kèm (tối đa 10 tệp)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    const selectedFiles = Array.from(e.target.files || []);
                    const currentFiles = formData.files;
                    const totalFiles =
                      currentFiles.length + selectedFiles.length;

                    if (totalFiles > 10) {
                      setFormErrors({
                        files: `Chỉ được chọn tối đa 10 tệp. Bạn đã có ${
                          currentFiles.length
                        } tệp, chỉ có thể thêm ${
                          10 - currentFiles.length
                        } tệp nữa.`,
                      });
                      return;
                    }

                    setFormData({
                      ...formData,
                      files: [...currentFiles, ...selectedFiles], // Thêm vào thay vì thay thế
                    });
                    setFormErrors({ ...formErrors, files: "" });
                    // Reset input để có thể chọn lại cùng file
                    e.target.value = "";
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  accept=".pdf,.docx,.doc,.pptx,.ppt,.mp4,.avi,.mkv,.xlsx,.xls,.jpg,.jpeg,.png,.zip,.rar,.txt"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Hỗ trợ: PDF, Word, PowerPoint, Video, Excel, Hình ảnh,
                  ZIP/RAR, TXT (tối đa 100MB/tệp)
                </p>
                {formErrors.files && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.files}
                  </p>
                )}

                {/* Selected files preview */}
                {formData.files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      File mới ({formData.files.length}):
                    </p>
                    {formData.files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileIcon
                            size={16}
                            className="text-blue-600 flex-shrink-0"
                          />
                          <span className="text-sm text-gray-700 truncate">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newFiles = formData.files.filter(
                              (_, i) => i !== index
                            );
                            setFormData({ ...formData, files: newFiles });
                          }}
                          className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
      {showEditModal && editingLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Sửa bài giảng</h3>
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
                  Lớp
                </label>
                <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
                  {editingLesson.class?.name || `ID ${editingLesson.classId}`}
                  {editingLesson.class?.code && (
                    <span className="ml-2 text-gray-500">
                      ({editingLesson.class.code})
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Môn học
                </label>
                <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
                  {editingLesson.subject?.name ||
                    `ID ${editingLesson.subjectId}`}
                  {editingLesson.subject?.code && (
                    <span className="ml-2 text-gray-500">
                      ({editingLesson.subject.code})
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.title ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Nhập tiêu đề bài giảng"
                />
                {formErrors.title && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập mô tả bài giảng"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as
                        | "draft"
                        | "published"
                        | "archived",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="draft">Bản nháp</option>
                  <option value="published">Đã xuất bản</option>
                  <option value="archived">Lưu trữ</option>
                </select>
              </div>

              {/* Existing attachments */}
              {editingLesson.attachments &&
                editingLesson.attachments.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tệp đính kèm hiện tại (
                      {
                        editingLesson.attachments.filter(
                          (att) =>
                            !formData.deleteAttachmentIds.includes(att.id)
                        ).length
                      }
                      )
                    </label>
                    <div className="space-y-2">
                      {editingLesson.attachments.map((attachment) => {
                        const isMarkedForDeletion =
                          formData.deleteAttachmentIds.includes(attachment.id);

                        return (
                          <div
                            key={attachment.id}
                            className={`flex items-center justify-between p-2 rounded border ${
                              isMarkedForDeletion
                                ? "bg-red-50 border-red-200 opacity-50"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Paperclip
                                size={16}
                                className={`flex-shrink-0 ${
                                  isMarkedForDeletion
                                    ? "text-red-400"
                                    : "text-gray-600"
                                }`}
                              />
                              <a
                                href={`${
                                  process.env.NEXT_PUBLIC_API_URL ||
                                  "http://localhost:5000"
                                }${attachment.fileUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-sm truncate ${
                                  isMarkedForDeletion
                                    ? "text-red-600 line-through"
                                    : "text-blue-600 hover:underline"
                                }`}
                                onClick={(e) =>
                                  isMarkedForDeletion && e.preventDefault()
                                }
                              >
                                {attachment.fileName}
                              </a>
                              <span className="text-xs text-gray-500 flex-shrink-0">
                                (
                                {(attachment.fileSize / 1024 / 1024).toFixed(2)}{" "}
                                MB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (isMarkedForDeletion) {
                                  // Bỏ đánh dấu xóa
                                  setFormData({
                                    ...formData,
                                    deleteAttachmentIds:
                                      formData.deleteAttachmentIds.filter(
                                        (id) => id !== attachment.id
                                      ),
                                  });
                                } else {
                                  // Đánh dấu xóa
                                  setFormData({
                                    ...formData,
                                    deleteAttachmentIds: [
                                      ...formData.deleteAttachmentIds,
                                      attachment.id,
                                    ],
                                  });
                                }
                              }}
                              className={`ml-2 flex-shrink-0 ${
                                isMarkedForDeletion
                                  ? "text-green-600 hover:text-green-800"
                                  : "text-red-600 hover:text-red-800"
                              }`}
                              title={
                                isMarkedForDeletion
                                  ? "Hoàn tác xóa"
                                  : "Xóa file"
                              }
                            >
                              {isMarkedForDeletion ? (
                                <X size={16} />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thêm tệp mới (tối đa 10 tệp)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    const selectedFiles = Array.from(e.target.files || []);
                    const currentFiles = formData.files;
                    const existingFilesCount = editingLesson.attachments
                      ? editingLesson.attachments.filter(
                          (att) =>
                            !formData.deleteAttachmentIds.includes(att.id)
                        ).length
                      : 0;
                    const totalFiles =
                      existingFilesCount +
                      currentFiles.length +
                      selectedFiles.length;

                    if (totalFiles > 10) {
                      const canAddMore =
                        10 - existingFilesCount - currentFiles.length;
                      setFormErrors({
                        files: `Chỉ được chọn tối đa 10 tệp. Bạn đã có ${existingFilesCount} tệp hiện tại và ${currentFiles.length} tệp mới, chỉ có thể thêm ${canAddMore} tệp nữa.`,
                      });
                      return;
                    }

                    setFormData({
                      ...formData,
                      files: [...currentFiles, ...selectedFiles],
                    });
                    setFormErrors({ ...formErrors, files: "" });
                    e.target.value = "";
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  accept=".pdf,.docx,.doc,.pptx,.ppt,.mp4,.avi,.mkv,.xlsx,.xls,.jpg,.jpeg,.png,.zip,.rar,.txt"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Hỗ trợ: PDF, Word, PowerPoint, Video, Excel, Hình ảnh,
                  ZIP/RAR, TXT (tối đa 100MB/tệp)
                </p>
                {formErrors.files && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.files}
                  </p>
                )}

                {/* Selected files preview */}
                {formData.files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Tệp mới ({formData.files.length}):
                    </p>
                    {formData.files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileIcon
                            size={16}
                            className="text-green-600 flex-shrink-0"
                          />
                          <span className="text-sm text-gray-700 truncate">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newFiles = formData.files.filter(
                              (_, i) => i !== index
                            );
                            setFormData({ ...formData, files: newFiles });
                          }}
                          className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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

      {/* View Modal */}
      {showViewModal && viewingLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Chi tiết bài giảng
              </h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiêu đề
                </label>
                <p className="text-gray-900 text-lg font-semibold">
                  {viewingLesson.title}
                </p>
              </div>

              {viewingLesson.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {viewingLesson.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lớp
                  </label>
                  <div className="flex items-center gap-2">
                    <School size={16} className="text-purple-600" />
                    <span className="text-gray-900">
                      {viewingLesson.class?.name ||
                        `ID ${viewingLesson.classId}`}
                    </span>
                    {viewingLesson.class?.code && (
                      <span className="text-gray-500 text-sm">
                        ({viewingLesson.class.code})
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Môn học
                  </label>
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-green-600" />
                    <span className="text-gray-900">
                      {viewingLesson.subject?.name ||
                        `ID ${viewingLesson.subjectId}`}
                    </span>
                    {viewingLesson.subject?.code && (
                      <span className="text-gray-500 text-sm">
                        ({viewingLesson.subject.code})
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <div>
                    {viewingLesson.status === "published" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                        <CheckCircle size={14} />
                        Đã xuất bản
                      </span>
                    ) : viewingLesson.status === "draft" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                        <XCircle size={14} />
                        Bản nháp
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded">
                        <XCircle size={14} />
                        Lưu trữ
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày tạo
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-orange-600" />
                    <span className="text-gray-900">
                      {new Date(viewingLesson.createdAt).toLocaleString(
                        "vi-VN"
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Attachments section */}
              {viewingLesson.attachments &&
                viewingLesson.attachments.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tệp đính kèm ({viewingLesson.attachments.length})
                    </label>
                    <div className="space-y-2">
                      {viewingLesson.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <Paperclip
                            size={16}
                            className="text-gray-600 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 truncate font-medium">
                              {attachment.fileName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {attachment.fileType.toUpperCase()} •{" "}
                              {(attachment.fileSize / 1024 / 1024).toFixed(2)}{" "}
                              MB
                            </p>
                            {attachment.description && (
                              <p className="text-xs text-gray-600 mt-1">
                                {attachment.description}
                              </p>
                            )}
                          </div>
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL}${attachment.fileUrl}`}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 inline-flex items-center gap-1 text-sm flex-shrink-0"
                          >
                            <Download size={14} />
                            Tải
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEditClick(viewingLesson);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
              >
                <Edit size={16} />
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingLesson && (
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
                Bạn có chắc chắn muốn xóa bài giảng này?
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <p>
                  <strong>Tiêu đề:</strong> {deletingLesson.title}
                </p>
                <p>
                  <strong>Lớp:</strong>{" "}
                  {deletingLesson.class?.name || `ID ${deletingLesson.classId}`}
                </p>
                <p>
                  <strong>Môn học:</strong>{" "}
                  {deletingLesson.subject?.name ||
                    `ID ${deletingLesson.subjectId}`}
                </p>
                {deletingLesson.attachments &&
                  deletingLesson.attachments.length > 0 && (
                    <p>
                      <strong>Tệp đính kèm:</strong>{" "}
                      {deletingLesson.attachments.length} tệp
                    </p>
                  )}
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Lưu ý:</strong> Hành động này không thể hoàn tác.
                  Bài giảng và tất cả tệp đính kèm sẽ bị xóa vĩnh viễn.
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
