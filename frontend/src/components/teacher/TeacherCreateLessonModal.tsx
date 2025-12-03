"use client";

import { useState, useEffect } from "react";
import { X, FileIcon } from "lucide-react";
import { lessonAPI, subjectAPI } from "@/lib/apiClient";
import { Subject } from "@/types";

interface TeacherCreateLessonModalProps {
  classId: number;
  className: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  title: string;
  description: string;
  subjectId: string;
  status: "draft" | "published" | "archived";
  files: File[];
}

interface FormErrors {
  title?: string;
  subjectId?: string;
  files?: string;
  submit?: string;
}

export function TeacherCreateLessonModal({
  classId,
  className,
  onClose,
  onSuccess,
}: TeacherCreateLessonModalProps) {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    subjectId: "",
    status: "published",
    files: [],
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  // Load subjects
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        setLoadingSubjects(true);
        const response = await subjectAPI.getAll({ page: 1, limit: 100 });
        const subjectsData =
          response.data?.subjects || response.data?.items || [];
        setSubjects(subjectsData);
      } catch (err) {
        console.error("Error loading subjects:", err);
      } finally {
        setLoadingSubjects(false);
      }
    };
    loadSubjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const errors: FormErrors = {};
    if (!formData.title.trim()) {
      errors.title = "Vui lòng nhập tiêu đề bài giảng";
    }
    if (!formData.subjectId) {
      errors.subjectId = "Vui lòng chọn môn học";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitLoading(true);
      setFormErrors({});

      await lessonAPI.create({
        classId: classId,
        subjectId: Number(formData.subjectId),
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        files: formData.files,
      });

      alert("Tạo bài giảng thành công!");
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error creating lesson:", err);
      setFormErrors({
        submit:
          err instanceof Error
            ? err.message
            : "Có lỗi xảy ra khi tạo bài giảng",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              Thêm bài giảng mới
            </h3>
            <p className="text-sm text-gray-600 mt-1">Lớp: {className}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Môn học */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Môn học <span className="text-red-500">*</span>
            </label>
            {loadingSubjects ? (
              <div className="text-gray-500 text-sm py-2">
                Đang tải môn học...
              </div>
            ) : (
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
            )}
            {formErrors.subjectId && (
              <p className="mt-1 text-sm text-red-500">
                {formErrors.subjectId}
              </p>
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

          {/* File đính kèm */}
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
                const totalFiles = currentFiles.length + selectedFiles.length;

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
                  files: [...currentFiles, ...selectedFiles],
                });
                setFormErrors({ ...formErrors, files: "" });
                // Reset input để có thể chọn lại cùng file
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
              {submitLoading ? "Đang thêm..." : "Thêm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
