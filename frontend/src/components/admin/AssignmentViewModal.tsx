import React from "react";
import type { Assignment } from "@/types";
import {
  X,
  Paperclip,
  Download,
  FileIcon,
  School,
  BookOpen,
} from "lucide-react";

interface Attachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType?: string;
}

interface AssignmentWithAttachments extends Assignment {
  attachments?: Attachment[];
}

interface AssignmentViewModalProps {
  showViewModal: boolean;
  viewingAssignment: Assignment | null;
  onClose: () => void;
  getAssignmentTypeLabel: (type: string) => string;
}

export function AssignmentViewModal({
  showViewModal,
  viewingAssignment,
  onClose,
  getAssignmentTypeLabel,
}: AssignmentViewModalProps) {
  // Parse mcqQuestions if it's a string
  const mcqQuestions = React.useMemo(() => {
    if (!viewingAssignment?.mcqQuestions) return [];
    if (Array.isArray(viewingAssignment.mcqQuestions)) {
      return viewingAssignment.mcqQuestions;
    }
    // If it's a string, try to parse it
    if (typeof viewingAssignment.mcqQuestions === "string") {
      try {
        return JSON.parse(viewingAssignment.mcqQuestions);
      } catch (e) {
        console.error("Failed to parse mcqQuestions:", e);
        return [];
      }
    }
    return [];
  }, [viewingAssignment?.mcqQuestions]);

  if (!showViewModal || !viewingAssignment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Chi tiết bài tập</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Tiêu đề</h4>
            <p className="text-lg font-semibold text-gray-900">
              {viewingAssignment.title}
            </p>
          </div>

          {viewingAssignment.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">Mô tả</h4>
              <p className="text-gray-700">{viewingAssignment.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">
                Loại bài tập
              </h4>
              <p className="text-gray-900">
                {getAssignmentTypeLabel(viewingAssignment.type)}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Điểm tối đa</h4>
              <p className="text-gray-900">{viewingAssignment.maxGrade}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">
                Lớp học
              </h4>
              <div className="flex items-center gap-2">
                <School size={16} className="text-purple-600" />
                <span className="text-gray-900">
                  {viewingAssignment.class?.name ||
                    `ID ${viewingAssignment.classId}`}
                </span>
                {viewingAssignment.class?.code && (
                  <span className="text-gray-500 text-sm">
                    ({viewingAssignment.class.code})
                  </span>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">
                Môn học
              </h4>
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-green-600" />
                <span className="text-gray-900">
                  {viewingAssignment.subject?.name ||
                    `ID ${viewingAssignment.subjectId}`}
                </span>
                {viewingAssignment.subject?.code && (
                  <span className="text-gray-500 text-sm">
                    ({viewingAssignment.subject.code})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500">Hạn nộp</h4>
            <p className="text-gray-900">
              {new Date(viewingAssignment.dueDate).toLocaleString("vi-VN")}
            </p>
          </div>

          {viewingAssignment.instructions && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">Hướng dẫn</h4>
              <p className="text-gray-700">{viewingAssignment.instructions}</p>
            </div>
          )}

          {viewingAssignment.type === "mcq" &&
            mcqQuestions &&
            Array.isArray(mcqQuestions) &&
            mcqQuestions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Câu hỏi trắc nghiệm
                </h4>
                <div className="space-y-4">
                  {mcqQuestions.map((question, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <p className="font-medium text-gray-900 mb-2">
                        {index + 1}. {question.question}
                      </p>
                      <div className="space-y-1 ml-4">
                        {question.options.map(
                          (option: string, optIndex: number) => (
                            <p
                              key={optIndex}
                              className={`text-sm ${
                                question.correctAnswer === optIndex
                                  ? "text-green-700 font-medium"
                                  : "text-gray-700"
                              }`}
                            >
                              {String.fromCharCode(65 + optIndex)}. {option}
                              {question.correctAnswer === optIndex && " ✓"}
                            </p>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Attachments */}
          {(viewingAssignment as AssignmentWithAttachments).attachments &&
            (viewingAssignment as AssignmentWithAttachments).attachments!
              .length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tệp đính kèm (
                  {
                    (viewingAssignment as AssignmentWithAttachments)
                      .attachments!.length
                  }
                  )
                </label>
                <div className="space-y-2">
                  {(
                    viewingAssignment as AssignmentWithAttachments
                  ).attachments!.map((attachment: Attachment) => (
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
                          {attachment.fileType?.toUpperCase() || "FILE"} •{" "}
                          {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
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

          {viewingAssignment.fileUrl && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">
                Tệp đính kèm (cũ)
              </h4>
              <a
                href={viewingAssignment.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
              >
                <FileIcon size={16} />
                {viewingAssignment.fileName || "Tải file"}
              </a>
            </div>
          )}
        </div>

        <div className="border-t px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
