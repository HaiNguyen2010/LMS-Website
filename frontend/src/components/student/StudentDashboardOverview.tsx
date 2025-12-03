"use client";

import { useState, useEffect } from "react";
import { Assignment, Grade } from "@/types";
import { dashboardAPI, assignmentAPI, gradeAPI } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";

export function StudentDashboardOverview() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    enrolledClasses: 0,
    pendingAssignments: 0,
    averageGrade: "--",
  });
  const [upcomingAssignments, setUpcomingAssignments] = useState<Assignment[]>(
    []
  );
  const [recentGrades, setRecentGrades] = useState<Grade[]>([]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard stats
      const statsResponse = await dashboardAPI.getStudentStats();
      if (statsResponse.data) {
        setStats({
          enrolledClasses: statsResponse.data.enrolledClasses,
          pendingAssignments: statsResponse.data.pendingAssignments,
          averageGrade: statsResponse.data.averageGrade
            ? statsResponse.data.averageGrade.toString()
            : "--",
        });
      }

      // Fetch upcoming assignments (assignments with upcoming due dates)
      const assignmentsResponse = await assignmentAPI.getAll({
        page: 1,
        limit: 5,
      });

      const allAssignments =
        assignmentsResponse.data?.assignments ||
        assignmentsResponse.data?.items ||
        [];

      // Filter and sort by due date
      const upcoming = allAssignments
        .filter((a: Assignment) => new Date(a.dueDate) >= new Date())
        .sort(
          (a: Assignment, b: Assignment) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        )
        .slice(0, 5);

      setUpcomingAssignments(upcoming);

      // Fetch recent grades
      if (user?.id) {
        const gradesResponse = await gradeAPI.getByStudentId(user.id, {
          page: 1,
          limit: 5,
        });

        // Backend returns { grades: [], averages: [], pagination: {} }
        const grades =
          gradesResponse.data?.grades ||
          (Array.isArray(gradesResponse.data) ? gradesResponse.data : []);

        // Sort by recorded date (newest first)
        const recent = [...grades]
          .sort(
            (a: Grade, b: Grade) =>
              new Date(b.recordedAt).getTime() -
              new Date(a.recordedAt).getTime()
          )
          .slice(0, 5);

        setRecentGrades(recent);
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
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Classes Card */}
        {/* <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Lớp học đã đăng ký</p>
              <p className="text-3xl font-bold text-blue-600">
                {stats.enrolledClasses}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          </div>
        </div> */}

        {/* Assignments Card */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Bài tập chưa nộp</p>
              <p className="text-3xl font-bold text-red-600">
                {stats.pendingAssignments}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Grades Card */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Điểm trung bình</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.averageGrade}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Assignments */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Bài tập sắp đến hạn</h2>
        {upcomingAssignments.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            Không có bài tập nào sắp đến hạn
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {assignment.title}
                    </h3>
                    {assignment.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {assignment.description}
                      </p>
                    )}
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>
                        🏫{" "}
                        {assignment.assignmentClass?.name ||
                          assignment.class?.name ||
                          "N/A"}
                      </span>
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
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-600">
                      {new Date(assignment.dueDate).toLocaleDateString("vi-VN")}
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
            ))}
          </div>
        )}
      </div>

      {/* Recent Grades */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Điểm gần đây</h2>
        {recentGrades.length === 0 ? (
          <div className="text-gray-500 text-center py-8">Chưa có điểm nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lớp học
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Môn học
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loại điểm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Học kỳ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Điểm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày ghi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentGrades.map((grade) => (
                  <tr key={grade.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {grade.gradeClass?.name || grade.class?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {grade.gradeSubject?.name || grade.subject?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {grade.gradeType === "homework"
                        ? "Bài tập"
                        : grade.gradeType === "quiz"
                        ? "Kiểm tra"
                        : grade.gradeType === "midterm"
                        ? "Giữa kỳ"
                        : grade.gradeType === "final"
                        ? "Cuối kỳ"
                        : grade.gradeType === "assignment"
                        ? "Bài tập lớn"
                        : "Tham gia"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {grade.term === "1"
                        ? "HK1"
                        : grade.term === "2"
                        ? "HK2"
                        : "Cuối năm"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-bold ${
                          grade.gradeValue >= 8
                            ? "text-green-600"
                            : grade.gradeValue >= 6.5
                            ? "text-blue-600"
                            : grade.gradeValue >= 5
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {grade.gradeValue}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(grade.recordedAt).toLocaleDateString("vi-VN")}
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
