"use client";

import { useState, useEffect } from "react";
import { X, Plus, Paperclip, AlertCircle, Minus, Trash2 } from "lucide-react";
import { assignmentAPI, subjectAPI } from "@/lib/apiClient";
import { Subject, MCQQuestion } from "@/types";

interface TeacherCreateAssignmentModalProps {
  classId: number;
  className: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  title: string;
  description: string;
  type: "essay" | "file_upload" | "mcq";
  classId: string;
  subjectId: string;
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
}

interface FormErrors {
  [key: string]: string;
}

export function TeacherCreateAssignmentModal({
  classId,
  className,
  onClose,
  onSuccess,
}: TeacherCreateAssignmentModalProps) {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    type: "essay",
    classId: String(classId),
    subjectId: "",
    dueDate: "",
    maxGrade: 10,
    instructions: "",
    allowedFileTypes: "pdf,doc,docx,jpg,png",
    maxFileSize: 10,
    autoGrade: false,
    showCorrectAnswers: false,
    status: "draft",
    mcqQuestions: [],
    files: [],
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        setLoadingSubjects(true);
        // Get all subjects
        const response = await subjectAPI.getAll();
        const allSubjects =
          response.data?.subjects || response.data?.items || [];
        setSubjects(allSubjects);
      } catch (err) {
        console.error("Error loading subjects:", err);
      } finally {
        setLoadingSubjects(false);
      }
    };
    loadSubjects();
  }, []);

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

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.title.trim()) {
      errors.title = "Vui lòng nhập tiêu đề bài tập";
    }

    if (!formData.subjectId) {
      errors.subjectId = "Vui lòng chọn môn học";
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
      submitFormData.append("classId", formData.classId);
      submitFormData.append("subjectId", formData.subjectId);
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

      // Append multiple files
      formData.files.forEach((file) => {
        submitFormData.append("files", file);
      });

      await assignmentAPI.create(submitFormData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating assignment:", error);
      setFormErrors({
        submit:
          (error as any).response?.data?.message ||
          "Có lỗi xảy ra khi tạo bài tập. Vui lòng thử lại.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Thêm bài tập mới</h3>
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

          {/* Loại bài tập */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại bài tập <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as "essay" | "file_upload" | "mcq",
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="essay">Bài luận</option>
              <option value="file_upload">Nộp file</option>
              <option value="mcq">Trắc nghiệm</option>
            </select>
          </div>

          {/* Lớp học và Môn học */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lớp học
              </label>
              <input
                type="text"
                value={className}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
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
                disabled={loadingSubjects}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">
                  {loadingSubjects ? "Đang tải..." : "Chọn môn học"}
                </option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.code} - {subject.name}
                  </option>
                ))}
              </select>
              {formErrors.subjectId && (
                <p className="mt-1 text-sm text-red-500">
                  {formErrors.subjectId}
                </p>
              )}
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

            <input
              type="file"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  const selectedFiles = Array.from(e.target.files);
                  if (formData.files.length + selectedFiles.length > 10) {
                    alert("Chỉ được upload tối đa 10 files!");
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

            {formData.files.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Files đã chọn ({formData.files.length}):
                </p>
                {formData.files.map((file, index) => (
                  <div
                    key={index}
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
              {submitting ? "Đang tạo..." : "Tạo mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
