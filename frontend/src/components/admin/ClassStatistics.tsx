"use client";

import { useState, useEffect } from "react";
import { Users, BookOpen, TrendingUp, BarChart3 } from "lucide-react";
import { dashboardAPI } from "@/lib/apiClient";

interface ClassStats {
  id: number;
  name: string;
  code: string;
  grade: string;
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  totalSubjects: number;
  averageGrade: number;
  teacherCount: number;
}

interface SummaryStats {
  totalClasses: number;
  totalStudents: number;
  totalActiveStudents: number;
  avgStudentsPerClass: number;
  overallAvgGrade: number;
  classesWithGrades: number;
}

export default function ClassStatistics() {
  const [classes, setClasses] = useState<ClassStats[]>([]);
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "students" | "grade">("name");
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
    loadClassStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academicYear, term]);

  const loadClassStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: { academicYear?: string; term?: number } = {};
      if (academicYear) params.academicYear = academicYear;
      if (term) params.term = parseInt(term);

      const response = await dashboardAPI.getClassStatistics(params);

      if (response.success && response.data) {
        // Backend trả về { success, message, data: { data: [], summary: {} } }
        setClasses(response.data.data || []);
        setSummary(response.data.summary || null);
      } else {
        setError(response.message || "Không thể tải dữ liệu thống kê lớp học");
      }
    } catch (err) {
      console.error("Error loading class statistics:", err);
      setError("Không thể tải thống kê lớp học");
    } finally {
      setLoading(false);
    }
  };

  const sortedClasses = [...classes].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name);
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
    classes.reduce((sum, cls) => sum + cls.totalStudents, 0);
  const avgStudentsPerClass =
    summary?.avgStudentsPerClass ??
    (classes.length > 0 ? Math.round(totalStudents / classes.length) : 0);
  const overallAvgGrade =
    summary?.overallAvgGrade?.toFixed(2) ??
    (classes.filter((cls) => cls.averageGrade > 0).length > 0
      ? (
          classes
            .filter((cls) => cls.averageGrade > 0)
            .reduce((sum, cls) => sum + cls.averageGrade, 0) /
          classes.filter((cls) => cls.averageGrade > 0).length
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
          onClick={loadClassStatistics}
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
            <div className="p-3 rounded-lg bg-blue-100">
              <BookOpen size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-gray-600 text-sm font-medium">Tổng số lớp</h3>
              <p className="text-2xl font-bold text-gray-900">
                {classes.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-green-100">
              <Users size={24} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-gray-600 text-sm font-medium">
                Tổng học sinh
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                {totalStudents}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-purple-100">
              <BarChart3 size={24} className="text-purple-600" />
            </div>
            <div>
              <h3 className="text-gray-600 text-sm font-medium">TB HS/Lớp</h3>
              <p className="text-2xl font-bold text-gray-900">
                {avgStudentsPerClass}
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
              <h3 className="text-gray-600 text-sm font-medium">
                Điểm TB chung
              </h3>
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                Sắp xếp theo
              </label>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "name" | "students" | "grade")
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Tên lớp</option>
                <option value="students">Số học sinh</option>
                <option value="grade">Điểm trung bình</option>
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

      {/* Class List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lớp học
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổng HS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  HS Hoạt động
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số môn học
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số GV
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
              {sortedClasses.map((cls) => (
                <tr key={cls.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {cls.name}
                    </div>
                    <div className="text-sm text-gray-500">{cls.code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cls.totalStudents}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {cls.activeStudents}
                    </div>
                    <div className="text-xs text-gray-500">
                      {cls.inactiveStudents} không hoạt động
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cls.totalSubjects}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cls.teacherCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                        cls.averageGrade >= 8
                          ? "bg-green-100 text-green-800"
                          : cls.averageGrade >= 6.5
                          ? "bg-blue-100 text-blue-800"
                          : cls.averageGrade >= 5
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {cls.averageGrade.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Hoạt động
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
