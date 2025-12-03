"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import {
  BookOpen,
  LogOut,
  ChevronDown,
  User,
  GraduationCap,
  MessageSquare,
  FileText,
  ClipboardCheck,
  BarChart3,
} from "lucide-react";
import {
  TeacherClassList,
  TeacherClassDetail,
  TeacherDashboardOverview,
  TeacherSubmissionManagement,
  TeacherGradeManagement,
  TeacherGradeStatistics,
} from "@/components/teacher";
import {
  NotificationDropdown,
  ProfilePage,
  ForumPage,
} from "@/components/common";
import type { Class } from "@/types";

type TabType = "dashboard" | "classes" | "forum" | "submissions" | "grades" | "statistics";

export default function TeacherDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;

    // Check authentication
    if (!isAuthenticated || !user) {
      router.push(ROUTES.LOGIN);
      return;
    }

    // Check if user is teacher
    if (user.role !== "teacher") {
      router.push(ROUTES.LOGIN);
      return;
    }
  }, [authLoading, isAuthenticated, user, router]);

  const tabs = [
    { id: "dashboard" as TabType, label: "Tổng quan", icon: BookOpen },
    { id: "classes" as TabType, label: "Lớp học của tôi", icon: GraduationCap },
    {
      id: "submissions" as TabType,
      label: "Quản lý bài nộp",
      icon: ClipboardCheck,
    },
    { id: "grades" as TabType, label: "Quản lý điểm", icon: FileText },
    { id: "statistics" as TabType, label: "Thống kê điểm", icon: BarChart3 },
    { id: "forum" as TabType, label: "Diễn đàn", icon: MessageSquare },
  ];

  const renderContent = () => {
    // Show profile page if active
    if (showProfile) {
      return <ProfilePage onBack={() => setShowProfile(false)} />;
    }

    if (selectedClass) {
      return (
        <TeacherClassDetail
          classData={selectedClass}
          onBack={() => setSelectedClass(null)}
        />
      );
    }

    switch (activeTab) {
      case "dashboard":
        return <TeacherDashboardOverview />;
      case "classes":
        return <TeacherClassList onSelectClass={setSelectedClass} />;
      case "submissions":
        return <TeacherSubmissionManagement />;
      case "grades":
        return <TeacherGradeManagement />;
      case "statistics":
        return <TeacherGradeStatistics />;
      case "forum":
        return <ForumPage />;
      default:
        return <TeacherDashboardOverview />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Trường THCS Trần Phú
          </h1>

          {/* Right side: Notifications + User Dropdown */}
          <div className="flex items-center gap-4">
            {/* Notification Icon */}
            <NotificationDropdown />

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
              >
                {/* Avatar */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
                  {user?.name?.charAt(0).toUpperCase() || "T"}
                </div>

                {/* User Info */}
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-semibold text-gray-900">
                    {user?.name}
                  </div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>

                {/* Chevron */}
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    showUserMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  {/* Overlay to close dropdown when clicking outside */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />

                  {/* Menu Items */}
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                    {/* User Info in Dropdown (mobile) */}
                    <div className="px-4 py-3 border-b sm:hidden">
                      <div className="text-sm font-semibold text-gray-900">
                        {user?.name}
                      </div>
                      <div className="text-xs text-gray-500">{user?.email}</div>
                    </div>

                    {/* Menu Item: Thông tin cá nhân */}
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowProfile(true);
                        setSelectedClass(null);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition flex items-center gap-3 text-gray-700"
                    >
                      <User className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className="font-medium">Thông tin cá nhân</div>
                        <div className="text-xs text-gray-500">
                          Xem và chỉnh sửa hồ sơ
                        </div>
                      </div>
                    </button>

                    {/* Menu Item: Bài viết của tôi */}
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push("/dashboard/teacher/my-posts");
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition flex items-center gap-3 text-gray-700"
                    >
                      <FileText className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className="font-medium">Bài viết của tôi</div>
                        <div className="text-xs text-gray-500">
                          Quản lý bài viết diễn đàn
                        </div>
                      </div>
                    </button>

                    {/* Divider */}
                    <div className="border-t my-2" />

                    {/* Menu Item: Đăng xuất */}
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-red-50 transition flex items-center gap-3 text-red-600"
                    >
                      <LogOut className="w-5 h-5" />
                      <div>
                        <div className="font-medium">Đăng xuất</div>
                        <div className="text-xs text-red-500">
                          Thoát khỏi tài khoản
                        </div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSelectedClass(null); // Reset selected class when changing tabs
                    setShowProfile(false); // Reset profile view when changing tabs
                  }}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                    ${
                      activeTab === tab.id && !selectedClass && !showProfile
                        ? "border-green-500 text-green-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
}
