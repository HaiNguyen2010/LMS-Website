"use client";

import { useState } from "react";
import { X, FileIcon } from "lucide-react";
import { lessonAPI } from "@/lib/apiClient";
import { Lesson } from "@/types";

interface TeacherEditLessonModalProps {
  lesson: Lesson;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  title: string;
  description: string;
  status: "draft" | "published" | "archived";
  files: File[];
  deleteAttachmentIds: number[];
}

interface FormErrors {
  title?: string;
  files?: string;
  submit?: string;
}

export function TeacherEditLessonModal({
  lesson,
  onClose,
  onSuccess,
}: TeacherEditLessonModalProps) {
  const [formData, setFormData] = useState<FormData>({
    title: lesson.title || "",
    description: lesson.description || "",
    status: lesson.status || "published",
    files: [],
    deleteAttachmentIds: [],
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const errors: FormErrors = {};
    if (!formData.title.trim()) {
      errors.title = "Vui lòng nhập tiêu đề bài giảng";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitLoading(true);
      setFormErrors({});

      await lessonAPI.update(lesson.id, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        files: formData.files,
        deleteAttachmentIds: formData.deleteAttachmentIds,
      });

      alert("Cập nhật bài giảng thành công!");
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error updating lesson:", err);
      setFormErrors({
        submit:
          err instanceof Error
            ? err.message
            : "Có lỗi xảy ra khi cập nhật bài giảng",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteAttachment = (attachmentId: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa file đính kèm này không?")) {
      setFormData({
        ...formData,
        deleteAttachmentIds: [...formData.deleteAttachmentIds, attachmentId],
      });
    }
  };

  const undoDeleteAttachment = (attachmentId: number) => {
    setFormData({
      ...formData,
      deleteAttachmentIds: formData.deleteAttachmentIds.filter(
        (id) => id !== attachmentId
      ),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Sửa bài giảng</h3>
            <p className="text-sm text-gray-600 mt-1">
              Lớp: {lesson.lessonClass?.name || "N/A"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Lớp học (readonly) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lớp
            </label>
            <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
              {lesson.lessonClass?.name || `ID ${lesson.classId}`}
              {lesson.lessonClass?.code && ` (${lesson.lessonClass.code})`}
            </div>
          </div>

          {/* Môn học (readonly) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Môn học
            </label>
            <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
              {lesson.lessonSubject?.name || `ID ${lesson.subjectId}`}
              {lesson.lessonSubject?.code && ` (${lesson.lessonSubject.code})`}
            </div>
          </div>

          {/* Tiêu đề */}
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
              <p className="mt-1 text-sm text-red-500">{formErrors.title}</p>
            )}
          </div>

          {/* Mô tả */}
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

          {/* Trạng thái */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as "draft" | "published" | "archived",
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="draft">Bản nháp</option>
              <option value="published">Đã xuất bản</option>
              <option value="archived">Lưu trữ</option>
            </select>
          </div>

          {/* File đính kèm hiện tại */}
          {lesson.attachments && lesson.attachments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tệp đính kèm hiện tại ({lesson.attachments.length})
              </label>
              <div className="space-y-2">
                {lesson.attachments.map((attachment) => {
                  const isMarkedForDeletion =
                    formData.deleteAttachmentIds.includes(attachment.id);
                  return (
                    <div
                      key={attachment.id}
                      className={`flex items-center justify-between p-3 border rounded-lg ${
                        isMarkedForDeletion
                          ? "bg-red-50 border-red-200 opacity-50"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileIcon
                          size={16}
                          className={
                            isMarkedForDeletion
                              ? "text-red-600 flex-shrink-0"
                              : "text-blue-600 flex-shrink-0"
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <span
                            className={`text-sm truncate block ${
                              isMarkedForDeletion
                                ? "text-red-700 line-through"
                                : "text-gray-700"
                            }`}
                          >
                            {attachment.fileName}
                          </span>
                          {attachment.fileSize && (
                            <span className="text-xs text-gray-500">
                              {(attachment.fileSize / 1024 / 1024).toFixed(2)}{" "}
                              MB
                            </span>
                          )}
                        </div>
                      </div>
                      {isMarkedForDeletion ? (
                        <button
                          type="button"
                          onClick={() => undoDeleteAttachment(attachment.id)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium ml-2 flex-shrink-0"
                        >
                          Hoàn tác
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(attachment.id)}
                          className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {formData.deleteAttachmentIds.length > 0 && (
                <p className="mt-2 text-sm text-red-600">
                  Sẽ xóa {formData.deleteAttachmentIds.length} file khi lưu
                </p>
              )}
            </div>
          )}

          {/* File đính kèm mới */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thêm tệp đính kèm mới (tối đa 10 tệp)
            </label>
            <input
              type="file"
              multiple
              onChange={(e) => {
                const selectedFiles = Array.from(e.target.files || []);
                const currentFiles = formData.files;
                const currentAttachments = lesson.attachments?.length || 0;
                const totalFiles =
                  currentFiles.length +
                  selectedFiles.length +
                  currentAttachments -
                  formData.deleteAttachmentIds.length;

                if (totalFiles > 10) {
                  setFormErrors({
                    files: `Tổng số file không được vượt quá 10. Hiện có ${currentAttachments} file, đã chọn ${currentFiles.length} file mới, đánh dấu xóa ${formData.deleteAttachmentIds.length} file.`,
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
              Hỗ trợ: PDF, Word, PowerPoint, Video, Excel, Hình ảnh, ZIP/RAR,
              TXT (tối đa 100MB/tệp)
            </p>
            {formErrors.files && (
              <p className="mt-1 text-sm text-red-500">{formErrors.files}</p>
            )}

            {/* Selected new files preview */}
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
              onClick={onClose}
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
  );
}
