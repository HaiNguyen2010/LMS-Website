"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import AdminDashboard from "@/components/admin/AdminDashboard";
import TeacherDashboard from "@/components/admin/TeacherDashboard";
import StudentDashboard from "@/components/admin/StudentDashboard";
import { RouteGuard } from "@/components/auth/RouteGuard";

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderDashboardByRole = () => {
    switch (user.role) {
      case "admin":
        return <AdminDashboard />;
      case "teacher":
        return <TeacherDashboard />;
      case "student":
        return <StudentDashboard />;
      default:
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Vai trò không hợp lệ
              </h2>
              <p className="text-gray-600">
                Vui lòng liên hệ quản trị viên để được hỗ trợ.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <RouteGuard allowedRoles={["admin", "teacher", "student"]}>
      {renderDashboardByRole()}
    </RouteGuard>
  );
};

export default DashboardPage;
