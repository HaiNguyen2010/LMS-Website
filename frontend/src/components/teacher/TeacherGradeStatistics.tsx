"use client";

import { useState, useEffect } from "react";
import { BookOpen, TrendingUp, Award, Users, Filter } from "lucide-react";
import { dashboardAPI } from "@/lib/apiClient";

interface TeacherGradeStats {
  id: string;
  classId: number;
  className: string;
  classCode: string;
  subjectId: number;
  subjectName: string;
  totalStudents: number;
  averageGrade: number;
  excellentCount: number;
  goodCount: number;
  averageCount: number;
  belowAverageCount: number;
  passRate: number;
}

export function TeacherGradeStatistics() {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<TeacherGradeStats[]>([]);
  const [summary, setSummary] = useState({
    totalClasses: 0,
    totalSubjects: 0,
    totalStudents: 0,
    overallAvgGrade: 0,
    classesWithGrades: 0,
  });

  // Filters
  const [academicYear, setAcademicYear] = useState("");
  const [term, setTerm] = useState("");
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"grade" | "students">("grade");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    loadAcademicYears();
  }, []);

  useEffect(() => {
    loadStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academicYear, term]);

  const loadAcademicYears = async () => {
    try {
      const response = await dashboardAPI.getAcademicYears();
      if (response.success && response.data) {
        setAcademicYears(response.data);
      }
    } catch (error) {
      console.error("Error loading academic years:", error);
    }
  };

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const params: { academicYear?: string; term?: number } = {};
      if (academicYear) params.academicYear = academicYear;
      if (term) params.term = parseInt(term);

      const response = await dashboardAPI.getTeacherGradeStatistics(params);

      if (response.success && response.data) {
        setStatistics(response.data.data || []);
        setSummary(
          response.data.summary || {
            totalClasses: 0,
            totalSubjects: 0,
            totalStudents: 0,
            overallAvgGrade: 0,
            classesWithGrades: 0,
          }
        );
      }
    } catch (error) {
      console.error("Error loading teacher grade statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSortedStatistics = () => {
    const sorted = [...statistics];
    sorted.sort((a, b) => {
      const compareValue =
        sortBy === "grade"
          ? a.averageGrade - b.averageGrade
          : a.totalStudents - b.totalStudents;

      return sortOrder === "asc" ? compareValue : -compareValue;
    });
    return sorted;
  };

  const safePercentage = (value: number, total: number): string => {
    if (total === 0) return "0.0";
    return ((value / total) * 100).toFixed(1);
  };

  const getGradeColor = (grade: number): string => {
    if (grade >= 9) return "bg-green-100 text-green-800";
    if (grade >= 8) return "bg-blue-100 text-blue-800";
    if (grade >= 7) return "bg-yellow-100 text-yellow-800";
    if (grade >= 5) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  if (loading && statistics.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  const sortedStats = getSortedStatistics();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Thống kê điểm các lớp
        </h2>
        <p className="text-gray-600 mt-1">
          Xem tổng quan điểm số của học sinh trong các lớp bạn giảng dạy
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng lớp</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.totalClasses}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng học sinh</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.totalStudents}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Điểm TB chung</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.overallAvgGrade.toFixed(2)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Môn học</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.totalSubjects}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Bộ lọc và sắp xếp
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Academic Year Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Năm học
            </label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả năm học</option>
              {academicYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Term Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Học kỳ
            </label>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả học kỳ</option>
              <option value="1">Học kỳ 1</option>
              <option value="2">Học kỳ 2</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sắp xếp theo
            </label>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "grade" | "students")
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="grade">Điểm trung bình</option>
              <option value="students">Số học sinh</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thứ tự
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="desc">↓ Giảm dần</option>
              <option value="asc">↑ Tăng dần</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
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
                  Sĩ số
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Điểm TB
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Xuất sắc (≥9)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giỏi (≥8)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khá (≥7)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TB + Yếu (&lt;7)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tỷ lệ đạt
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedStats.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <p className="text-lg font-medium">Không có dữ liệu</p>
                      <p className="text-sm mt-1">
                        Chưa có thông tin điểm cho các lớp bạn giảng dạy
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedStats.map((stat) => (
                  <tr key={stat.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {stat.className}
                          </div>
                          <div className="text-sm text-gray-500">
                            {stat.classCode}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {stat.subjectName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {stat.totalStudents}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(
                          stat.averageGrade
                        )}`}
                      >
                        {stat.averageGrade.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {stat.excellentCount}
                      </div>
                      <div className="text-xs text-gray-500">
                        {safePercentage(
                          stat.excellentCount,
                          stat.excellentCount +
                            stat.goodCount +
                            stat.averageCount +
                            stat.belowAverageCount
                        )}
                        %
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {stat.goodCount}
                      </div>
                      <div className="text-xs text-gray-500">
                        {safePercentage(
                          stat.goodCount,
                          stat.excellentCount +
                            stat.goodCount +
                            stat.averageCount +
                            stat.belowAverageCount
                        )}
                        %
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {stat.averageCount}
                      </div>
                      <div className="text-xs text-gray-500">
                        {safePercentage(
                          stat.averageCount,
                          stat.excellentCount +
                            stat.goodCount +
                            stat.averageCount +
                            stat.belowAverageCount
                        )}
                        %
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {stat.belowAverageCount}
                      </div>
                      <div className="text-xs text-gray-500">
                        {safePercentage(
                          stat.belowAverageCount,
                          stat.excellentCount +
                            stat.goodCount +
                            stat.averageCount +
                            stat.belowAverageCount
                        )}
                        %
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          stat.passRate >= 90
                            ? "bg-green-100 text-green-800"
                            : stat.passRate >= 70
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {stat.passRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
