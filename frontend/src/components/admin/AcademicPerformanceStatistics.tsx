"use client";

import { useState, useEffect, useCallback } from "react";
import { BookOpen, TrendingUp, Award, Users, BarChart3 } from "lucide-react";
import { dashboardAPI } from "@/lib/apiClient";

interface AcademicPerformance {
  id: number;
  name: string;
  type: "class" | "subject";
  code: string;
  totalStudents: number;
  averageGrade: number;
  excellentCount: number; // >= 9 (Xuất sắc)
  goodCount: number; // >= 8 (Giỏi)
  averageCount: number; // >= 7 (Khá)
  belowAverageCount: number; // < 7 (Trung bình + Yếu)
  passRate: number;
}

interface SummaryStats {
  totalItems: number;
  totalStudents: number;
  overallAvgGrade: number;
  overallPassRate: number;
  totalExcellent: number;
  totalGood: number;
  totalAverage: number;
  totalBelowAverage: number;
  itemsWithGrades: number;
}

export default function AcademicPerformanceStatistics() {
  const [performances, setPerformances] = useState<AcademicPerformance[]>([]);
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<"class" | "subject">("class");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [academicYears, setAcademicYears] = useState<string[]>([]);

  // Helper function to calculate percentage safely
  const safePercentage = (value: number, total: number): string => {
    if (total === 0) return "0.0";
    return ((value / total) * 100).toFixed(1);
  };

  // Load academic years on mount
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

  const loadPerformanceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: {
        viewType: "class" | "subject";
        term?: number;
        academicYear?: string;
      } = {
        viewType: viewType,
      };

      if (selectedTerm) params.term = parseInt(selectedTerm);
      if (selectedYear) params.academicYear = selectedYear;

      const response = await dashboardAPI.getAcademicPerformance(params);

      if (response.success && response.data) {
        // response.data chứa { data: [], summary: {} }
        setPerformances(response.data.data || []);
        setSummary(response.data.summary || null);
      } else {
        setError(response.message || "Không thể tải dữ liệu kết quả học tập");
      }
    } catch (err) {
      console.error("Error loading performance data:", err);
      setError("Không thể tải dữ liệu kết quả học tập");
    } finally {
      setLoading(false);
    }
  }, [viewType, selectedTerm, selectedYear]);

  useEffect(() => {
    loadPerformanceData();
  }, [loadPerformanceData]);

  // Sử dụng summary từ backend, fallback về local calculation nếu chưa có
  const overallStats = summary
    ? {
        totalStudents: summary.totalStudents,
        avgGrade: summary.overallAvgGrade,
        excellent: summary.totalExcellent,
        good: summary.totalGood,
        average: summary.totalAverage,
        belowAvg: summary.totalBelowAverage,
      }
    : performances.reduce(
        (acc, perf) => ({
          totalStudents: acc.totalStudents + perf.totalStudents,
          avgGrade: acc.avgGrade + perf.averageGrade,
          excellent: acc.excellent + perf.excellentCount,
          good: acc.good + perf.goodCount,
          average: acc.average + perf.averageCount,
          belowAvg: acc.belowAvg + perf.belowAverageCount,
        }),
        {
          totalStudents: 0,
          avgGrade: 0,
          excellent: 0,
          good: 0,
          average: 0,
          belowAvg: 0,
        }
      );

  const overallAvgGrade =
    summary?.overallAvgGrade?.toFixed(2) ??
    (performances.length > 0
      ? (overallStats.avgGrade / performances.length).toFixed(2)
      : "0.00");

  const overallPassRate =
    summary?.overallPassRate?.toFixed(1) ??
    (overallStats.totalStudents > 0
      ? (
          ((overallStats.totalStudents - overallStats.belowAvg) /
            overallStats.totalStudents) *
          100
        ).toFixed(1)
      : "0.0");

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
          onClick={loadPerformanceData}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Xem theo
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setViewType("class")}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${
                  viewType === "class"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Theo lớp
              </button>
              <button
                onClick={() => setViewType("subject")}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${
                  viewType === "subject"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Theo môn
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Học kỳ
            </label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả học kỳ</option>
              <option value="1">Học kỳ 1</option>
              <option value="2">Học kỳ 2</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Năm học
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={academicYears.length === 0}
            >
              {academicYears.length === 0 ? (
                <option value="">Đang tải...</option>
              ) : (
                <>
                  <option value="">Tất cả năm học</option>
                  {academicYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <Users size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-gray-600 text-sm font-medium">
                {viewType === "class" ? "Tổng lớp" : "Tổng môn"}
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                {performances.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-green-100">
              <TrendingUp size={24} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-gray-600 text-sm font-medium">Điểm TB</h3>
              <p className="text-2xl font-bold text-gray-900">
                {overallAvgGrade}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-purple-100">
              <Award size={24} className="text-purple-600" />
            </div>
            <div>
              <h3 className="text-gray-600 text-sm font-medium">Tỷ lệ đạt</h3>
              <p className="text-2xl font-bold text-gray-900">
                {overallPassRate}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-orange-100">
              <BarChart3 size={24} className="text-orange-600" />
            </div>
            <div>
              <h3 className="text-gray-600 text-sm font-medium">Xuất sắc</h3>
              <p className="text-2xl font-bold text-gray-900">
                {overallStats.excellent}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Kết quả học tập {viewType === "class" ? "theo lớp" : "theo môn"}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {viewType === "class" ? "Lớp học" : "Môn học"}
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
              {performances.map((perf) => (
                <tr key={perf.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                          viewType === "class" ? "bg-blue-100" : "bg-green-100"
                        }`}
                      >
                        <BookOpen
                          size={20}
                          className={
                            viewType === "class"
                              ? "text-blue-600"
                              : "text-green-600"
                          }
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {perf.name}
                        </div>
                        {perf.code && (
                          <div className="text-sm text-gray-500">
                            {perf.code}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {perf.totalStudents}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                        perf.averageGrade >= 8
                          ? "bg-green-100 text-green-800"
                          : perf.averageGrade >= 6.5
                          ? "bg-blue-100 text-blue-800"
                          : perf.averageGrade >= 5
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {perf.averageGrade.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {perf.excellentCount}
                    </div>
                    <div className="text-xs text-gray-500">
                      {safePercentage(
                        perf.excellentCount,
                        perf.excellentCount +
                          perf.goodCount +
                          perf.averageCount +
                          perf.belowAverageCount
                      )}
                      %
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {perf.goodCount}
                    </div>
                    <div className="text-xs text-gray-500">
                      {safePercentage(
                        perf.goodCount,
                        perf.excellentCount +
                          perf.goodCount +
                          perf.averageCount +
                          perf.belowAverageCount
                      )}
                      %
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {perf.averageCount}
                    </div>
                    <div className="text-xs text-gray-500">
                      {safePercentage(
                        perf.averageCount,
                        perf.excellentCount +
                          perf.goodCount +
                          perf.averageCount +
                          perf.belowAverageCount
                      )}
                      %
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {perf.belowAverageCount}
                    </div>
                    <div className="text-xs text-gray-500">
                      {safePercentage(
                        perf.belowAverageCount,
                        perf.excellentCount +
                          perf.goodCount +
                          perf.averageCount +
                          perf.belowAverageCount
                      )}
                      %
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                        perf.passRate >= 90
                          ? "bg-green-100 text-green-800"
                          : perf.passRate >= 70
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {perf.passRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Phân bố xếp loại
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Xuất sắc (≥8)
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {overallStats.excellent} (
                  {safePercentage(
                    overallStats.excellent,
                    overallStats.totalStudents
                  )}
                  %)
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{
                    width: `${safePercentage(
                      overallStats.excellent,
                      overallStats.totalStudents
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Giỏi (≥6.5)
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {overallStats.good} (
                  {safePercentage(
                    overallStats.good,
                    overallStats.totalStudents
                  )}
                  %)
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{
                    width: `${safePercentage(
                      overallStats.good,
                      overallStats.totalStudents
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Khá (≥5)
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {overallStats.average} (
                  {safePercentage(
                    overallStats.average,
                    overallStats.totalStudents
                  )}
                  %)
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500 transition-all"
                  style={{
                    width: `${safePercentage(
                      overallStats.average,
                      overallStats.totalStudents
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Yếu (&lt;5)
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {overallStats.belowAvg} (
                  {safePercentage(
                    overallStats.belowAvg,
                    overallStats.totalStudents
                  )}
                  %)
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all"
                  style={{
                    width: `${safePercentage(
                      overallStats.belowAvg,
                      overallStats.totalStudents
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top 5 {viewType === "class" ? "lớp" : "môn"} điểm cao nhất
          </h3>
          <div className="space-y-3">
            {performances
              .sort((a, b) => b.averageGrade - a.averageGrade)
              .slice(0, 5)
              .map((perf, index) => (
                <div
                  key={perf.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0
                          ? "bg-yellow-500"
                          : index === 1
                          ? "bg-gray-400"
                          : index === 2
                          ? "bg-orange-500"
                          : "bg-gray-300"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {perf.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {perf.totalStudents} học sinh
                      </div>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    {perf.averageGrade.toFixed(2)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
