"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users,
  School,
  BookOpen,
  ClipboardList,
  BarChart3,
  MessageSquare,
  Bell,
  GraduationCap,
  LogOut,
  UserCheck,
  UserPlus,
  FileText,
  LayoutDashboard,
} from "lucide-react";
import {
  UserManagement,
  ClassManagement,
  SubjectManagement,
  TeacherAssignmentManagement,
  StudentEnrollmentManagement,
  LessonList,
  AssignmentList,
  GradeManagement,
  ForumList,
  NotificationList,
  SubmissionManagement,
} from "@/components/admin";
import AdminDashboard from "@/components/admin/AdminDashboard";

type TabType =
  | "dashboard"
  | "users"
  | "classes"
  | "subjects"
  | "teacherAssignments"
  | "studentEnrollments"
  | "lessons"
  | "assignments"
  | "submissions"
  | "grades"
  | "forum"
  | "notifications";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;

    // Check authentication
    if (!isAuthenticated || !user) {
      router.push(ROUTES.LOGIN);
      return;
    }

    // Check if user is admin
    if (user.role !== "admin") {
      router.push(ROUTES.LOGIN);
      return;
    }
  }, [authLoading, isAuthenticated, user, router]);

  const tabs = [
    { id: "dashboard" as TabType, label: "Tổng quan", icon: LayoutDashboard },
    { id: "users" as TabType, label: "Người dùng", icon: Users },
    { id: "classes" as TabType, label: "Lớp học", icon: School },
    { id: "subjects" as TabType, label: "Môn học", icon: BookOpen },
    {
      id: "teacherAssignments" as TabType,
      label: "Phân công GV",
      icon: UserCheck,
    },
    {
      id: "studentEnrollments" as TabType,
      label: "Đăng ký HS",
      icon: UserPlus,
    },
    { id: "lessons" as TabType, label: "Bài giảng", icon: GraduationCap },
    { id: "assignments" as TabType, label: "Bài tập", icon: ClipboardList },
    { id: "submissions" as TabType, label: "Bài nộp", icon: FileText },
    { id: "grades" as TabType, label: "Điểm số", icon: BarChart3 },
    { id: "forum" as TabType, label: "Diễn đàn", icon: MessageSquare },
    { id: "notifications" as TabType, label: "Thông báo", icon: Bell },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <AdminDashboard />;
      case "users":
        return <UserManagement />;
      case "classes":
        return <ClassManagement />;
      case "subjects":
        return <SubjectManagement />;
      case "teacherAssignments":
        return <TeacherAssignmentManagement />;
      case "studentEnrollments":
        return <StudentEnrollmentManagement />;
      case "lessons":
        return <LessonList />;
      case "assignments":
        return <AssignmentList />;
      case "submissions":
        return <SubmissionManagement />;
      case "grades":
        return <GradeManagement />;
      case "forum":
        return <ForumList showAllPosts={true} />; // Show all posts for admin
      case "notifications":
        return <NotificationList />;
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
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <GraduationCap size={32} className="text-blue-600" />
            <span>Trường THCS Trần Phú</span>
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              Xin chào, <strong>{user?.name}</strong>
            </span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 inline-flex items-center gap-2"
            >
              <LogOut size={18} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6 overflow-x-auto">
          <div className="flex border-b">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-b-2 border-blue-500 text-blue-600"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  <IconComponent size={20} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
