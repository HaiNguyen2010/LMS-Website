"use client";

import { useState, useEffect } from "react";
import { Assignment, Submission } from "@/types";
import { dashboardAPI, assignmentAPI, submissionAPI } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import {
  BookOpen,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export function TeacherDashboardOverview() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalAssignments: 0,
    pendingSubmissions: 0,
  });
  const [recentAssignments, setRecentAssignments] = useState<Assignment[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<Submission[]>(
    []
  );

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard stats for teacher
      try {
        const statsResponse = await dashboardAPI.getTeacherStats();
        if (statsResponse.data) {
          setStats({
            totalClasses: statsResponse.data.totalClasses || 0,
            totalAssignments: statsResponse.data.totalAssignments || 0,
            pendingSubmissions: statsResponse.data.pendingGrades || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching teacher stats:", error);
      }

      // Fetch recent assignments created by teacher
      const assignmentsResponse = await assignmentAPI.getAll({
        page: 1,
        limit: 5,
      });

      const allAssignments =
        assignmentsResponse.data?.assignments ||
        assignmentsResponse.data?.items ||
        [];

      // Sort by creation date (newest first)
      const recent = [...allAssignments]
        .sort(
          (a: Assignment, b: Assignment) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5);

      setRecentAssignments(recent);

      // Fetch pending submissions (not graded yet) - Use teacher-specific API
      try {
        const submissionsResponse = await submissionAPI.getTeacherSubmissions({
          status: "submitted",
          page: 1,
          limit: 5,
        });
        const submissions =
          submissionsResponse.data?.submissions ||
          submissionsResponse.data?.items ||
          [];
        setPendingSubmissions(submissions);
      } catch (error) {
        console.error("Error fetching pending submissions:", error);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Classes Card */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Lớp học phụ trách</p>
              <p className="text-3xl font-bold text-blue-600">
                {stats.totalClasses}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Assignments Card */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Bài tập đã tạo</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.totalAssignments}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FileText className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Pending Submissions Card */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Bài nộp chờ chấm</p>
              <p className="text-3xl font-bold text-yellow-600">
                {stats.pendingSubmissions}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Assignments */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Bài tập gần đây</h2>
        {recentAssignments.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            Chưa có bài tập nào được tạo
          </div>
        ) : (
          <div className="space-y-4">
            {recentAssignments.map((assignment) => {
              const isOverdue = new Date(assignment.dueDate) < new Date();
              const status = assignment.status || "draft";

              return (
                <div
                  key={assignment.id}
                  className="border-l-4 border-green-500 pl-4 py-2 hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">
                          {assignment.title}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            status === "published"
                              ? "bg-green-100 text-green-800"
                              : status === "archived"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {status === "published"
                            ? "Đã phát hành"
                            : status === "archived"
                            ? "Đã đóng"
                            : "Bản nháp"}
                        </span>
                      </div>
                      {assignment.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {assignment.description}
                        </p>
                      )}
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>
                          📚{" "}
                          {assignment.assignmentSubject?.name ||
                            assignment.subject?.name ||
                            "N/A"}
                        </span>
                        <span>
                          📝{" "}
                          {assignment.type === "essay"
                            ? "Bài luận"
                            : assignment.type === "file_upload"
                            ? "Nộp file"
                            : "Trắc nghiệm"}
                        </span>
                        <span>
                          🏫{" "}
                          {assignment.assignmentClass?.name ||
                            assignment.class?.name ||
                            "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p
                        className={`text-sm font-medium ${
                          isOverdue ? "text-red-600" : "text-gray-900"
                        }`}
                      >
                        {isOverdue && (
                          <AlertCircle className="w-4 h-4 inline mr-1" />
                        )}
                        {new Date(assignment.dueDate).toLocaleDateString(
                          "vi-VN"
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(assignment.dueDate).toLocaleTimeString(
                          "vi-VN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Điểm tối đa: {assignment.maxGrade}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Submissions */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Bài nộp chờ chấm điểm</h2>
        {pendingSubmissions.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            Không có bài nộp nào đang chờ chấm
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Học sinh
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bài tập
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lớp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày nộp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingSubmissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {submission.submissionStudent?.name ||
                        submission.student?.name ||
                        "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {submission.submissionAssignment?.title ||
                        submission.assignment?.title ||
                        "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {submission.submissionAssignment?.assignmentClass?.name ||
                        submission.assignment?.assignmentClass?.name ||
                        submission.assignment?.class?.name ||
                        "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(submission.submittedAt).toLocaleDateString(
                        "vi-VN"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Chờ chấm
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
