"use client";

import { useState, useEffect } from "react";
import { notificationAPI, classAPI } from "@/lib/apiClient";
import type { Notification, Class, CreateNotificationData } from "@/types";
import {
  Bell,
  BellOff,
  Plus,
  X,
  Edit,
  Trash2,
  Eye,
  Filter,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Users,
  School,
} from "lucide-react";

export function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingNotification, setEditingNotification] =
    useState<Notification | null>(null);
  const [deletingNotification, setDeletingNotification] =
    useState<Notification | null>(null);
  const [viewingNotification, setViewingNotification] =
    useState<Notification | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "announcement" as
      | "announcement"
      | "assignment"
      | "grade"
      | "forum"
      | "system"
      | "reminder",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    receiverRole: "all" as "student" | "teacher" | "admin" | "all",
    classId: "",
    expiresAt: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    type: "",
    priority: "",
    isRead: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [notificationsRes, classesRes] = await Promise.all([
        notificationAPI.getAll({ page: 1, limit: 100 }),
        classAPI.getAll({ page: 1, limit: 100 }),
      ]);

      console.log("Notifications response:", notificationsRes);
      console.log("Notifications data:", notificationsRes.data);

      setNotifications(notificationsRes.data?.notifications || []);
      setClasses(classesRes.data?.classes || classesRes.data?.items || []);
    } catch (err) {
      setError("Không thể tải dữ liệu thông báo");
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      type: "announcement",
      priority: "medium",
      receiverRole: "all",
      classId: "",
      expiresAt: "",
    });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = "Vui lòng nhập tiêu đề";
    }
    if (!formData.message.trim()) {
      errors.message = "Vui lòng nhập nội dung";
    }
    if (formData.receiverRole !== "all" && !formData.classId) {
      errors.classId = "Vui lòng chọn lớp học";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateClick = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleEditClick = (notification: Notification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      message: notification.message,
      type: notification.type || "announcement",
      priority: notification.priority || "medium",
      receiverRole: notification.receiverRole || "all",
      classId: notification.classId?.toString() || "",
      expiresAt: notification.expiresAt
        ? new Date(notification.expiresAt).toISOString().split("T")[0]
        : "",
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleDeleteClick = (notification: Notification) => {
    setDeletingNotification(notification);
    setShowDeleteModal(true);
  };

  const handleViewClick = (notification: Notification) => {
    setViewingNotification(notification);
    setShowDetailModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitLoading(true);
    try {
      const submitData: CreateNotificationData = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type,
        priority: formData.priority,
        receiverRole: formData.receiverRole,
      };

      if (formData.receiverRole !== "all" && formData.classId) {
        submitData.classId = parseInt(formData.classId);
      }

      if (formData.expiresAt) {
        submitData.expiresAt = formData.expiresAt;
      }

      if (editingNotification) {
        await notificationAPI.update(editingNotification.id, submitData);
      } else {
        await notificationAPI.create(submitData);
      }

      await loadData();
      setShowCreateModal(false);
      setShowEditModal(false);
      resetForm();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setFormErrors({ submit: error.message || "Có lỗi xảy ra" });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingNotification) return;

    setSubmitLoading(true);
    try {
      await notificationAPI.delete(deletingNotification.id);
      await loadData();
      setShowDeleteModal(false);
      setDeletingNotification(null);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setFormErrors({ submit: error.message || "Có lỗi xảy ra khi xóa" });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      await loadData();
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case "success":
        return <CheckCircle size={20} />;
      case "warning":
        return <AlertTriangle size={20} />;
      case "error":
        return <AlertCircle size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case "success":
        return "text-green-600 bg-green-50 border-green-200";
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "error":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case "high":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
            Cao
          </span>
        );
      case "low":
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
            Thấp
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
            Trung bình
          </span>
        );
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    if (filters.type && notification.type !== filters.type) return false;
    if (filters.priority && notification.priority !== filters.priority)
      return false;
    if (filters.isRead === "true" && !notification.isRead) return false;
    if (filters.isRead === "false" && notification.isRead) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-600">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={loadData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Quản lý thông báo
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Tổng số: {notifications.length} thông báo
          </p>
        </div>
        <button
          onClick={handleCreateClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2"
        >
          <Plus size={20} />
          Tạo thông báo
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Filter size={18} />
          <span>Bộ lọc</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại thông báo
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value="info">Thông tin</option>
              <option value="success">Thành công</option>
              <option value="warning">Cảnh báo</option>
              <option value="error">Lỗi</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mức độ ưu tiên
            </label>
            <select
              value={filters.priority}
              onChange={(e) =>
                setFilters({ ...filters, priority: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={filters.isRead}
              onChange={(e) =>
                setFilters({ ...filters, isRead: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value="false">Chưa đọc</option>
              <option value="true">Đã đọc</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <Bell size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Không có thông báo nào
            </h3>
            <p className="text-gray-500 mb-4">
              {filters.type || filters.priority || filters.isRead
                ? "Thử thay đổi bộ lọc để xem kết quả khác"
                : "Hãy tạo thông báo đầu tiên"}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`border rounded-lg p-4 ${
                notification.isRead ? "bg-white" : "bg-blue-50 border-blue-200"
              } ${getTypeColor(notification.type)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">{getTypeIcon(notification.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {notification.title}
                      </h3>
                      {getPriorityBadge(notification.priority)}
                      {!notification.isRead && (
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded">
                          Mới
                        </span>
                      )}
                    </div>

                    <p className="text-gray-700 mb-3 line-clamp-2">
                      {notification.message}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>
                          {new Date(notification.createdAt).toLocaleDateString(
                            "vi-VN"
                          )}
                        </span>
                      </div>

                      {notification.receiverRole === "student" && (
                        <div className="flex items-center gap-1">
                          <Users size={14} />
                          <span>Học sinh</span>
                        </div>
                      )}

                      {notification.receiverRole === "teacher" && (
                        <div className="flex items-center gap-1">
                          <Users size={14} />
                          <span>Giáo viên</span>
                        </div>
                      )}

                      {notification.receiverRole === "admin" && (
                        <div className="flex items-center gap-1">
                          <Users size={14} />
                          <span>Quản trị viên</span>
                        </div>
                      )}

                      {notification.receiverRole === "all" && (
                        <div className="flex items-center gap-1">
                          <Users size={14} />
                          <span>Tất cả người dùng</span>
                        </div>
                      )}

                      {notification.classId && notification.class && (
                        <div className="flex items-center gap-1">
                          <School size={14} />
                          <span>{notification.class.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="p-2 hover:bg-green-100 text-green-600 rounded-lg transition"
                      title="Đánh dấu đã đọc"
                    >
                      <BellOff size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => handleViewClick(notification)}
                    className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition"
                    title="Xem chi tiết"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => handleEditClick(notification)}
                    className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                    title="Chỉnh sửa"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(notification)}
                    className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition"
                    title="Xóa"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {editingNotification
                  ? "Chỉnh sửa thông báo"
                  : "Tạo thông báo mới"}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setEditingNotification(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.title ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Nhập tiêu đề thông báo..."
                />
                {formErrors.title && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nội dung <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.message ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Nhập nội dung thông báo..."
                />
                {formErrors.message && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại thông báo
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as
                          | "announcement"
                          | "assignment"
                          | "grade"
                          | "forum"
                          | "system"
                          | "reminder",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="announcement">Thông báo</option>
                    <option value="assignment">Bài tập</option>
                    <option value="grade">Điểm số</option>
                    <option value="forum">Diễn đàn</option>
                    <option value="system">Hệ thống</option>
                    <option value="reminder">Nhắc nhở</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mức độ ưu tiên
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: e.target.value as "low" | "medium" | "high",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đối tượng nhận
                </label>
                <select
                  value={formData.receiverRole}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      receiverRole: e.target.value as
                        | "all"
                        | "student"
                        | "teacher"
                        | "admin",
                      classId: "",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tất cả người dùng</option>
                  <option value="student">Học sinh</option>
                  <option value="teacher">Giáo viên</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </div>

              {formData.receiverRole !== "all" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chọn lớp học (tùy chọn)
                  </label>
                  <select
                    value={formData.classId}
                    onChange={(e) =>
                      setFormData({ ...formData, classId: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.classId ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">-- Tất cả lớp --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.code})
                      </option>
                    ))}
                  </select>
                  {formErrors.classId && (
                    <p className="mt-1 text-sm text-red-500">
                      {formErrors.classId}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày hết hạn (tùy chọn)
                </label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) =>
                    setFormData({ ...formData, expiresAt: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {formErrors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{formErrors.submit}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setEditingNotification(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {submitLoading
                    ? "Đang xử lý..."
                    : editingNotification
                    ? "Cập nhật"
                    : "Tạo thông báo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && viewingNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                Chi tiết thông báo
              </h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setViewingNotification(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {viewingNotification.title}
                  </h4>
                  {getPriorityBadge(viewingNotification.priority)}
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {viewingNotification.message}
                </p>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-700">Loại:</span>
                  <span className="text-gray-600">
                    {viewingNotification.type === "announcement"
                      ? "Thông báo"
                      : viewingNotification.type === "assignment"
                      ? "Bài tập"
                      : viewingNotification.type === "grade"
                      ? "Điểm số"
                      : viewingNotification.type === "forum"
                      ? "Diễn đàn"
                      : viewingNotification.type === "system"
                      ? "Hệ thống"
                      : "Nhắc nhở"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-700">Đối tượng:</span>
                  <span className="text-gray-600">
                    {viewingNotification.receiverRole === "all"
                      ? "Tất cả người dùng"
                      : viewingNotification.receiverRole === "student"
                      ? "Học sinh"
                      : viewingNotification.receiverRole === "teacher"
                      ? "Giáo viên"
                      : "Quản trị viên"}
                    {viewingNotification.classId &&
                      viewingNotification.class &&
                      ` - Lớp: ${viewingNotification.class.name}`}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-700">Ngày tạo:</span>
                  <span className="text-gray-600">
                    {new Date(viewingNotification.createdAt).toLocaleString(
                      "vi-VN"
                    )}
                  </span>
                </div>

                {viewingNotification.expiresAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-700">Hết hạn:</span>
                    <span className="text-gray-600">
                      {new Date(viewingNotification.expiresAt).toLocaleString(
                        "vi-VN"
                      )}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-700">Trạng thái:</span>
                  <span
                    className={`${
                      viewingNotification.isRead
                        ? "text-gray-600"
                        : "text-blue-600 font-semibold"
                    }`}
                  >
                    {viewingNotification.isRead ? "Đã đọc" : "Chưa đọc"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setViewingNotification(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-red-600">Xác nhận xóa</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingNotification(null);
                  setFormErrors({});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Bạn có chắc chắn muốn xóa thông báo này?
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {deletingNotification.title}
                </h4>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {deletingNotification.message}
                </p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Lưu ý:</strong> Hành động này không thể hoàn tác.
                </p>
              </div>
            </div>

            {formErrors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-600">{formErrors.submit}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingNotification(null);
                  setFormErrors({});
                }}
                disabled={submitLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={submitLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                {submitLoading ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
