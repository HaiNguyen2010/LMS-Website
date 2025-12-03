"use client";

import { Lesson } from "@/types";
import {
  X,
  Calendar,
  User,
  BookOpen,
  FileText,
  Download,
  Clock,
  CheckCircle,
  Image as ImageIcon,
  File,
  FileSpreadsheet,
  Presentation,
  Paperclip,
} from "lucide-react";

interface TeacherLessonDetailProps {
  lesson: Lesson;
  onClose: () => void;
}

export function TeacherLessonDetail({
  lesson,
  onClose,
}: TeacherLessonDetailProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex items-start justify-between z-10">
          <div className="flex items-start gap-4 flex-1">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-3">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {lesson.title}
                </h1>
                {lesson.status === "published" && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Đã xuất bản
                  </span>
                )}
              </div>

              {lesson.description && (
                <p className="text-gray-600 mb-3">{lesson.description}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                {lesson.lessonClass && (
                  <div className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-1 text-blue-500" />
                    <span className="font-medium mr-1">Lớp:</span>
                    {lesson.lessonClass.name} ({lesson.lessonClass.code})
                  </div>
                )}
                {lesson.lessonSubject && (
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-1 text-purple-500" />
                    <span className="font-medium mr-1">Môn:</span>
                    {lesson.lessonSubject.name}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(lesson.createdAt).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {new Date(lesson.createdAt).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                {lesson.lessonCreator && (
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {lesson.lessonCreator.name}
                  </div>
                )}
              </div>

              {lesson.updatedAt && lesson.updatedAt !== lesson.createdAt && (
                <div className="mt-2 text-xs text-gray-500 italic">
                  Cập nhật lần cuối:{" "}
                  {new Date(lesson.updatedAt).toLocaleString("vi-VN")}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Nội dung bài giảng
          </h2>
          <div className="prose max-w-none">
            <div
              className="text-gray-700 leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: lesson.description || "" }}
            />
          </div>
        </div>

        {/* Attachments */}
        {lesson.attachments && lesson.attachments.length > 0 && (
          <div className="p-6 pt-0">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Download className="w-6 h-6 text-blue-600" />
              Tài liệu đính kèm ({lesson.attachments.length})
            </h2>
            <div className="space-y-3">
              {lesson.attachments.map((attachment) => {
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
                    <div className="bg-blue-100 text-blue-600 rounded-lg p-3 flex items-center justify-center">
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
                        <span className="uppercase">{attachment.fileType}</span>
                        {attachment.description && (
                          <span className="text-gray-400">
                            • {attachment.description}
                          </span>
                        )}
                      </div>
                      {attachment.sortOrder > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          Thứ tự: {attachment.sortOrder}
                        </div>
                      )}
                    </div>
                    <Download className="w-5 h-5 text-gray-400" />
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
