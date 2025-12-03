"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import {
  BookOpen,
  BarChart3,
  MessageSquare,
  GraduationCap,
  User,
  FileText,
  LogOut,
  ChevronDown,
} from "lucide-react";
import {
  StudentDashboardOverview,
  StudentClassList,
  StudentGradeView,
} from "@/components/student";
import {
  ForumPage,
  NotificationDropdown,
  ProfilePage,
} from "@/components/common";

type TabType = "dashboard" | "classes" | "grades" | "forum" | "profile";

export default function StudentDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;

    // Check authentication
    if (!isAuthenticated || !user) {
      router.push(ROUTES.LOGIN);
      return;
    }

    // Check if user is student
    if (user.role !== "student") {
      router.push(ROUTES.LOGIN);
      return;
    }
  }, [authLoading, isAuthenticated, user, router]);

  const tabs = [
    { id: "dashboard" as TabType, label: "Tổng quan", icon: BookOpen },
    { id: "classes" as TabType, label: "Lớp học của tôi", icon: GraduationCap },
    { id: "grades" as TabType, label: "Điểm số", icon: BarChart3 },
    { id: "forum" as TabType, label: "Diễn đàn", icon: MessageSquare },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <StudentDashboardOverview />;
      case "classes":
        return (
          <StudentClassList
            onTabChange={(tab) => setActiveTab(tab as TabType)}
          />
        );
      case "grades":
        return <StudentGradeView />;
      case "forum":
        return <ForumPage />;
      case "profile":
        return <ProfilePage />;
      default:
        return null;
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

          {/* Right Side: Notification + User Dropdown */}
          <div className="flex items-center gap-3">
            {/* Notification Dropdown */}
            <NotificationDropdown />

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
              >
                {/* Avatar */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
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
                        setActiveTab("profile");
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
                        router.push("/dashboard/student/my-posts");
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
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                    ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
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
