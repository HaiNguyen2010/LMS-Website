"use client";

import { useState, useEffect } from "react";
import {
  Users,
  BookOpen,
  GraduationCap,
  Award,
  TrendingUp,
} from "lucide-react";
import { dashboardAPI } from "@/lib/apiClient";

interface TeacherStats {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  totalClasses: number;
  totalSubjects: number;
  subjects: string[];
  totalStudents: number;
  averageGrade: number;
  assignmentCount: number;
  activeStatus: boolean;
}

interface SummaryStats {
  totalTeachers: number;
  totalStudents: number;
  avgStudentsPerTeacher: number;
  totalAssignments: number;
  overallAvgGrade: number;
  teachersWithGrades: number;
}

export default function TeacherStatistics() {
  const [teachers, setTeachers] = useState<TeacherStats[]>([]);
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [sortBy, setSortBy] = useState<
    "name" | "classes" | "students" | "grade"
  >("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [academicYear, setAcademicYear] = useState<string>("");
  const [term, setTerm] = useState<string>("");
  const [academicYears, setAcademicYears] = useState<string[]>([]);

  // Load academic years from API
  useEffect(() => {
    const loadAcademicYears = async () => {
      try {
        const response = await dashboardAPI.getAcademicYears();
        if (response.success && response.data) {
          setAcademicYears(response.data);
        }
      } catch (err) {
        console.error("Error loading academic years:", err);
      }
    };
    loadAcademicYears();
  }, []);

  useEffect(() => {
    loadTeacherStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academicYear, term]);

  const loadTeacherStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: { academicYear?: string; term?: number } = {};
      if (academicYear) params.academicYear = academicYear;
      if (term) params.term = parseInt(term);

      const response = await dashboardAPI.getTeacherStatistics(params);

      if (response.success && response.data) {
        // response.data chứa { data: [], summary: {} }
        setTeachers(response.data.data || []);
        setSummary(response.data.summary || null);
      } else {
        setError(
          response.message || "Không thể tải dữ liệu thống kê giáo viên"
        );
      }
    } catch (err) {
      console.error("Error loading teacher statistics:", err);
      setError("Không thể tải thống kê giáo viên");
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers.filter((teacher) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "active") return teacher.activeStatus === true;
    return teacher.activeStatus === false;
  });

  const sortedTeachers = [...filteredTeachers].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "classes":
        comparison = a.totalClasses - b.totalClasses;
        break;
      case "students":
        comparison = a.totalStudents - b.totalStudents;
        break;
      case "grade":
        comparison = a.averageGrade - b.averageGrade;
        break;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Sử dụng summary từ backend, fallback về local calculation nếu chưa có
  const totalStudents =
    summary?.totalStudents ??
    teachers.reduce((sum, t) => sum + t.totalStudents, 0);
  const avgStudentsPerTeacher =
    summary?.avgStudentsPerTeacher ??
    (teachers.length > 0 ? Math.round(totalStudents / teachers.length) : 0);
  const totalAssignments =
    summary?.totalAssignments ??
    teachers.reduce((sum, t) => sum + t.assignmentCount, 0);
  const overallAvgGrade =
    summary?.overallAvgGrade?.toFixed(2) ??
    (teachers.length > 0
      ? (
          teachers.reduce((sum, t) => sum + t.averageGrade, 0) / teachers.length
        ).toFixed(2)
      : "0.00");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800 mb-4">{error}</p>
        <button
          onClick={loadTeacherStatistics}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-purple-100">
              <Users size={24} className="text-purple-600" />
            </div>
            <div>
              <h3 className="text-gray-600 text-sm font-medium">
                Tổng giáo viên
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                {teachers.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-green-100">
              <GraduationCap size={24} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-gray-600 text-sm font-medium">TB HS/GV</h3>
              <p className="text-2xl font-bold text-gray-900">
                {avgStudentsPerTeacher}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <BookOpen size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-gray-600 text-sm font-medium">
                Tổng bài tập
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                {totalAssignments}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-orange-100">
              <TrendingUp size={24} className="text-orange-600" />
            </div>
            <div>
              <h3 className="text-gray-600 text-sm font-medium">Điểm TB</h3>
              <p className="text-2xl font-bold text-gray-900">
                {overallAvgGrade}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Bộ lọc và sắp xếp
            </h3>
            {(academicYear || term) && (
              <button
                onClick={() => {
                  setAcademicYear("");
                  setTerm("");
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Năm học
              </label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả năm học</option>
                {academicYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Học kỳ
              </label>
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả học kỳ</option>
                <option value="1">Học kỳ 1</option>
                <option value="2">Học kỳ 2</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái
              </label>
              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(
                    e.target.value as "all" | "active" | "inactive"
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sắp xếp theo
              </label>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as "name" | "classes" | "students" | "grade"
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Tên</option>
                <option value="classes">Số lớp</option>
                <option value="students">Số học sinh</option>
                <option value="grade">Điểm TB</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thứ tự
              </label>
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                {sortOrder === "asc" ? "↑ Tăng dần" : "↓ Giảm dần"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Teacher List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giáo viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số lớp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số môn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số học sinh
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bài tập
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Điểm TB
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedTeachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Award size={20} className="text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {teacher.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {teacher.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {teacher.totalClasses}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {teacher.totalSubjects}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {teacher.totalStudents}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {teacher.assignmentCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                        teacher.averageGrade >= 8
                          ? "bg-green-100 text-green-800"
                          : teacher.averageGrade >= 6.5
                          ? "bg-blue-100 text-blue-800"
                          : teacher.averageGrade >= 5
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {teacher.averageGrade.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        teacher.activeStatus
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {teacher.activeStatus ? "Hoạt động" : "Không hoạt động"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
