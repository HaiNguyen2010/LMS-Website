"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { forumAPI } from "@/lib/apiClient";
import { ForumPost, ForumComment } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  MessageSquare,
  ThumbsUp,
  Eye,
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  X,
  Send,
  Heart,
  Calendar,
  Pin,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function MyPosts() {
  const router = useRouter();
  const { user } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal states
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const itemsPerPage = 12;

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const params: {
        page: number;
        limit: number;
        authorId?: number;
        sortBy?: string;
        sortOrder?: "ASC" | "DESC";
      } = {
        page: currentPage,
        limit: itemsPerPage,
        authorId: user?.id,
        sortBy: "createdAt",
        sortOrder: "DESC",
      };

      const response = await forumAPI.getAll(params);
      setPosts(response.data?.posts || []);
      setTotalPages(response.data?.pagination.totalPages || 1);
      setTotalItems(response.data?.pagination.totalItems || 0);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchPosts();
    }
  }, [fetchPosts, user?.id]);

  const handleDeletePost = async (postId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này?")) {
      return;
    }

    try {
      await forumAPI.delete(postId);
      setPosts((prev) => prev.filter((post) => post.id !== postId));
      setTotalItems((prev) => prev - 1);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Không thể xóa bài viết. Vui lòng thử lại.");
    }
  };

  const openPostModal = async (post: ForumPost) => {
    setSelectedPost(post);
    setShowModal(true);
    setIsLiked(post.isLikedByUser || false);
    await loadComments(post.id);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPost(null);
    setComments([]);
    setNewComment("");
  };

  const loadComments = async (postId: number) => {
    try {
      setLoadingComments(true);
      const response = await forumAPI.getComments(postId, {
        page: 1,
        limit: 100,
      });
      // Backend returns { data: { comments: [...], pagination: {...} } }
      const commentsData = response.data as any;
      setComments(
        Array.isArray(commentsData)
          ? commentsData
          : Array.isArray(commentsData?.comments)
          ? commentsData.comments
          : []
      );
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleLike = async () => {
    if (!selectedPost) return;

    try {
      await forumAPI.likePost(selectedPost.id);
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);

      const newLikeCount = isLiked
        ? (selectedPost.likeCount || 0) - 1
        : (selectedPost.likeCount || 0) + 1;

      // Update like count and isLikedByUser in posts list
      setPosts((prev) =>
        prev.map((p) =>
          p.id === selectedPost.id
            ? {
                ...p,
                likeCount: newLikeCount,
                isLikedByUser: newIsLiked,
              }
            : p
        )
      );

      // Update selected post
      setSelectedPost({
        ...selectedPost,
        likeCount: newLikeCount,
        isLikedByUser: newIsLiked,
      });
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleSubmitComment = async () => {
    if (!selectedPost || !newComment.trim()) return;

    try {
      setSubmittingComment(true);
      await forumAPI.createComment(selectedPost.id, {
        content: newComment.trim(),
      });

      setNewComment("");
      await loadComments(selectedPost.id);

      // Update comment count
      setPosts((prev) =>
        prev.map((p) =>
          p.id === selectedPost.id
            ? { ...p, commentCount: (p.commentCount || 0) + 1 }
            : p
        )
      );

      setSelectedPost({
        ...selectedPost,
        commentCount: (selectedPost.commentCount || 0) + 1,
      });
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert("Không thể gửi bình luận. Vui lòng thử lại.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: vi,
    });
  };

  const openEditModal = (post: ForumPost) => {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditContent(post.content);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingPost(null);
    setEditTitle("");
    setEditContent("");
  };

  const handleUpdatePost = async () => {
    if (!editingPost || !editTitle.trim() || !editContent.trim()) {
      alert("Vui lòng điền đầy đủ tiêu đề và nội dung");
      return;
    }

    try {
      setSubmittingEdit(true);
      await forumAPI.updatePost(editingPost.id, {
        title: editTitle.trim(),
        content: editContent.trim(),
      });

      // Update post in list
      setPosts((prev) =>
        prev.map((p) =>
          p.id === editingPost.id
            ? { ...p, title: editTitle.trim(), content: editContent.trim() }
            : p
        )
      );

      closeEditModal();
      alert("Cập nhật bài viết thành công!");
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Không thể cập nhật bài viết. Vui lòng thử lại.");
    } finally {
      setSubmittingEdit(false);
    }
  };

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
                  <MessageSquare className="w-6 h-6" />
                  Bài viết của tôi
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {totalItems} bài viết
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Chưa có bài viết nào
            </h3>
            <p className="text-gray-500 mb-6">
              Bạn chưa tạo bài viết nào. Hãy chia sẻ suy nghĩ của bạn!
            </p>
            {/* <button
              onClick={() => router.push("/dashboard/student?tab=forum")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Tạo bài viết đầu tiên
            </button> */}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden flex flex-col"
              >
                {/* Post Header */}
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
                      {post.title}
                    </h3>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => openEditModal(post)}
                        className="p-1.5 hover:bg-blue-50 rounded text-blue-600 transition"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 hover:bg-red-50 rounded text-red-600 transition"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                    {post.content}
                  </p>

                  {/* Tags */}
                  {post.tags &&
                    Array.isArray(post.tags) &&
                    post.tags.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1">
                        {post.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1" title="Lượt xem">
                      <Eye className="w-4 h-4" />
                      <span>{post.viewCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1" title="Lượt thích">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{post.likeCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1" title="Bình luận">
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.commentCount || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Post Footer */}
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {formatDistanceToNow(new Date(post.createdAt), {
                        addSuffix: true,
                        locale: vi,
                      })}
                    </span>
                  </div>

                  <button
                    onClick={() => openPostModal(post)}
                    className="mt-2 w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                  >
                    Xem chi tiết
                  </button>
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

      {/* Modal chỉnh sửa bài viết */}
      {showEditModal && editingPost && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeEditModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Edit className="w-6 h-6 text-blue-600" />
                Chỉnh sửa bài viết
              </h2>
              <button
                onClick={closeEditModal}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                {/* Title Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tiêu đề <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Nhập tiêu đề bài viết..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {editTitle.length}/200 ký tự
                  </p>
                </div>

                {/* Content Textarea */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nội dung <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Nhập nội dung bài viết..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={12}
                    maxLength={5000}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {editContent.length}/5000 ký tự
                  </p>
                </div>

                {/* Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-2">
                    <div className="flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Lưu ý khi chỉnh sửa:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Nội dung phải phù hợp với quy định của diễn đàn</li>
                        <li>Bài viết đã chỉnh sửa sẽ có dấu hiệu đã sửa đổi</li>
                        <li>Thông báo sẽ được gửi đến người đã tương tác</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={closeEditModal}
                  disabled={submittingEdit}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpdatePost}
                  disabled={
                    submittingEdit || !editTitle.trim() || !editContent.trim()
                  }
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  {submittingEdit ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4" />
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal xem chi tiết bài viết */}
      {showModal && selectedPost && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                  {selectedPost.author?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedPost.author?.name || "Người dùng"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(selectedPost.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start gap-2 mb-4">
                {selectedPost.isPinned && (
                  <Pin className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-1" />
                )}
                <h2 className="text-2xl font-bold text-gray-900 flex-1">
                  {selectedPost.title}
                </h2>
              </div>

              <div className="prose max-w-none mb-6">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedPost.content}
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 py-4 border-y border-gray-200">
                <div className="flex items-center gap-2 text-gray-600">
                  <Eye className="w-5 h-5" />
                  <span className="text-sm">
                    {selectedPost.viewCount || 0} lượt xem
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-sm">
                    {selectedPost.commentCount || 0} bình luận
                  </span>
                </div>
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 transition-colors ${
                    isLiked
                      ? "text-red-500"
                      : "text-gray-600 hover:text-red-500"
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`}
                  />
                  <span className="text-sm">
                    {selectedPost.likeCount || 0} thích
                  </span>
                </button>
              </div>

              {/* Comments Section */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Bình luận ({comments.length})
                </h3>

                {/* Comment Form */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Viết bình luận của bạn..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || submittingComment}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <Send className="w-4 h-4" />
                      {submittingComment ? "Đang gửi..." : "Gửi bình luận"}
                    </button>
                  </div>
                </div>

                {/* Comments List */}
                {loadingComments ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>Chưa có bình luận nào</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-white border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {comment.author?.name?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900">
                                {comment.author?.name || "Người dùng"}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
