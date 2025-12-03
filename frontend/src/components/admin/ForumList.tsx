"use client";

import { useState, useEffect } from "react";
import { forumAPI } from "@/lib/apiClient";
import type { ForumPost, CreateForumPostData } from "@/types";
import {
  MessageSquare,
  Heart,
  Pin,
  Lock,
  Eye,
  Plus,
  X,
  Calendar,
  User,
  Edit,
  Trash2,
  MoreVertical,
} from "lucide-react";

interface ForumListProps {
  classId?: number; // Optional for admin view (all posts)
  showAllPosts?: boolean; // Flag to show all posts for admin
}

export function ForumList({ classId, showAllPosts = false }: ForumListProps) {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null);
  const [deletingPost, setDeletingPost] = useState<ForumPost | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        let response;
        if (showAllPosts) {
          // Admin view - get all posts
          response = await forumAPI.getAllPosts({
            page: 1,
            limit: 100,
          });
        } else if (classId) {
          // Class view - get posts by class
          response = await forumAPI.getPostsByClass(classId, {
            page: 1,
            limit: 20,
          });
        } else {
          throw new Error("classId is required when not showing all posts");
        }

        setPosts(response.data?.posts || []);
      } catch (err) {
        setError("Không thể tải danh sách bài viết");
        console.error("Error loading posts:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [classId, showAllPosts]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (showAllPosts) {
        response = await forumAPI.getAllPosts({
          page: 1,
          limit: 100,
        });
      } else if (classId) {
        response = await forumAPI.getPostsByClass(classId, {
          page: 1,
          limit: 20,
        });
      } else {
        throw new Error("classId is required when not showing all posts");
      }

      setPosts(response.data?.posts || []);
    } catch (err) {
      setError("Không thể tải danh sách bài viết");
      console.error("Error loading posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = "Vui lòng nhập tiêu đề";
    } else if (formData.title.length < 5) {
      errors.title = "Tiêu đề phải có ít nhất 5 ký tự";
    }

    if (!formData.content.trim()) {
      errors.content = "Vui lòng nhập nội dung";
    } else if (formData.content.length < 10) {
      errors.content = "Nội dung phải có ít nhất 10 ký tự";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!classId) {
      setFormErrors({
        submit: "Không thể tạo bài viết khi xem tất cả bài viết",
      });
      return;
    }

    setSubmitLoading(true);
    try {
      const postData: CreateForumPostData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
      };

      await forumAPI.createPost(classId, postData);
      await loadPosts();
      setShowCreateModal(false);
      setFormData({ title: "", content: "" });
      setFormErrors({});
    } catch (err: unknown) {
      const error = err as { message?: string };
      setFormErrors({
        submit: error.message || "Có lỗi xảy ra khi tạo bài viết",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleLikePost = async (postId: number) => {
    try {
      await forumAPI.likePost(postId);
      await loadPosts();
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  const handlePinPost = async (postId: number) => {
    try {
      await forumAPI.pinPost(postId);
      await loadPosts();
    } catch (err) {
      console.error("Error pinning post:", err);
    }
  };

  const handleEditClick = (post: ForumPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!editingPost) return;

    setSubmitLoading(true);
    try {
      await forumAPI.updatePost(editingPost.id, {
        title: formData.title.trim(),
        content: formData.content.trim(),
      });
      await loadPosts();
      setShowEditModal(false);
      setEditingPost(null);
      setFormData({ title: "", content: "" });
      setFormErrors({});
    } catch (err: unknown) {
      const error = err as { message?: string };
      setFormErrors({
        submit: error.message || "Có lỗi xảy ra khi cập nhật bài viết",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteClick = (post: ForumPost) => {
    setDeletingPost(post);
    setShowDeleteModal(true);
  };

  const handleDeletePost = async () => {
    if (!deletingPost) return;

    setSubmitLoading(true);
    try {
      await forumAPI.deletePost(deletingPost.id);
      await loadPosts();
      setShowDeleteModal(false);
      setDeletingPost(null);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setFormErrors({
        submit: error.message || "Có lỗi xảy ra khi xóa bài viết",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

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
          onClick={loadPosts}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {showAllPosts ? "Tất cả bài viết diễn đàn" : "Diễn đàn lớp học"}
        </h2>
        {!showAllPosts && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2"
          >
            <Plus size={20} />
            Tạo bài viết
          </button>
        )}
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Chưa có bài viết nào
            </h3>
            <p className="text-gray-500 mb-4">
              Hãy là người đầu tiên tạo bài viết trong diễn đàn này
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Tạo bài viết đầu tiên
            </button>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className={`bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow ${
                post.isPinned ? "border-blue-200 bg-blue-50" : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {post.isPinned && (
                      <Pin size={16} className="text-blue-600" />
                    )}
                    {post.isLocked && (
                      <Lock size={16} className="text-red-600" />
                    )}
                    <h3 className="text-xl font-semibold text-gray-900">
                      {post.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      <span>{post.author?.name || "Ẩn danh"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>
                        {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye size={14} />
                      <span>{post.viewCount || 0} lượt xem</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePinPost(post.id)}
                    className={`p-2 rounded-lg transition ${
                      post.isPinned
                        ? "bg-blue-100 text-blue-600"
                        : "hover:bg-gray-100 text-gray-400"
                    }`}
                    title={post.isPinned ? "Bỏ ghim" : "Ghim bài viết"}
                  >
                    <Pin size={16} />
                  </button>
                  <button className="p-2 hover:bg-gray-100 text-gray-400 rounded-lg transition">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>

              <div className="prose max-w-none mb-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLikePost(post.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition group"
                  >
                    <Heart
                      size={16}
                      className={`group-hover:text-red-500 transition ${
                        post.likeCount && post.likeCount > 0
                          ? "text-red-500 fill-red-500"
                          : "text-gray-400"
                      }`}
                    />
                    <span className="text-sm text-gray-600">
                      {post.likeCount || 0}
                    </span>
                  </button>

                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition">
                    <MessageSquare size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {post.commentCount || 0} bình luận
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditClick(post)}
                    className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                    title="Chỉnh sửa"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(post)}
                    className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition"
                    title="Xóa"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                Tạo bài viết mới
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Nhập tiêu đề bài viết..."
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.title ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {formErrors.title && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nội dung <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Nhập nội dung bài viết..."
                  rows={8}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.content ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {formErrors.content && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.content}
                  </p>
                )}
              </div>

              {formErrors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{formErrors.submit}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {submitLoading ? "Đang tạo..." : "Tạo bài viết"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {showEditModal && editingPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                Chỉnh sửa bài viết
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingPost(null);
                  setFormData({ title: "", content: "" });
                  setFormErrors({});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdatePost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Nhập tiêu đề bài viết..."
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.title ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {formErrors.title && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nội dung <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Nhập nội dung bài viết..."
                  rows={8}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.content ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {formErrors.content && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.content}
                  </p>
                )}
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
                    setShowEditModal(false);
                    setEditingPost(null);
                    setFormData({ title: "", content: "" });
                    setFormErrors({});
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
                  {submitLoading ? "Đang cập nhật..." : "Cập nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Post Modal */}
      {showDeleteModal && deletingPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-red-600">
                Xác nhận xóa bài viết
              </h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingPost(null);
                  setFormErrors({});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Bạn có chắc chắn muốn xóa bài viết này không?
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {deletingPost.title}
                </h4>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {deletingPost.content}
                </p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Cảnh báo:</strong> Hành động này không thể hoàn
                  tác. Tất cả bình luận và lượt thích sẽ bị xóa.
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
                  setDeletingPost(null);
                  setFormErrors({});
                }}
                disabled={submitLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDeletePost}
                disabled={submitLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                {submitLoading ? "Đang xóa..." : "Xóa bài viết"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
