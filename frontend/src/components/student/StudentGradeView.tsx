"use client";

import { useEffect, useState } from "react";
import { gradeAPI } from "@/lib/apiClient";
import type { Grade } from "@/types";
import {
  Award,
  BookOpen,
  Calendar,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SubjectGrades {
  [subjectName: string]: Grade[];
}

interface YearGrades {
  [academicYear: string]: Grade[];
}

interface SubjectStats {
  average: number;
  weightedAverage: number;
  count: number;
  highest: number;
  lowest: number;
}

export function StudentGradeView() {
  const { user } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTerm, setFilterTerm] = useState<"all" | "1" | "2">("all");
  const [expandedYears, setExpandedYears] = useState<{
    [key: string]: boolean;
  }>({});
  const [expandedSubjects, setExpandedSubjects] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    if (user?.id) {
      loadGrades(user.id);
    }
  }, [user]);

  const loadGrades = async (studentId: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await gradeAPI.getByStudentId(studentId, {
        page: 1,
        limit: 100,
      });
      console.log("Grades Response:", response); // Debug log

      // API trả về { grades, averages, pagination }
      let gradeData: Grade[] = [];

      if (Array.isArray(response.data)) {
        gradeData = response.data;
      } else if (
        response.data &&
        typeof response.data === "object" &&
        "grades" in response.data
      ) {
        gradeData = (response.data as { grades: Grade[] }).grades;
      }

      console.log("Grade Data:", gradeData); // Debug log
      setGrades(gradeData);
    } catch (err) {
      console.error("Error loading grades:", err);
      setError("Không thể tải danh sách điểm");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredGrades = () => {
    if (filterTerm === "all") return grades;
    return grades.filter((grade) => grade.term === filterTerm);
  };

  const calculateSubjectStats = (subjectGrades: Grade[]): SubjectStats => {
    if (subjectGrades.length === 0) {
      return {
        average: 0,
        weightedAverage: 0,
        count: 0,
        highest: 0,
        lowest: 0,
      };
    }

    // gradeValue là string từ API, cần parse sang number
    const values = subjectGrades.map((g) =>
      parseFloat(g.gradeValue.toString())
    );
    const sum = values.reduce((acc, val) => acc + val, 0);

    // Tính điểm trung bình có trọng số
    let totalWeightedGrade = 0;
    let totalWeight = 0;
    subjectGrades.forEach((g) => {
      const gradeValue = parseFloat(g.gradeValue.toString());
      const weight = parseFloat(g.weight?.toString() || "1");
      totalWeightedGrade += gradeValue * weight;
      totalWeight += weight;
    });

    return {
      average: parseFloat((sum / values.length).toFixed(2)),
      weightedAverage: parseFloat(
        (totalWeightedGrade / totalWeight).toFixed(2)
      ),
      count: values.length,
      highest: Math.max(...values),
      lowest: Math.min(...values),
    };
  };

  const toggleYear = (year: string) => {
    setExpandedYears((prev) => ({
      ...prev,
      [year]: !prev[year],
    }));
  };

  const toggleSubject = (key: string) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getGradesByYear = (): YearGrades => {
    const filtered = getFilteredGrades();
    return filtered.reduce((acc: YearGrades, grade) => {
      const year = grade.academicYear || "N/A";
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(grade);
      return acc;
    }, {});
  };

  const getSubjectsByYear = (yearGrades: Grade[]): SubjectGrades => {
    return yearGrades.reduce((acc: SubjectGrades, grade) => {
      const subjectName = grade.gradeSubject?.name || "N/A";
      if (!acc[subjectName]) {
        acc[subjectName] = [];
      }
      acc[subjectName].push(grade);
      return acc;
    }, {});
  };

  const calculateYearStats = (yearGrades: Grade[]) => {
    if (yearGrades.length === 0) {
      return { average: 0, weightedAverage: 0, count: 0 };
    }

    const values = yearGrades.map((g) => parseFloat(g.gradeValue.toString()));
    const sum = values.reduce((a, b) => a + b, 0);

    let totalWeightedGrade = 0;
    let totalWeight = 0;
    yearGrades.forEach((g) => {
      const gradeValue = parseFloat(g.gradeValue.toString());
      const weight = parseFloat(g.weight?.toString() || "1");
      totalWeightedGrade += gradeValue * weight;
      totalWeight += weight;
    });

    return {
      average: parseFloat((sum / values.length).toFixed(2)),
      weightedAverage: parseFloat(
        (totalWeightedGrade / totalWeight).toFixed(2)
      ),
      count: values.length,
    };
  };

  const getOverallAverage = () => {
    // Tính điểm trung bình tích lũy từ TẤT CẢ các năm học (không phụ thuộc filter)
    if (grades.length === 0) return "--";
    // gradeValue là string từ API, cần parse sang number
    const sum = grades.reduce(
      (acc, grade) => acc + parseFloat(grade.gradeValue.toString()),
      0
    );
    return (sum / grades.length).toFixed(2);
  };

  const getCurrentTermAverage = () => {
    // Lấy năm học gần nhất từ dữ liệu có sẵn
    if (grades.length === 0) return "--";

    // Tìm năm học mới nhất trong database
    const years = grades
      .map((g) => g.academicYear)
      .filter((y) => y) // Loại bỏ null/undefined
      .sort((a, b) => b.localeCompare(a)); // Sắp xếp giảm dần

    if (years.length === 0) return "--";

    const latestYear = years[0]; // Lấy năm học mới nhất

    // Lọc tất cả điểm của năm học mới nhất (cả HK1 và HK2)
    const latestYearGrades = grades.filter(
      (grade) => grade.academicYear === latestYear
    );

    if (latestYearGrades.length === 0) return "--";

    const sum = latestYearGrades.reduce(
      (acc, grade) => acc + parseFloat(grade.gradeValue.toString()),
      0
    );
    return (sum / latestYearGrades.length).toFixed(2);
  };

  const getGradeTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      homework: "Bài tập",
      quiz: "Kiểm tra",
      midterm: "Giữa kỳ",
      final: "Cuối kỳ",
      assignment: "Bài tập lớn",
      participation: "Tham gia",
    };
    return labels[type] || type;
  };

  const getGradeColor = (value: number) => {
    if (value >= 8) return "text-green-600 bg-green-50";
    if (value >= 6.5) return "text-blue-600 bg-blue-50";
    if (value >= 5) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getTermLabel = (term: string) => {
    if (term === "1") return "Học kỳ 1";
    if (term === "2") return "Học kỳ 2";
    return "Cuối năm";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải điểm số...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 text-xl mb-2">⚠️</div>
        <p className="text-red-700 font-medium">{error}</p>
        <button
          onClick={() => user?.id && loadGrades(user.id)}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const gradesByYear = getGradesByYear();
  const overallAverage = getOverallAverage();
  const currentTermAverage = getCurrentTermAverage();

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Điểm số của tôi</h2>
        <p className="text-gray-600 mt-1">Xem điểm số và thành tích học tập</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Điểm TB năm học hiện tại</p>
              <p className="text-3xl font-bold mt-1">{currentTermAverage}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-full">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Điểm trung bình tích lũy</p>
              <p className="text-3xl font-bold mt-1">{overallAverage}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-full">
              <Award className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Năm học</p>
              <p className="text-3xl font-bold mt-1">
                {Object.keys(gradesByYear).length}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-full">
              <BookOpen className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Term Filter */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilterTerm("all")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterTerm === "all"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Tất cả
        </button>
        <button
          onClick={() => setFilterTerm("1")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterTerm === "1"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Học kỳ 1
        </button>
        <button
          onClick={() => setFilterTerm("2")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterTerm === "2"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Học kỳ 2
        </button>
      </div>

      {/* Grades by Year and Subject */}
      {Object.keys(gradesByYear).length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Chưa có điểm nào
          </h3>
          <p className="text-gray-500">
            {filterTerm === "all"
              ? "Bạn chưa có điểm nào được ghi nhận"
              : `Chưa có điểm nào trong ${getTermLabel(filterTerm)}`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(gradesByYear)
            .sort(([yearA], [yearB]) => yearB.localeCompare(yearA))
            .map(([year, yearGrades]) => {
              const yearStats = calculateYearStats(yearGrades);
              const isYearExpanded = expandedYears[year] !== false;
              const subjectsByYear = getSubjectsByYear(yearGrades);

              return (
                <div
                  key={year}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  {/* Year Header */}
                  <div
                    onClick={() => toggleYear(year)}
                    className="flex items-center justify-between p-5 bg-gradient-to-r from-indigo-50 to-blue-50 cursor-pointer hover:from-indigo-100 hover:to-blue-100 transition border-b-2 border-indigo-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-500 text-white rounded-lg p-2">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          Năm học {year}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {Object.keys(subjectsByYear).length} môn học •{" "}
                          {yearStats.count} điểm
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">
                          Điểm TB năm
                        </div>
                        <div
                          className={`text-2xl font-bold ${
                            yearStats.average >= 8
                              ? "text-green-600"
                              : yearStats.average >= 6.5
                              ? "text-blue-600"
                              : yearStats.average >= 5
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {yearStats.average}
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        {isYearExpanded ? (
                          <ChevronUp className="w-6 h-6" />
                        ) : (
                          <ChevronDown className="w-6 h-6" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Subjects in Year */}
                  {isYearExpanded && (
                    <div className="p-4 space-y-3 bg-gray-50">
                      {Object.entries(subjectsByYear).map(
                        ([subjectName, subjectGrades]) => {
                          const stats = calculateSubjectStats(subjectGrades);
                          const subjectKey = `${year}-${subjectName}`;
                          const isSubjectExpanded =
                            expandedSubjects[subjectKey] !== false;

                          return (
                            <div
                              key={subjectKey}
                              className="bg-white rounded-lg shadow overflow-hidden"
                            >
                              {/* Subject Header */}
                              <div
                                onClick={() => toggleSubject(subjectKey)}
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="bg-blue-100 p-2 rounded-lg">
                                    <BookOpen className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-gray-900">
                                      {subjectName}
                                    </h4>
                                    <p className="text-xs text-gray-600">
                                      {stats.count} điểm
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <div className="text-xs text-gray-500">
                                      TB tích lũy
                                    </div>
                                    <div
                                      className={`text-xl font-bold ${
                                        stats.weightedAverage >= 8
                                          ? "text-green-600"
                                          : stats.weightedAverage >= 6.5
                                          ? "text-blue-600"
                                          : stats.weightedAverage >= 5
                                          ? "text-yellow-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      {stats.weightedAverage}
                                    </div>
                                  </div>
                                  <button className="text-gray-400 hover:text-gray-600">
                                    {isSubjectExpanded ? (
                                      <ChevronUp className="w-5 h-5" />
                                    ) : (
                                      <ChevronDown className="w-5 h-5" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* Subject Details */}
                              {isSubjectExpanded && (
                                <div className="border-t">
                                  {/* Grade List */}
                                  <div className="p-4 space-y-2">
                                    {subjectGrades.map((grade) => (
                                      <div
                                        key={grade.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                                      >
                                        <div className="flex items-center gap-3">
                                          <span
                                            className={`px-3 py-1 rounded-full text-sm font-bold ${getGradeColor(
                                              typeof grade.gradeValue ===
                                                "string"
                                                ? parseFloat(grade.gradeValue)
                                                : grade.gradeValue
                                            )}`}
                                          >
                                            {typeof grade.gradeValue ===
                                            "string"
                                              ? parseFloat(
                                                  grade.gradeValue
                                                ).toFixed(2)
                                              : grade.gradeValue.toFixed(2)}
                                          </span>
                                          <div>
                                            <div className="font-medium text-gray-900">
                                              {getGradeTypeLabel(
                                                grade.gradeType
                                              )}
                                            </div>
                                            <div className="text-xs text-gray-600">
                                              {getTermLabel(grade.term)} •{" "}
                                              {grade.academicYear || "N/A"}
                                              {grade.weight && (
                                                <span className="ml-2">
                                                  • Trọng số:{" "}
                                                  {typeof grade.weight ===
                                                  "string"
                                                    ? parseFloat(grade.weight)
                                                    : grade.weight}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="flex items-center text-sm text-gray-600">
                                            <Calendar className="w-4 h-4 mr-1" />
                                            {new Date(
                                              grade.recordedAt
                                            ).toLocaleDateString("vi-VN")}
                                          </div>
                                          {grade.remarks && (
                                            <div className="text-xs text-gray-500 mt-1">
                                              {grade.remarks}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
