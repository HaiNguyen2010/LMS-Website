"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { notificationAPI } from "@/lib/apiClient";
import { Notification, NotificationType, NotificationPriority } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Bell,
  Check,
  CheckCheck,
  Filter,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

export function Notifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [filterType, setFilterType] = useState<NotificationType | "all">("all");
  const [filterPriority, setFilterPriority] = useState<
    NotificationPriority | "all"
  >("all");
  const [filterUnread, setFilterUnread] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const itemsPerPage = 20;

  const fetchNotifications = React.useCallback(async () => {
    try {
      setLoading(true);
      const params: {
        page: number;
        limit: number;
        type?: NotificationType;
        priority?: NotificationPriority;
        unreadOnly?: boolean;
      } = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (filterType !== "all") params.type = filterType;
      if (filterPriority !== "all") params.priority = filterPriority;
      if (filterUnread) params.unreadOnly = true;

      const response = await notificationAPI.getMy(params);
      setNotifications(response.data?.notifications || []);
      setTotalPages(response.data?.pagination.totalPages || 1);
      setTotalItems(response.data?.pagination.totalItems || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterType, filterPriority, filterUnread]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "announcement":
        return "📢";
      case "assignment":
        return "📝";
      case "grade":
        return "📊";
      case "forum":
        return "💬";
      case "reminder":
        return "⏰";
      case "system":
        return "⚙️";
      default:
        return "🔔";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
            <AlertCircle className="w-3 h-3" />
            Khẩn cấp
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded">
            Quan trọng
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">
            Trung bình
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      announcement: "Thông báo",
      assignment: "Bài tập",
      grade: "Điểm số",
      forum: "Diễn đàn",
      reminder: "Nhắc nhở",
      system: "Hệ thống",
    };
    return labels[type] || type;
  };

  const resetFilters = () => {
    setFilterType("all");
    setFilterPriority("all");
    setFilterUnread(false);
    setCurrentPage(1);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading && currentPage === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Bell className="w-6 h-6" />
                  Tất cả thông báo
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {totalItems} thông báo
                  {unreadCount > 0 && (
                    <span className="text-blue-600 font-medium">
                      {" "}
                      • {unreadCount} chưa đọc
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg border transition flex items-center gap-2 ${
                  showFilters
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Filter className="w-4 h-4" />
                Bộ lọc
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <CheckCheck className="w-4 h-4" />
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại thông báo
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => {
                      setFilterType(e.target.value as NotificationType | "all");
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Tất cả</option>
                    <option value="announcement">Thông báo</option>
                    <option value="assignment">Bài tập</option>
                    <option value="grade">Điểm số</option>
                    <option value="forum">Diễn đàn</option>
                    <option value="reminder">Nhắc nhở</option>
                    <option value="system">Hệ thống</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Độ ưu tiên
                  </label>
                  <select
                    value={filterPriority}
                    onChange={(e) => {
                      setFilterPriority(
                        e.target.value as NotificationPriority | "all"
                      );
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Tất cả</option>
                    <option value="urgent">Khẩn cấp</option>
                    <option value="high">Quan trọng</option>
                    <option value="medium">Trung bình</option>
                    <option value="low">Thấp</option>
                  </select>
                </div>

                {/* Unread Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái
                  </label>
                  <label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={filterUnread}
                      onChange={(e) => {
                        setFilterUnread(e.target.checked);
                        setCurrentPage(1);
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Chỉ hiện chưa đọc
                    </span>
                  </label>
                </div>
              </div>

              {/* Reset Filters */}
              {(filterType !== "all" ||
                filterPriority !== "all" ||
                filterUnread) && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={resetFilters}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không có thông báo
            </h3>
            <p className="text-gray-500">
              {filterUnread || filterType !== "all" || filterPriority !== "all"
                ? "Không tìm thấy thông báo phù hợp với bộ lọc"
                : "Bạn chưa có thông báo nào"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow hover:shadow-md transition p-6 ${
                  !notification.isRead ? "border-l-4 border-blue-500" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="text-3xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h3
                          className={`text-lg font-semibold ${
                            !notification.isRead
                              ? "text-gray-900"
                              : "text-gray-600"
                          }`}
                        >
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                            {getTypeLabel(notification.type)}
                          </span>
                          {getPriorityBadge(notification.priority)}
                          {!notification.isRead && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              Chưa đọc
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Mark as Read Button */}
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition flex-shrink-0"
                          title="Đánh dấu đã đọc"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                      {notification.message}
                    </p>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </span>
                      {notification.sender && (
                        <>
                          <span>•</span>
                          <span>Từ: {notification.sender.name}</span>
                        </>
                      )}
                      {notification.class && (
                        <>
                          <span>•</span>
                          <span>Lớp: {notification.class.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Trước
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg transition ${
                      currentPage === pageNum
                        ? "bg-blue-600 text-white"
                        : "border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
