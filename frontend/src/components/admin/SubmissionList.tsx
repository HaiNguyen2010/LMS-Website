"use client";

import { useState, useEffect } from "react";
import { submissionAPI } from "@/lib/apiClient";
import type { Submission } from "@/types";
import {
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Paperclip,
} from "lucide-react";

export function SubmissionList() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await submissionAPI.getMySubmissions({
        page: 1,
        limit: 100,
      });
      // Handle both data.submissions and data.items patterns
      const submissionData = Array.isArray(response.data)
        ? response.data
        : response.data?.submissions || response.data?.items || [];
      setSubmissions(submissionData);
    } catch (err) {
      setError("Không thể tải danh sách bài nộp");
      console.error("Error loading submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return "text-gray-600 bg-gray-50";
    switch (status) {
      case "submitted":
        return "text-blue-600 bg-blue-50";
      case "graded":
        return "text-green-600 bg-green-50";
      case "late":
        return "text-orange-600 bg-orange-50";
      case "missing":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status?: string) => {
    if (!status) return <FileText size={16} />;
    switch (status) {
      case "submitted":
        return <Clock size={16} />;
      case "graded":
        return <CheckCircle size={16} />;
      case "late":
        return <Clock size={16} />;
      case "missing":
        return <XCircle size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const getStatusLabel = (status?: string) => {
    if (!status) return "Chưa xác định";
    switch (status) {
      case "submitted":
        return "Đã nộp";
      case "graded":
        return "Đã chấm";
      case "late":
        return "Nộp trễ";
      case "missing":
        return "Chưa nộp";
      default:
        return status;
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
          onClick={loadSubmissions}
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
          Bài nộp của tôi ({submissions.length})
        </h2>
      </div>

      {submissions.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Chưa có bài nộp nào
          </h3>
          <p className="text-gray-500">
            Bạn chưa nộp bài tập nào. Hãy kiểm tra tab Bài tập để xem các bài
            tập cần nộp.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {submission.assignment?.title || "Bài tập"}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getStatusColor(
                        submission.status
                      )}`}
                    >
                      {getStatusIcon(submission.status)}
                      {getStatusLabel(submission.status)}
                    </span>
                  </div>

                  {submission.assignment?.class && (
                    <p className="text-sm text-gray-600 mb-2">
                      Lớp: {submission.assignment.class.name}
                    </p>
                  )}

                  {submission.content && (
                    <p className="text-gray-700 mb-3 line-clamp-2">
                      {submission.content}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>
                        Nộp lúc:{" "}
                        {new Date(submission.submittedAt).toLocaleString(
                          "vi-VN"
                        )}
                      </span>
                    </div>

                    {submission.grade !== null && (
                      <div className="flex items-center gap-1 text-green-600 font-medium">
                        <CheckCircle size={14} />
                        <span>
                          Điểm: {submission.grade}/
                          {submission.assignment?.maxGrade || 10}
                        </span>
                      </div>
                    )}

                    {submission.attachments &&
                      submission.attachments.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Paperclip size={14} />
                          <span>
                            {submission.attachments.length} tệp đính kèm
                          </span>
                        </div>
                      )}
                  </div>

                  {submission.feedback && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        Nhận xét của giáo viên:
                      </p>
                      <p className="text-sm text-blue-800">
                        {submission.feedback}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
