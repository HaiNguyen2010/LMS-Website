"use client";

import { useState, useEffect } from "react";
import {
  Users,
  BookOpen,
  GraduationCap,
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  Bell,
  Award,
  BarChart3,
  PieChart,
  ClipboardList,
} from "lucide-react";
import { dashboardAPI } from "@/lib/apiClient";
import GradeStatistics from "./GradeStatistics";
import ClassStatistics from "./ClassStatistics";
import TeacherStatistics from "./TeacherStatistics";
import AcademicPerformanceStatistics from "./AcademicPerformanceStatistics";

interface DashboardStats {
  totalUsers: number;
  totalClasses: number;
  totalStudents: number;
  totalTeachers: number;
  totalNotifications: number;
  totalSubjects: number;
  totalLessons: number;
  totalAssignments: number;
  totalSubmissions: number;
  totalGrades: number;
  userGrowth: number;
  classGrowth: number;
  recentActivities: RecentActivity[];
  userDistribution: {
    students: number;
    teachers: number;
    admins: number;
  };
}

interface RecentActivity {
  id: number;
  type: string;
  name: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalClasses: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalNotifications: 0,
    totalSubjects: 0,
    totalLessons: 0,
    totalAssignments: 0,
    totalSubmissions: 0,
    totalGrades: 0,
    userGrowth: 0,
    classGrowth: 0,
    recentActivities: [],
    userDistribution: {
      students: 0,
      teachers: 0,
      admins: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week");
  const [activeTab, setActiveTab] = useState<
    "overview" | "grades" | "classes" | "teachers" | "performance"
  >("overview");

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await dashboardAPI.getAdminStats(timeRange);

      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError("Không thể tải dữ liệu thống kê");
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    growth,
  }: {
    title: string;
    value: number;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    color: string;
    growth?: number;
  }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
        {growth !== undefined && (
          <div
            className={`flex items-center gap-1 text-sm font-semibold ${
              growth >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {growth >= 0 ? (
              <TrendingUp size={16} />
            ) : (
              <TrendingDown size={16} />
            )}
            <span>{Math.abs(growth)}%</span>
          </div>
        )}
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">
        {value.toLocaleString()}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard Quản trị
          </h1>
          <p className="text-gray-600">Tổng quan và thống kê hệ thống LMS</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === "overview"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 size={18} />
                  <span>Tổng quan</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("grades")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === "grades"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Award size={18} />
                  <span>Thống kê điểm</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("classes")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === "classes"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen size={18} />
                  <span>Thống kê lớp học</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("teachers")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === "teachers"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users size={18} />
                  <span>Thống kê giáo viên</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("performance")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === "performance"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} />
                  <span>Kết quả học tập</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" ? (
          <>
            {/* Time Range Filter */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">
                  Thời gian:
                </span>
                <div className="flex gap-2">
                  {[
                    { value: "week", label: "7 ngày" },
                    { value: "month", label: "30 ngày" },
                    { value: "year", label: "1 năm" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setTimeRange(option.value as "week" | "month" | "year")
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        timeRange === option.value
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Tổng số người dùng"
                value={stats.totalUsers}
                icon={Users}
                color="bg-blue-500"
                growth={stats.userGrowth}
              />
              <StatCard
                title="Học sinh"
                value={stats.totalStudents}
                icon={GraduationCap}
                color="bg-green-500"
              />
              <StatCard
                title="Giáo viên"
                value={stats.totalTeachers}
                icon={Award}
                color="bg-purple-500"
              />
              <StatCard
                title="Lớp học"
                value={stats.totalClasses}
                icon={BookOpen}
                color="bg-orange-500"
                growth={stats.classGrowth}
              />
            </div>

            {/* Additional Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Môn học"
                value={stats.totalSubjects}
                icon={BookOpen}
                color="bg-teal-500"
              />
              <StatCard
                title="Bài giảng"
                value={stats.totalLessons}
                icon={FileText}
                color="bg-cyan-500"
              />
              <StatCard
                title="Bài tập"
                value={stats.totalAssignments}
                icon={ClipboardList}
                color="bg-pink-500"
              />
              <StatCard
                title="Bài nộp"
                value={stats.totalSubmissions}
                icon={CheckCircle}
                color="bg-emerald-500"
              />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-yellow-100">
                    <Bell size={24} className="text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 text-sm font-medium">
                      Thông báo
                    </h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalNotifications}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Thông báo đã gửi trong hệ thống
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-indigo-100">
                    <Award size={24} className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 text-sm font-medium">
                      Điểm số
                    </h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalGrades}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Tổng số điểm đã chấm</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-pink-100">
                    <BarChart3 size={24} className="text-pink-600" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 text-sm font-medium">
                      Tỷ lệ học sinh/giáo viên
                    </h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalTeachers > 0
                        ? Math.round(stats.totalStudents / stats.totalTeachers)
                        : 0}
                      :1
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Trung bình{" "}
                  {stats.totalTeachers > 0
                    ? Math.round(stats.totalStudents / stats.totalTeachers)
                    : 0}{" "}
                  học sinh/giáo viên
                </p>
              </div>
            </div>

            {/* Charts and Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Recent Activities */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Clock size={20} className="text-gray-600" />
                    <h2 className="text-lg font-bold text-gray-900">
                      Hoạt động gần đây
                    </h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {stats.recentActivities.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        Chưa có hoạt động nào
                      </p>
                    ) : (
                      stats.recentActivities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0"
                        >
                          <div
                            className={`p-2 rounded-lg ${
                              activity.type === "user"
                                ? "bg-blue-100"
                                : "bg-green-100"
                            }`}
                          >
                            {activity.type === "user" ? (
                              <Users size={16} className="text-blue-600" />
                            ) : (
                              <BookOpen size={16} className="text-green-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">
                              {activity.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(activity.createdAt).toLocaleString(
                                "vi-VN"
                              )}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* User Distribution */}
              <div className="bg-white rounded-lg shadow h-fit">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <PieChart size={20} className="text-gray-600" />
                    <h2 className="text-lg font-bold text-gray-900">
                      Phân bổ người dùng
                    </h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Học sinh
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {stats.userDistribution.students} (
                          {stats.totalUsers > 0
                            ? Math.round(
                                (stats.userDistribution.students /
                                  stats.totalUsers) *
                                  100
                              )
                            : 0}
                          %)
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all"
                          style={{
                            width: `${
                              stats.totalUsers > 0
                                ? (stats.userDistribution.students /
                                    stats.totalUsers) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Giáo viên
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {stats.userDistribution.teachers} (
                          {stats.totalUsers > 0
                            ? Math.round(
                                (stats.userDistribution.teachers /
                                  stats.totalUsers) *
                                  100
                              )
                            : 0}
                          %)
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 transition-all"
                          style={{
                            width: `${
                              stats.totalUsers > 0
                                ? (stats.userDistribution.teachers /
                                    stats.totalUsers) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Quản trị viên
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {stats.userDistribution.admins} (
                          {stats.totalUsers > 0
                            ? Math.round(
                                (stats.userDistribution.admins /
                                  stats.totalUsers) *
                                  100
                              )
                            : 0}
                          %)
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{
                            width: `${
                              stats.totalUsers > 0
                                ? (stats.userDistribution.admins /
                                    stats.totalUsers) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : activeTab === "grades" ? (
          <GradeStatistics />
        ) : activeTab === "classes" ? (
          <ClassStatistics />
        ) : activeTab === "teachers" ? (
          <TeacherStatistics />
        ) : activeTab === "performance" ? (
          <AcademicPerformanceStatistics />
        ) : null}
      </div>
    </div>
  );
}
