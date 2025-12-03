"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { userAPI } from "@/lib/apiClient";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Save,
  X,
  Edit2,
  MapPin,
  ArrowLeft,
} from "lucide-react";

interface ProfilePageProps {
  onBack?: () => void;
}

export function ProfilePage({ onBack }: ProfilePageProps) {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    phoneNumber?: string;
    address?: string;
  }>({});

  // Form state - chỉ phoneNumber và address
  const [formData, setFormData] = useState({
    phoneNumber: user?.phoneNumber || "",
    address: user?.address || "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        phoneNumber: user.phoneNumber || "",
        address: user.address || "",
      });
    }
  }, [user]);

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    // Reset form data
    if (user) {
      setFormData({
        phoneNumber: user.phoneNumber || "",
        address: user.address || "",
      });
    }
  };

  const handleSave = async () => {
    // Reset errors
    setErrors({});

    // Validation
    const newErrors: { phoneNumber?: string; address?: string } = {};

    if (
      formData.phoneNumber &&
      !/^[0-9]{10,11}$/.test(formData.phoneNumber.replace(/[\s-]/g, ""))
    ) {
      newErrors.phoneNumber = "Số điện thoại phải có 10-11 chữ số";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);

      // Sử dụng API update profile
      const response = await userAPI.updateProfile({
        phoneNumber: formData.phoneNumber || undefined,
        address: formData.address || undefined,
      });

      if (response.data) {
        // Update user in context
        updateUser(response.data);
        setIsEditing(false);
        alert("Cập nhật thông tin thành công!");
      }
    } catch (err: unknown) {
      console.error("Error updating profile:", err);
      const error = err as {
        response?: {
          data?: {
            errors?: Array<{ field: string; message: string }>;
            message?: string;
          };
        };
      };

      // Handle validation errors from backend
      if (
        error.response?.data?.errors &&
        Array.isArray(error.response.data.errors)
      ) {
        const backendErrors: {
          phoneNumber?: string;
          address?: string;
        } = {};
        error.response.data.errors.forEach(
          (validationError: { field: string; message: string }) => {
            if (validationError.field === "phoneNumber") {
              backendErrors.phoneNumber = validationError.message;
            } else if (validationError.field === "address") {
              backendErrors.address = validationError.message;
            }
          }
        );
        setErrors(backendErrors);
      } else {
        alert(
          error.response?.data?.message ||
            "Không thể cập nhật thông tin. Vui lòng thử lại."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Đang tải thông tin...</p>
      </div>
    );
  }

  // Determine role label and color
  const getRoleInfo = () => {
    switch (user.role) {
      case "student":
        return {
          label: "Học sinh",
          color: "from-blue-500 to-blue-600",
          bgColor: "bg-blue-400",
        };
      case "teacher":
        return {
          label: "Giáo viên",
          color: "from-green-500 to-green-600",
          bgColor: "bg-green-400",
        };
      case "admin":
        return {
          label: "Quản trị viên",
          color: "from-purple-500 to-purple-600",
          bgColor: "bg-purple-400",
        };
      default:
        return {
          label: user.role,
          color: "from-gray-500 to-gray-600",
          bgColor: "bg-gray-400",
        };
    }
  };

  const roleInfo = getRoleInfo();

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Thông tin cá nhân
            </h2>
            <p className="text-gray-600 mt-1">
              Quản lý thông tin tài khoản của bạn
            </p>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Avatar Section */}
        <div className={`bg-gradient-to-r ${roleInfo.color} px-6 py-8`}>
          <div className="flex items-center gap-6">
            <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center">
              <div
                className={`bg-gradient-to-br ${roleInfo.color} text-white rounded-full w-20 h-20 flex items-center justify-center font-bold text-3xl`}
              >
                {user.name?.charAt(0).toUpperCase() || "U"}
              </div>
            </div>
            <div className="text-white">
              <h3 className="text-2xl font-bold">{user.name}</h3>
              <p className="text-white text-opacity-90 mt-1">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Shield className="w-4 h-4" />
                <span
                  className={`text-sm ${roleInfo.bgColor} bg-opacity-50 px-3 py-1 rounded-full`}
                >
                  {roleInfo.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="p-6">
          {/* Edit Button */}
          {!isEditing && (
            <div className="flex justify-end mb-6">
              <button
                onClick={() => setIsEditing(true)}
                className={`px-4 py-2 bg-gradient-to-r ${roleInfo.color} text-white rounded-lg hover:opacity-90 transition flex items-center gap-2`}
              >
                <Edit2 className="w-4 h-4" />
                Chỉnh sửa thông tin
              </button>
            </div>
          )}

          <div className="space-y-6">
            {/* Name Field (Read-only) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Họ và tên
              </label>
              <p className="text-gray-900 text-lg bg-gray-100 px-4 py-3 rounded-lg">
                {user.name}
              </p>
            </div>

            {/* Email Field (Read-only) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <p className="text-gray-900 text-lg bg-gray-100 px-4 py-3 rounded-lg">
                {user.email}
              </p>
            </div>

            {/* Phone Field (Editable) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Số điện thoại
              </label>
              {isEditing ? (
                <>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => {
                      setFormData({ ...formData, phoneNumber: e.target.value });
                      if (errors.phoneNumber) {
                        setErrors({ ...errors, phoneNumber: undefined });
                      }
                    }}
                    placeholder="Nhập số điện thoại"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.phoneNumber
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                    disabled={loading}
                  />
                  {errors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <span>⚠</span>
                      {errors.phoneNumber}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-gray-900 text-lg bg-gray-50 px-4 py-3 rounded-lg">
                  {user.phoneNumber || "Chưa cập nhật"}
                </p>
              )}
            </div>

            {/* Address Field (Editable) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Địa chỉ
              </label>
              {isEditing ? (
                <>
                  <textarea
                    value={formData.address}
                    onChange={(e) => {
                      setFormData({ ...formData, address: e.target.value });
                      if (errors.address) {
                        setErrors({ ...errors, address: undefined });
                      }
                    }}
                    placeholder="Nhập địa chỉ"
                    rows={3}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                      errors.address
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                    disabled={loading}
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <span>⚠</span>
                      {errors.address}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-gray-900 text-lg bg-gray-50 px-4 py-3 rounded-lg whitespace-pre-wrap">
                  {user.address || "Chưa cập nhật"}
                </p>
              )}
            </div>

            {/* Code Field (Read-only) - Show for student/teacher */}
            {(user.role === "student" || user.role === "teacher") &&
              user.code && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Shield className="w-4 h-4 inline mr-2" />
                    {user.role === "student" ? "Mã học sinh" : "Mã giáo viên"}
                  </label>
                  <p className="text-gray-900 text-lg bg-gray-100 px-4 py-3 rounded-lg">
                    {user.code}
                  </p>
                </div>
              )}

            {/* Created Date (Read-only) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Ngày tham gia
              </label>
              <p className="text-gray-900 text-lg bg-gray-100 px-4 py-3 rounded-lg">
                {new Date(user.createdAt).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t">
              <button
                onClick={handleCancel}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                disabled={loading}
              >
                <X className="w-4 h-4 inline mr-2" />
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className={`px-6 py-2.5 bg-gradient-to-r ${roleInfo.color} text-white rounded-lg hover:opacity-90 transition font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
