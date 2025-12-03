"use client";

import { useState } from "react";
import { X, Plus, Paperclip, AlertCircle, Minus, Trash2 } from "lucide-react";
import { assignmentAPI } from "@/lib/apiClient";
import { Assignment, MCQQuestion, Attachment } from "@/types";

interface TeacherEditAssignmentModalProps {
  assignment: Assignment;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  title: string;
  description: string;
  type: "essay" | "file_upload" | "mcq";
  dueDate: string;
  maxGrade: number;
  instructions: string;
  allowedFileTypes: string;
  maxFileSize: number;
  autoGrade: boolean;
  showCorrectAnswers: boolean;
  status: "draft" | "published" | "closed";
  mcqQuestions: MCQQuestion[];
  files: File[];
  existingAttachments: Array<{
    id: number;
    fileName: string;
    fileUrl: string;
    fileSize: number;
  }>;
  attachmentsToDelete: number[];
}

interface FormErrors {
  [key: string]: string;
}

export function TeacherEditAssignmentModal({
  assignment,
  onClose,
  onSuccess,
}: TeacherEditAssignmentModalProps) {
  const [formData, setFormData] = useState<FormData>({
    title: assignment.title,
    description: assignment.description || "",
    type: assignment.type,
    dueDate: assignment.dueDate
      ? new Date(assignment.dueDate).toISOString().slice(0, 16)
      : "",
    maxGrade: assignment.maxGrade,
    instructions: assignment.instructions || "",
    allowedFileTypes: assignment.allowedFileTypes || "pdf,doc,docx,jpg,png",
    maxFileSize: assignment.maxFileSize || 10,
    autoGrade: assignment.autoGrade || false,
    showCorrectAnswers: assignment.showCorrectAnswers || false,
    status: (assignment.status as "draft" | "published" | "closed") || "draft",
    mcqQuestions: (() => {
      // Parse mcqQuestions if it's a string
      if (typeof assignment.mcqQuestions === "string") {
        try {
          const parsed = JSON.parse(assignment.mcqQuestions);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      // Return as array if already an array
      return Array.isArray(assignment.mcqQuestions)
        ? assignment.mcqQuestions
        : [];
    })(),
    files: [],
    existingAttachments: (assignment.assignmentAttachments || []).map(
      (att: Attachment) => ({
        id: att.id,
        fileName: att.fileName,
        fileUrl: att.fileUrl,
        fileSize: att.fileSize,
      })
    ),
    attachmentsToDelete: [],
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const addMCQQuestion = () => {
    setFormData({
      ...formData,
      mcqQuestions: [
        ...formData.mcqQuestions,
        {
          question: "",
          options: ["", "", "", ""],
          correctAnswer: 0,
        },
      ],
    });
  };

  const updateMCQQuestion = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const newQuestions = [...formData.mcqQuestions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setFormData({ ...formData, mcqQuestions: newQuestions });
  };

  const updateMCQOption = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const newQuestions = [...formData.mcqQuestions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setFormData({ ...formData, mcqQuestions: newQuestions });
  };

  const removeMCQQuestion = (index: number) => {
    const newQuestions = formData.mcqQuestions.filter((_, i) => i !== index);
    setFormData({ ...formData, mcqQuestions: newQuestions });
  };

  const handleDeleteAttachment = (attachmentId: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa file đính kèm này không?")) {
      setFormData({
        ...formData,
        attachmentsToDelete: [...formData.attachmentsToDelete, attachmentId],
      });
    }
  };

  const undoDeleteAttachment = (attachmentId: number) => {
    setFormData({
      ...formData,
      attachmentsToDelete: formData.attachmentsToDelete.filter(
        (id) => id !== attachmentId
      ),
    });
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.title.trim()) {
      errors.title = "Vui lòng nhập tiêu đề bài tập";
    }

    if (!formData.dueDate) {
      errors.dueDate = "Vui lòng chọn hạn nộp";
    }

    if (formData.maxGrade <= 0 || formData.maxGrade > 100) {
      errors.maxGrade = "Điểm tối đa phải từ 0.01 đến 100";
    }

    if (formData.type === "mcq" && formData.mcqQuestions.length === 0) {
      errors.mcqQuestions = "Vui lòng thêm ít nhất một câu hỏi trắc nghiệm";
    }

    // Validate total file count
    const currentTotal =
      formData.files.length +
      formData.existingAttachments.length -
      formData.attachmentsToDelete.length;

    if (currentTotal > 10) {
      errors.files = "Tổng số file không được vượt quá 10";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setFormErrors({});

      const submitFormData = new FormData();
      submitFormData.append("title", formData.title);
      submitFormData.append("description", formData.description);
      submitFormData.append("type", formData.type);
      submitFormData.append("dueDate", formData.dueDate);
      submitFormData.append("maxGrade", String(formData.maxGrade));
      submitFormData.append("instructions", formData.instructions);
      submitFormData.append("allowedFileTypes", formData.allowedFileTypes);
      submitFormData.append("maxFileSize", String(formData.maxFileSize));
      submitFormData.append("status", formData.status);

      if (formData.type === "mcq") {
        submitFormData.append("autoGrade", String(formData.autoGrade));
        submitFormData.append(
          "showCorrectAnswers",
          String(formData.showCorrectAnswers)
        );
        submitFormData.append(
          "mcqQuestions",
          JSON.stringify(formData.mcqQuestions)
        );
      }

      // Append new files
      formData.files.forEach((file) => {
        submitFormData.append("files", file);
      });

      // Append files to delete
      if (formData.attachmentsToDelete.length > 0) {
        submitFormData.append(
          "deleteAttachmentIds",
          JSON.stringify(formData.attachmentsToDelete)
        );
      }

      await assignmentAPI.update(assignment.id, submitFormData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating assignment:", error);
      setFormErrors({
        submit:
          (error as any).response?.data?.message ||
          "Có lỗi xảy ra khi cập nhật bài tập. Vui lòng thử lại.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Chỉnh sửa bài tập</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formErrors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2">
              <AlertCircle
                className="text-red-600 flex-shrink-0 mt-0.5"
                size={18}
              />
              <span className="text-red-800 text-sm">{formErrors.submit}</span>
            </div>
          )}

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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập tiêu đề bài tập"
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
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập mô tả bài tập"
            />
          </div>

          {/* Loại bài tập - Readonly */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại bài tập
            </label>
            <input
              type="text"
              value={
                formData.type === "essay"
                  ? "Bài luận"
                  : formData.type === "file_upload"
                  ? "Nộp file"
                  : "Trắc nghiệm"
              }
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          {/* Lớp học và Môn học - Readonly */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lớp học
              </label>
              <input
                type="text"
                value={
                  assignment.assignmentClass?.name ||
                  assignment.class?.name ||
                  "N/A"
                }
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Môn học
              </label>
              <input
                type="text"
                value={
                  assignment.assignmentSubject?.name ||
                  assignment.subject?.name ||
                  "N/A"
                }
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>
          </div>

          {/* Hạn nộp và Điểm tối đa */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hạn nộp <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {formErrors.dueDate && (
                <p className="mt-1 text-sm text-red-500">
                  {formErrors.dueDate}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Điểm tối đa <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="100"
                value={formData.maxGrade}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxGrade: parseFloat(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {formErrors.maxGrade && (
                <p className="mt-1 text-sm text-red-500">
                  {formErrors.maxGrade}
                </p>
              )}
            </div>
          </div>

          {/* Hướng dẫn */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hướng dẫn làm bài
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) =>
                setFormData({ ...formData, instructions: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập hướng dẫn làm bài cho học sinh"
            />
          </div>

          {/* File upload settings */}
          {(formData.type === "file_upload" || formData.type === "essay") && (
            <div className="space-y-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Cài đặt nộp file</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại file cho phép
                </label>
                <input
                  type="text"
                  value={formData.allowedFileTypes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      allowedFileTypes: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="pdf,doc,docx,jpg,png"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Nhập các loại file cách nhau bởi dấu phẩy (không có dấu chấm)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kích thước tối đa (MB)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  step="1"
                  value={formData.maxFileSize}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      setFormData({
                        ...formData,
                        maxFileSize: 1,
                      });
                    } else {
                      const mbValue = parseInt(value);
                      setFormData({
                        ...formData,
                        maxFileSize: mbValue,
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Giới hạn từ 1-50 MB
                </p>
              </div>
            </div>
          )}

          {/* MCQ Questions */}
          {formData.type === "mcq" && (
            <div className="space-y-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-900">
                  Câu hỏi trắc nghiệm ({formData.mcqQuestions.length})
                </h4>
                <button
                  type="button"
                  onClick={addMCQQuestion}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm inline-flex items-center gap-1"
                >
                  <Plus size={16} />
                  Thêm câu hỏi
                </button>
              </div>

              {formErrors.mcqQuestions && (
                <p className="text-sm text-red-500">
                  {formErrors.mcqQuestions}
                </p>
              )}

              {formData.mcqQuestions.map((question, qIndex) => (
                <div
                  key={qIndex}
                  className="p-4 bg-white border border-gray-200 rounded-lg space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <label className="block text-sm font-medium text-gray-700">
                      Câu hỏi {qIndex + 1}
                    </label>
                    <button
                      type="button"
                      onClick={() => removeMCQQuestion(qIndex)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Minus size={18} />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={question.question}
                    onChange={(e) =>
                      updateMCQQuestion(qIndex, "question", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập câu hỏi"
                  />

                  <div className="space-y-2">
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={question.correctAnswer === oIndex}
                          onChange={() =>
                            updateMCQQuestion(qIndex, "correctAnswer", oIndex)
                          }
                          className="flex-shrink-0"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) =>
                            updateMCQOption(qIndex, oIndex, e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={`Đáp án ${String.fromCharCode(
                            65 + oIndex
                          )}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.autoGrade}
                    onChange={(e) =>
                      setFormData({ ...formData, autoGrade: e.target.checked })
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">
                    Tự động chấm điểm
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.showCorrectAnswers}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        showCorrectAnswers: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">
                    Hiện đáp án đúng sau khi nộp
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Đính kèm file */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Đính kèm file (Tối đa 10 files)
            </label>

            {formErrors.files && (
              <p className="mb-2 text-sm text-red-500">{formErrors.files}</p>
            )}

            {/* Input file */}
            <input
              type="file"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  const selectedFiles = Array.from(e.target.files);
                  const currentTotal =
                    formData.files.length +
                    formData.existingAttachments.length -
                    formData.attachmentsToDelete.length;

                  if (currentTotal + selectedFiles.length > 10) {
                    alert("Tổng số file không được vượt quá 10!");
                    return;
                  }

                  setFormData({
                    ...formData,
                    files: [...formData.files, ...selectedFiles],
                  });
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {/* Hiển thị files mới */}
            {formData.files.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Files mới ({formData.files.length}):
                </p>
                {formData.files.map((file, index) => (
                  <div
                    key={`new-${index}`}
                    className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Paperclip
                        size={14}
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
                      className="ml-2 text-red-600 hover:text-red-800 flex-shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Hiển thị existing attachments */}
            {formData.existingAttachments.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Files hiện tại (
                  {
                    formData.existingAttachments.filter(
                      (att) => !formData.attachmentsToDelete.includes(att.id)
                    ).length
                  }
                  ):
                </p>
                {formData.existingAttachments.map((attachment) => {
                  const isMarkedForDeletion =
                    formData.attachmentsToDelete.includes(attachment.id);

                  return (
                    <div
                      key={`existing-${attachment.id}`}
                      className={`flex items-center justify-between p-2 rounded border ${
                        isMarkedForDeletion
                          ? "bg-red-50 border-red-200 opacity-50"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Paperclip
                          size={14}
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
                          ({(attachment.fileSize / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (isMarkedForDeletion) {
                            undoDeleteAttachment(attachment.id);
                          } else {
                            handleDeleteAttachment(attachment.id);
                          }
                        }}
                        className={`ml-2 flex-shrink-0 ${
                          isMarkedForDeletion
                            ? "text-green-600 hover:text-green-800"
                            : "text-red-600 hover:text-red-800"
                        }`}
                        title={
                          isMarkedForDeletion ? "Hoàn tác xóa" : "Xóa file"
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
            )}
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
                  status: e.target.value as "draft" | "published" | "closed",
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="draft">Bản nháp</option>
              <option value="published">Đã phát hành</option>
              <option value="closed">Đã đóng</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={submitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
            >
              {submitting ? "Đang cập nhật..." : "Cập nhật"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
