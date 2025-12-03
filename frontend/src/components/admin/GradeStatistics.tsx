"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  BookOpen,
  Filter,
  Download,
  Calendar,
} from "lucide-react";
import { dashboardAPI } from "@/lib/apiClient";

interface SchoolGradeStats {
  filters: {
    academicYear: string;
    term: string;
  };
  overall: {
    totalGrades: number;
    average: number;
  };
  byType: {
    [key: string]: {
      count: number;
      total: number;
      average: number;
      min: number;
      max: number;
    };
  };
  byTerm: {
    [key: string]: {
      count: number;
      total: number;
      average: number;
    };
  };
  byClass: Array<{
    classId: number;
    className: string;
    classCode: string;
    count: number;
    total: number;
    average: number;
  }>;
}

export default function GradeStatistics() {
  const [stats, setStats] = useState<SchoolGradeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [academicYear, setAcademicYear] = useState<string>("");
  const [term, setTerm] = useState<"1" | "2" | "">("");
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
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academicYear, term]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await dashboardAPI.getSchoolGradeStats(
        academicYear || undefined,
        term || undefined
      );

      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError("Không thể tải dữ liệu thống kê điểm");
      }
    } catch (err) {
      console.error("Error loading grade stats:", err);
      setError("Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

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

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800 mb-4">{error}</p>
        <button
          onClick={loadStats}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const gradeTypeLabels: { [key: string]: string } = {
    homework: "Bài tập về nhà",
    quiz: "Kiểm tra",
    midterm: "Giữa kỳ",
    final: "Cuối kỳ",
    assignment: "Bài tập",
  };

  const termLabels: { [key: string]: string } = {
    "1": "Học kỳ 1",
    "2": "Học kỳ 2",
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 size={28} className="text-blue-600" />
              Thống kê điểm toàn trường
            </h2>
            <p className="text-gray-600 mt-1">
              Tổng quan điểm số của học sinh theo năm học và học kỳ
            </p>
          </div>
          {/* <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <Download size={20} />
            Xuất báo cáo
          </button> */}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Lọc:</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-500" />
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả năm học</option>
              {academicYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <select
            value={term}
            onChange={(e) => setTerm(e.target.value as "1" | "2" | "")}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả học kỳ</option>
            <option value="1">Học kỳ 1</option>
            <option value="2">Học kỳ 2</option>
          </select>

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

        {/* Current Filter Display */}
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
          <span>Đang hiển thị:</span>
          <span className="font-semibold text-gray-900">
            {stats.filters.academicYear === "all"
              ? "Tất cả năm học"
              : stats.filters.academicYear}
          </span>
          <span>•</span>
          <span className="font-semibold text-gray-900">
            {stats.filters.term === "all"
              ? "Tất cả học kỳ"
              : termLabels[stats.filters.term]}
          </span>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Award size={40} className="opacity-80" />
            <TrendingUp size={24} />
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">
            Điểm trung bình toàn trường
          </h3>
          <p className="text-4xl font-bold">
            {stats.overall.average.toFixed(2)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 size={40} className="opacity-80" />
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Tổng số điểm</h3>
          <p className="text-4xl font-bold">
            {stats.overall.totalGrades.toLocaleString()}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <BookOpen size={40} className="opacity-80" />
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Số lớp học</h3>
          <p className="text-4xl font-bold">{stats.byClass.length}</p>
        </div>
      </div>

      {/* Statistics by Grade Type */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">
            Thống kê theo loại điểm
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats.byType).map(([type, data]) => (
              <div
                key={type}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">
                    {gradeTypeLabels[type]}
                  </h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {data.count} điểm
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Trung bình:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {data.average.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Cao nhất:</span>
                    <span className="font-semibold text-green-600">
                      {data.max.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Thấp nhất:</span>
                    <span className="font-semibold text-red-600">
                      {data.min.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${(data.average / 10) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics by Term */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">
            Thống kê theo học kỳ
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(stats.byTerm).map(([termKey, data]) => (
              <div
                key={termKey}
                className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-400 transition"
              >
                <h4 className="font-bold text-xl text-gray-900 mb-4">
                  {termLabels[termKey]}
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Điểm trung bình
                    </p>
                    <p className="text-3xl font-bold text-blue-600">
                      {data.average.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Số điểm</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {data.count.toLocaleString()}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
                        style={{ width: `${(data.average / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics by Class */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users size={20} />
            Thống kê theo lớp học (Top 10)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã lớp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên lớp
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số điểm
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Điểm TB
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Biểu đồ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.byClass.slice(0, 10).map((classData, index) => (
                <tr key={classData.classId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                        index === 0
                          ? "bg-yellow-100 text-yellow-700"
                          : index === 1
                          ? "bg-gray-100 text-gray-700"
                          : index === 2
                          ? "bg-orange-100 text-orange-700"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {classData.classCode}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      {classData.className}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-600">
                      {classData.count}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                        classData.average >= 8
                          ? "bg-green-100 text-green-800"
                          : classData.average >= 6.5
                          ? "bg-blue-100 text-blue-800"
                          : classData.average >= 5
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {classData.average.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          classData.average >= 8
                            ? "bg-green-500"
                            : classData.average >= 6.5
                            ? "bg-blue-500"
                            : classData.average >= 5
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${(classData.average / 10) * 100}%` }}
                      />
                    </div>
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
