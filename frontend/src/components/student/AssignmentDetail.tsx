"use client";

import { useState } from "react";
import { Assignment, Submission } from "@/types";
import {
  X,
  Calendar,
  Clock,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  Upload,
  ClipboardList,
  Image as ImageIcon,
  File,
  FileSpreadsheet,
  Presentation,
  Paperclip,
} from "lucide-react";
import { submissionAPI } from "@/lib/apiClient";

interface AssignmentDetailProps {
  assignment: Assignment;
  submission?: Submission;
  onClose: () => void;
  onSubmitted?: () => void;
}

export function AssignmentDetail({
  assignment,
  submission,
  onClose,
  onSubmitted,
}: AssignmentDetailProps) {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submissionContent, setSubmissionContent] = useState("");
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOverdue = !submission && new Date() > new Date(assignment.dueDate);
  const daysUntilDue = Math.ceil(
    (new Date(assignment.dueDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);

      // Validate file types if specified
      if (assignment.allowedFileTypes) {
        const allowedTypes = assignment.allowedFileTypes
          .split(",")
          .map((t) => t.trim().toLowerCase());
        const invalidFiles = newFiles.filter((file) => {
          const ext = "." + file.name.split(".").pop()?.toLowerCase();
          return !allowedTypes.includes(ext);
        });

        if (invalidFiles.length > 0) {
          setError(
            `Loại file không hợp lệ: ${invalidFiles
              .map((f) => f.name)
              .join(", ")}. Chỉ chấp nhận: ${assignment.allowedFileTypes}`
          );
          return;
        }
      }

      // Validate file sizes if specified
      if (assignment.maxFileSize) {
        const maxSizeBytes = assignment.maxFileSize * 1024 * 1024; // Convert MB to bytes
        const oversizedFiles = newFiles.filter(
          (file) => file.size > maxSizeBytes
        );

        if (oversizedFiles.length > 0) {
          setError(
            `File quá lớn: ${oversizedFiles
              .map((f) => f.name)
              .join(", ")}. Kích thước tối đa: ${assignment.maxFileSize}MB`
          );
          return;
        }
      }

      setSubmissionFiles([...submissionFiles, ...newFiles]);
      setError(null);
    }
  };

  const removeFile = (index: number) => {
    setSubmissionFiles((files) => files.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();

    if (
      ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(ext || "")
    ) {
      return <ImageIcon className="w-5 h-5 text-blue-600" />;
    } else if (ext === "pdf") {
      return <FileText className="w-5 h-5 text-red-600" />;
    } else if (["doc", "docx"].includes(ext || "")) {
      return <FileText className="w-5 h-5 text-blue-700" />;
    } else if (["xls", "xlsx", "csv"].includes(ext || "")) {
      return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
    } else if (["ppt", "pptx"].includes(ext || "")) {
      return <Presentation className="w-5 h-5 text-orange-600" />;
    } else if (["zip", "rar", "7z", "tar", "gz"].includes(ext || "")) {
      return <File className="w-5 h-5 text-purple-600" />;
    }
    return <Paperclip className="w-5 h-5 text-gray-600" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Validation
      if (assignment.type === "essay" && !submissionContent.trim()) {
        setError("Vui lòng nhập nội dung bài làm");
        return;
      }

      if (assignment.type === "file_upload" && submissionFiles.length === 0) {
        setError("Vui lòng chọn file để nộp");
        return;
      }

      const formData = new FormData();
      formData.append("content", submissionContent);

      submissionFiles.forEach((file) => {
        formData.append("files", file);
      });

      await submissionAPI.create(assignment.id, formData);

      alert("Nộp bài thành công!");
      setShowSubmitModal(false);
      setSubmissionContent("");
      setSubmissionFiles([]);
      onSubmitted?.();
    } catch (err) {
      console.error("Error submitting:", err);
      setError("Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-3">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {assignment.title}
                  </h1>
                  {submission ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Đã nộp
                    </span>
                  ) : isOverdue ? (
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Quá hạn
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-semibold rounded-full">
                      Chưa nộp
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                  {assignment.assignmentClass && (
                    <div className="flex items-center">
                      <span className="font-medium mr-1">Lớp:</span>
                      {assignment.assignmentClass.name} (
                      {assignment.assignmentClass.code})
                    </div>
                  )}
                  {assignment.assignmentSubject && (
                    <div className="flex items-center">
                      <span className="font-medium mr-1">Môn:</span>
                      {assignment.assignmentSubject.name}
                    </div>
                  )}
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Hạn nộp:{" "}
                    {new Date(assignment.dueDate).toLocaleDateString("vi-VN")}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {new Date(assignment.dueDate).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="bg-blue-50 px-3 py-1 rounded-full">
                    <span className="font-medium text-blue-700">
                      Điểm tối đa:
                    </span>{" "}
                    <span className="text-blue-900">{assignment.maxGrade}</span>
                  </div>
                  <div className="bg-purple-50 px-3 py-1 rounded-full">
                    <span className="font-medium text-purple-700">Loại:</span>{" "}
                    <span className="text-purple-900">
                      {assignment.type === "file_upload"
                        ? "Nộp file"
                        : assignment.type === "essay"
                        ? "Bài luận"
                        : assignment.type === "mcq"
                        ? "Trắc nghiệm"
                        : "Khác"}
                    </span>
                  </div>
                  {assignment.allowedFileTypes && (
                    <div className="bg-green-50 px-3 py-1 rounded-full">
                      <span className="font-medium text-green-700">
                        File cho phép:
                      </span>{" "}
                      <span className="text-green-900 uppercase">
                        {assignment.allowedFileTypes}
                      </span>
                    </div>
                  )}
                  {assignment.maxFileSize && (
                    <div className="bg-orange-50 px-3 py-1 rounded-full">
                      <span className="font-medium text-orange-700">
                        Kích thước tối đa:
                      </span>{" "}
                      <span className="text-orange-900">
                        {assignment.maxFileSize} MB
                      </span>
                    </div>
                  )}
                </div>

                {!submission && !isOverdue && (
                  <div
                    className={`text-sm font-medium flex items-center gap-1 mt-2 ${
                      daysUntilDue <= 1
                        ? "text-red-600"
                        : daysUntilDue <= 3
                        ? "text-orange-600"
                        : "text-gray-600"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    {daysUntilDue === 0
                      ? "Hạn nộp hôm nay"
                      : daysUntilDue === 1
                      ? "Hạn nộp ngày mai"
                      : `Còn ${daysUntilDue} ngày`}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!submission && !isOverdue && (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {assignment.type === "mcq" ? "Làm bài" : "Nộp bài"}
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Assignment Info Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              Thông tin bài tập
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-600 mb-1">Trạng thái</div>
                <div className="font-medium text-gray-900">
                  {assignment.status === "published" ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Đã xuất bản
                    </span>
                  ) : assignment.status === "draft" ? (
                    <span className="text-gray-600 flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      Bản nháp
                    </span>
                  ) : (
                    <span className="text-gray-600 flex items-center gap-1">
                      <File className="w-4 h-4" />
                      Đã lưu trữ
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">
                  Chấm điểm tự động
                </div>
                <div className="font-medium text-gray-900">
                  {assignment.autoGrade ? (
                    <span className="text-blue-600 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Có
                    </span>
                  ) : (
                    <span className="text-gray-600 flex items-center gap-1">
                      <X className="w-4 h-4" />
                      Không
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Ngày tạo</div>
                <div className="font-medium text-gray-900 text-sm">
                  {new Date(assignment.createdAt).toLocaleDateString("vi-VN")}
                </div>
              </div>
              {assignment.updatedAt &&
                assignment.updatedAt !== assignment.createdAt && (
                  <div>
                    <div className="text-xs text-gray-600 mb-1">
                      Cập nhật lần cuối
                    </div>
                    <div className="font-medium text-gray-900 text-sm">
                      {new Date(assignment.updatedAt).toLocaleDateString(
                        "vi-VN"
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* Description */}
          {assignment.description && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Mô tả</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {assignment.description}
              </p>
            </div>
          )}

          {/* Instructions */}
          {assignment.instructions && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Hướng dẫn làm bài
              </h2>
              <div
                className="prose max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: assignment.instructions }}
              />
            </div>
          )}

          {/* Attachments */}
          {assignment.attachments && assignment.attachments.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Download className="w-6 h-6 text-blue-600" />
                Tài liệu đính kèm ({assignment.attachments.length})
              </h2>
              <div className="space-y-3">
                {assignment.attachments.map((attachment) => {
                  // Get icon based on file type
                  const getFileIcon = (mimeType: string) => {
                    if (mimeType?.startsWith("image/"))
                      return <ImageIcon className="w-6 h-6" />;
                    if (mimeType?.includes("pdf"))
                      return <FileText className="w-6 h-6" />;
                    if (mimeType?.includes("word"))
                      return <FileText className="w-6 h-6" />;
                    if (
                      mimeType?.includes("excel") ||
                      mimeType?.includes("spreadsheet")
                    )
                      return <FileSpreadsheet className="w-6 h-6" />;
                    if (
                      mimeType?.includes("powerpoint") ||
                      mimeType?.includes("presentation")
                    )
                      return <Presentation className="w-6 h-6" />;
                    return <Paperclip className="w-6 h-6" />;
                  };

                  return (
                    <a
                      key={attachment.id}
                      href={`http://localhost:5000${attachment.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition border border-gray-200 hover:border-blue-300"
                    >
                      <div className="bg-blue-100 text-blue-600 rounded-lg p-3 flex items-center justify-center text-2xl">
                        {getFileIcon(attachment.mimeType)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {attachment.fileName}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                          <span>
                            {attachment.fileSize
                              ? `${(attachment.fileSize / 1024).toFixed(2)} KB`
                              : ""}
                          </span>
                          <span className="uppercase">
                            {attachment.fileType}
                          </span>
                          {attachment.description && (
                            <span className="text-gray-400">
                              • {attachment.description}
                            </span>
                          )}
                        </div>
                      </div>
                      <Download className="w-5 h-5 text-gray-400" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submission Info */}
          {submission && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Thông tin bài nộp
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <div className="text-sm text-gray-600">Trạng thái</div>
                    <div className="font-medium text-green-700 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      {submission.status === "graded"
                        ? "Đã chấm điểm"
                        : "Đã nộp bài"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Thời gian nộp</div>
                    <div className="font-medium text-gray-900">
                      {new Date(submission.submittedAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                </div>

                {submission.status === "graded" &&
                  submission.grade !== null &&
                  submission.grade !== undefined && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-sm text-gray-600 mb-1">Điểm số</div>
                      <div
                        className={`text-3xl font-bold ${
                          submission.grade >= 8
                            ? "text-green-600"
                            : submission.grade >= 6.5
                            ? "text-blue-600"
                            : submission.grade >= 5
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {submission.grade}/{assignment.maxGrade}
                      </div>
                      {submission.feedback && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <div className="text-sm text-gray-600 mb-1">
                            Nhận xét của giáo viên
                          </div>
                          <p className="text-gray-700">{submission.feedback}</p>
                        </div>
                      )}
                    </div>
                  )}

                {submission.content && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Nội dung bài làm
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {submission.content}
                      </p>
                    </div>
                  </div>
                )}

                {submission.attachments &&
                  submission.attachments.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        File đính kèm
                      </div>
                      <div className="space-y-2">
                        {submission.attachments.map((attachment) => (
                          <a
                            key={attachment.id}
                            href={`http://localhost:5000${attachment.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition border border-gray-200"
                          >
                            <div className="flex-shrink-0">
                              {getFileIcon(attachment.fileName)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {attachment.fileName}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {attachment.fileSize
                                  ? formatFileSize(attachment.fileSize)
                                  : ""}
                              </div>
                            </div>
                            <Download className="w-4 h-4 text-gray-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Nộp bài tập</h3>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={submitting}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                  {error}
                </div>
              )}

              {assignment.type === "essay" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nội dung bài làm <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    rows={10}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập nội dung bài làm của bạn..."
                    disabled={submitting}
                  />
                </div>
              )}

              {(assignment.type === "file_upload" ||
                assignment.type === "essay") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File đính kèm
                    {assignment.type === "file_upload" && (
                      <span className="text-red-500"> *</span>
                    )}
                  </label>

                  {/* File constraints info */}
                  {(assignment.allowedFileTypes || assignment.maxFileSize) && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                          {assignment.allowedFileTypes && (
                            <div>
                              <span className="font-medium">
                                Loại file cho phép:
                              </span>{" "}
                              <span className="uppercase">
                                {assignment.allowedFileTypes}
                              </span>
                            </div>
                          )}
                          {assignment.maxFileSize && (
                            <div>
                              <span className="font-medium">
                                Kích thước tối đa mỗi file:
                              </span>{" "}
                              {assignment.maxFileSize} MB
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <label className="flex-1">
                      <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer">
                        <Upload className="w-5 h-5 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">
                          Chọn file để upload
                        </span>
                        <input
                          type="file"
                          onChange={handleFileChange}
                          multiple
                          accept={assignment.allowedFileTypes || undefined}
                          className="hidden"
                          disabled={submitting}
                        />
                      </div>
                    </label>
                  </div>

                  {/* File list */}
                  {submissionFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Đã chọn {submissionFiles.length} file
                        </span>
                        <button
                          onClick={() => setSubmissionFiles([])}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                          disabled={submitting}
                        >
                          Xóa tất cả
                        </button>
                      </div>

                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {submissionFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition group"
                          >
                            <div className="flex-shrink-0">
                              {getFileIcon(file.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {file.name}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {formatFileSize(file.size)}
                              </div>
                            </div>
                            <button
                              onClick={() => removeFile(index)}
                              className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition opacity-0 group-hover:opacity-100"
                              disabled={submitting}
                              title="Xóa file"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                        <strong>Lưu ý:</strong> Bạn có thể chọn thêm nhiều file
                        bằng cách click vào nút &ldquo;Chọn file để
                        upload&rdquo; lại
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Đang nộp...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Nộp bài
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
