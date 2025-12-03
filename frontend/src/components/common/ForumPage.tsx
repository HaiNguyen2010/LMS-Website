"use client";

import { useState, useEffect } from "react";
import { forumAPI } from "@/lib/apiClient";
import type { ForumPost, ForumComment } from "@/types";
import {
  MessageSquare,
  Heart,
  Pin,
  Eye,
  Calendar,
  Send,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
} from "lucide-react";

export function ForumPage() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comment states
  const [commentsMap, setCommentsMap] = useState<
    Record<number, ForumComment[]>
  >({});
  const [showCommentsMap, setShowCommentsMap] = useState<
    Record<number, boolean>
  >({});
  const [loadingCommentsMap, setLoadingCommentsMap] = useState<
    Record<number, boolean>
  >({});
  const [newCommentMap, setNewCommentMap] = useState<Record<number, string>>(
    {}
  );
  const [submittingCommentMap, setSubmittingCommentMap] = useState<
    Record<number, boolean>
  >({});

  // Like states
  const [likedPostsMap, setLikedPostsMap] = useState<Record<number, boolean>>(
    {}
  );

  // Modal states
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Create post states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [creatingPost, setCreatingPost] = useState(false);
  const [createPostErrors, setCreatePostErrors] = useState<{
    title?: string;
    content?: string;
    classId?: string;
  }>({});

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all posts for student
      const response = await forumAPI.getAllPosts({ page: 1, limit: 100 });
      const postsData = Array.isArray(response.data)
        ? response.data
        : response.data?.posts || response.data?.items || [];

      // Sort posts: pinned first, then by date
      const sortedPosts = postsData.sort((a: ForumPost, b: ForumPost) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      setPosts(sortedPosts);

      // Initialize liked posts map from API data
      const initialLikedMap: Record<number, boolean> = {};
      sortedPosts.forEach((post: ForumPost) => {
        if (post.isLikedByUser !== undefined) {
          initialLikedMap[post.id] = post.isLikedByUser;
        }
      });
      setLikedPostsMap(initialLikedMap);
    } catch (err) {
      setError("Không thể tải bài viết diễn đàn");
      console.error("Error loading forum posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const isCurrentlyLiked = likedPostsMap[postId];

      // Optimistic update
      setLikedPostsMap((prev) => ({
        ...prev,
        [postId]: !isCurrentlyLiked,
      }));

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                likeCount: isCurrentlyLiked
                  ? Math.max(0, (post.likeCount || 0) - 1)
                  : (post.likeCount || 0) + 1,
              }
            : post
        )
      );

      // Update selected post if modal is open
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost((prev) =>
          prev
            ? {
                ...prev,
                likeCount: isCurrentlyLiked
                  ? Math.max(0, (prev.likeCount || 0) - 1)
                  : (prev.likeCount || 0) + 1,
              }
            : prev
        );
      }

      // Gọi API
      const response = await forumAPI.likePost(postId);

      // Update with actual response from server
      if (
        response.data &&
        typeof response.data === "object" &&
        "action" in response.data
      ) {
        const action = response.data.action as string;
        setLikedPostsMap((prev) => ({
          ...prev,
          [postId]: action === "liked",
        }));
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      // Rollback on error
      const isCurrentlyLiked = likedPostsMap[postId];
      setLikedPostsMap((prev) => ({
        ...prev,
        [postId]: isCurrentlyLiked,
      }));

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                likeCount: isCurrentlyLiked
                  ? (post.likeCount || 0) + 1
                  : Math.max(0, (post.likeCount || 0) - 1),
              }
            : post
        )
      );
    }
  };

  const toggleComments = async (postId: number) => {
    const isCurrentlyShown = showCommentsMap[postId];

    // Toggle visibility
    setShowCommentsMap((prev) => ({
      ...prev,
      [postId]: !isCurrentlyShown,
    }));

    // Load comments if showing and not loaded yet
    if (!isCurrentlyShown && !commentsMap[postId]) {
      await loadComments(postId);
    }
  };

  const handleViewPost = async (postId: number) => {
    try {
      // Find the post
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      // Set selected post and show modal
      setSelectedPost(post);
      setShowModal(true);

      // Call API to increment view count
      await forumAPI.getPostById(postId);

      // Update view count in local state
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId ? { ...p, viewCount: (p.viewCount || 0) + 1 } : p
        )
      );

      // Load comments for the modal
      await loadComments(postId);
    } catch (err) {
      console.error("Error viewing post:", err);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPost(null);
  };

  const handleCreatePost = async () => {
    // Reset errors
    setCreatePostErrors({});

    // Client-side validation
    const errors: { title?: string; content?: string; classId?: string } = {};

    if (!newPostTitle.trim()) {
      errors.title = "Vui lòng nhập tiêu đề";
    } else if (newPostTitle.trim().length < 5) {
      errors.title = "Tiêu đề phải có ít nhất 5 ký tự";
    } else if (newPostTitle.trim().length > 200) {
      errors.title = "Tiêu đề không được quá 200 ký tự";
    }

    if (!newPostContent.trim()) {
      errors.content = "Vui lòng nhập nội dung";
    } else if (newPostContent.trim().length < 10) {
      errors.content = "Nội dung phải có ít nhất 10 ký tự";
    } else if (newPostContent.trim().length > 10000) {
      errors.content = "Nội dung không được quá 10,000 ký tự";
    }

    // Ưu tiên lấy classId được chọn, nếu không có thì lấy từ bài viết đầu tiên
    const classId = selectedClassId || posts[0]?.classId;
    if (!classId) {
      errors.classId =
        "Không tìm thấy thông tin lớp học. Vui lòng chọn lớp học.";
    }

    if (Object.keys(errors).length > 0) {
      setCreatePostErrors(errors);
      return;
    }

    try {
      setCreatingPost(true);

      const response = await forumAPI.createPost(classId!, {
        title: newPostTitle,
        content: newPostContent,
      });

      if (response.data) {
        // Thêm bài viết mới vào đầu danh sách
        setPosts((prev) => [response.data as ForumPost, ...prev]);

        // Reset form và đóng modal
        setNewPostTitle("");
        setNewPostContent("");
        setSelectedClassId(null);
        setShowCreateModal(false);
        setCreatePostErrors({});

        alert("Tạo bài viết thành công!");
      }
    } catch (err: unknown) {
      console.error("Error creating post:", err);

      const error = err as {
        response?: {
          data?: {
            errors?: Array<{ path: string; msg: string }>;
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
          title?: string;
          content?: string;
          classId?: string;
        } = {};
        error.response.data.errors.forEach(
          (validationError: { path: string; msg: string }) => {
            if (validationError.path === "title") {
              backendErrors.title = validationError.msg;
            } else if (validationError.path === "content") {
              backendErrors.content = validationError.msg;
            } else if (validationError.path === "classId") {
              backendErrors.classId = validationError.msg;
            }
          }
        );
        setCreatePostErrors(backendErrors);
      } else {
        // Generic error
        alert(
          error.response?.data?.message ||
            "Không thể tạo bài viết. Vui lòng thử lại."
        );
      }
    } finally {
      setCreatingPost(false);
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewPostTitle("");
    setNewPostContent("");
    setSelectedClassId(null);
    setCreatePostErrors({});
  };

  const loadComments = async (postId: number) => {
    try {
      setLoadingCommentsMap((prev) => ({ ...prev, [postId]: true }));

      const response = await forumAPI.getComments(postId);
      let commentsData: ForumComment[] = [];

      if (Array.isArray(response.data)) {
        commentsData = response.data;
      } else if (
        response.data &&
        typeof response.data === "object" &&
        "comments" in response.data
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        commentsData = (response.data as any).comments as ForumComment[];
      }

      setCommentsMap((prev) => ({
        ...prev,
        [postId]: commentsData,
      }));
    } catch (err) {
      console.error("Error loading comments:", err);
    } finally {
      setLoadingCommentsMap((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleSubmitComment = async (postId: number) => {
    const content = newCommentMap[postId]?.trim();
    if (!content) return;

    try {
      setSubmittingCommentMap((prev) => ({ ...prev, [postId]: true }));

      // Optimistic update - add comment to UI immediately
      const tempComment: ForumComment = {
        id: Date.now(), // temporary ID
        postId,
        authorId: 0,
        content,
        author: {
          id: 0,
          name: "Bạn",
          email: "",
          code: "",
          role: "student",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setCommentsMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), tempComment],
      }));

      // Clear input
      setNewCommentMap((prev) => ({ ...prev, [postId]: "" }));

      // Call API
      const response = await forumAPI.createComment(postId, { content });

      // Update with real comment from server
      if (response.data) {
        const serverComment = response.data as ForumComment;
        setCommentsMap((prev) => ({
          ...prev,
          [postId]: prev[postId].map((c) =>
            c.id === tempComment.id ? serverComment : c
          ),
        }));

        // Update comment count in post
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? { ...post, commentCount: (post.commentCount || 0) + 1 }
              : post
          )
        );

        // Update comment count in selected post if modal is open
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost((prev) =>
            prev
              ? { ...prev, commentCount: (prev.commentCount || 0) + 1 }
              : prev
          );
        }
      }
    } catch (err) {
      console.error("Error submitting comment:", err);
      // Rollback optimistic update
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((c) => c.id !== Date.now()),
      }));
      // Restore input
      setNewCommentMap((prev) => ({ ...prev, [postId]: content }));
    } finally {
      setSubmittingCommentMap((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0 || diffDays === 1) {
      return "Hôm nay";
    } else if (diffDays > 1 && diffDays < 3) {
      return "Hôm qua";
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      return date.toLocaleDateString("vi-VN");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải diễn đàn...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 text-xl mb-2">⚠️</div>
        <p className="text-red-700 font-medium">{error}</p>
        <button
          onClick={loadPosts}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Diễn đàn</h2>
          <p className="text-gray-600 mt-1">
            Thảo luận và trao đổi với giáo viên và bạn học
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Tạo bài viết
        </button>
      </div>

      {/* Forum Posts */}
      {posts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Chưa có bài viết nào
          </h3>
          <p className="text-gray-500">
            Hãy là người đầu tiên tạo bài viết trong diễn đàn
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 ${
                post.isPinned ? "border-2 border-yellow-400" : ""
              }`}
            >
              {/* Post Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold">
                    {post.author?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">
                        {post.author?.name || "Người dùng"}
                      </h3>
                      {post.isPinned && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full flex items-center gap-1">
                          <Pin className="w-3 h-3" />
                          Ghim
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(post.createdAt)}</span>
                      {post.class && (
                        <>
                          <span>•</span>
                          <span className="text-blue-600">
                            {post.class.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* View Detail Button */}
                <button
                  onClick={() => handleViewPost(post.id)}
                  className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition text-sm font-medium"
                  title="Xem chi tiết"
                >
                  <Eye className="w-5 h-5" />
                  <span className="hidden sm:inline">Xem chi tiết</span>
                </button>
              </div>

              {/* Post Title */}
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                {post.title}
              </h2>

              {/* Post Content */}
              <div className="prose max-w-none mb-4 relative">
                <p className="text-gray-700 whitespace-pre-wrap line-clamp-3">
                  {post.content}
                </p>
              </div>

              {/* Post Stats and Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{post.viewCount || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.commentCount || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span>{post.likeCount || 0}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`px-4 py-2 rounded-lg transition text-sm font-medium flex items-center gap-2 ${
                      likedPostsMap[post.id]
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-red-50 text-red-600 hover:bg-red-100"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        likedPostsMap[post.id] ? "fill-current" : ""
                      }`}
                    />
                    {likedPostsMap[post.id] ? "Bỏ thích" : "Thích"}
                  </button>
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {showCommentsMap[post.id] ? "Ẩn bình luận" : "Bình luận"}
                    {showCommentsMap[post.id] ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              {showCommentsMap[post.id] && (
                <div className="mt-4 pt-4 border-t bg-gray-50 -mx-6 px-6 pb-4">
                  {/* Comment Form */}
                  <div className="mb-4">
                    <div className="flex gap-3">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                        B
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={newCommentMap[post.id] || ""}
                          onChange={(e) =>
                            setNewCommentMap((prev) => ({
                              ...prev,
                              [post.id]: e.target.value,
                            }))
                          }
                          placeholder="Viết bình luận của bạn..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          rows={3}
                          disabled={submittingCommentMap[post.id]}
                        />
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={() => handleSubmitComment(post.id)}
                            disabled={
                              !newCommentMap[post.id]?.trim() ||
                              submittingCommentMap[post.id]
                            }
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {submittingCommentMap[post.id] ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                Đang gửi...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                Gửi bình luận
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comments List */}
                  {loadingCommentsMap[post.id] ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                    </div>
                  ) : commentsMap[post.id]?.length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        {commentsMap[post.id].length} bình luận
                      </h4>
                      {commentsMap[post.id].map((comment) => (
                        <div
                          key={comment.id}
                          className="flex gap-3 bg-white rounded-lg p-4"
                        >
                          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                            {comment.author?.name?.charAt(0).toUpperCase() ||
                              "U"}
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
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>Chưa có bình luận nào</p>
                      <p className="text-sm">
                        Hãy là người đầu tiên bình luận!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Chi Tiết Bài Viết */}
      {showModal && selectedPost && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Chi tiết bài viết
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Post Author */}
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-full w-14 h-14 flex items-center justify-center font-bold text-xl">
                  {selectedPost.author?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    {selectedPost.author?.name || "Người dùng"}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(selectedPost.createdAt)}</span>
                    {selectedPost.class && (
                      <>
                        <span>•</span>
                        <span className="text-blue-600">
                          {selectedPost.class.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Post Title */}
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {selectedPost.title}
              </h1>

              {/* Post Stats */}
              <div className="flex items-center gap-6 text-sm text-gray-600 mb-6 pb-6 border-b">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  <span>{selectedPost.viewCount || 0} lượt xem</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>{selectedPost.commentCount || 0} bình luận</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  <span>{selectedPost.likeCount || 0} lượt thích</span>
                </div>
                {selectedPost.isPinned && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full flex items-center gap-1">
                    <Pin className="w-4 h-4" />
                    Ghim
                  </span>
                )}
              </div>

              {/* Post Content */}
              <div className="prose max-w-none">
                <p className="text-gray-700 text-lg whitespace-pre-wrap leading-relaxed">
                  {selectedPost.content}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t flex items-center gap-3">
                <button
                  onClick={() => handleLike(selectedPost.id)}
                  className={`flex-1 py-3 rounded-lg transition font-medium flex items-center justify-center gap-2 ${
                    likedPostsMap[selectedPost.id]
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : "bg-red-50 text-red-600 hover:bg-red-100"
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${
                      likedPostsMap[selectedPost.id] ? "fill-current" : ""
                    }`}
                  />
                  {likedPostsMap[selectedPost.id] ? "Bỏ thích" : "Thích"}
                </button>
              </div>

              {/* Comments Section in Modal */}
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Bình luận ({selectedPost.commentCount || 0})
                </h3>

                {/* Comment Form */}
                <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                  <div className="flex gap-3">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                      B
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newCommentMap[selectedPost.id] || ""}
                        onChange={(e) =>
                          setNewCommentMap((prev) => ({
                            ...prev,
                            [selectedPost.id]: e.target.value,
                          }))
                        }
                        placeholder="Viết bình luận của bạn..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={3}
                      />
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => handleSubmitComment(selectedPost.id)}
                          disabled={
                            !newCommentMap[selectedPost.id]?.trim() ||
                            submittingCommentMap[selectedPost.id]
                          }
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {submittingCommentMap[selectedPost.id] ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Đang gửi...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Gửi bình luận
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                {loadingCommentsMap[selectedPost.id] ? (
                  <div className="text-center py-8">
                    <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500 mt-2">Đang tải bình luận...</p>
                  </div>
                ) : commentsMap[selectedPost.id]?.length > 0 ? (
                  <div className="space-y-4">
                    {commentsMap[selectedPost.id].map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-white p-4 rounded-lg border border-gray-200"
                      >
                        <div className="flex gap-3">
                          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                            {comment.author?.name?.charAt(0).toUpperCase() ||
                              "U"}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900">
                                {comment.author?.name || "Người dùng"}
                              </span>
                              <span className="text-sm text-gray-500">
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
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Chưa có bình luận nào</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={closeCreateModal}
        >
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Plus className="w-6 h-6" />
                Tạo bài viết mới
              </h2>
              <button
                onClick={closeCreateModal}
                className="p-2 hover:bg-gray-100 rounded-full transition"
                disabled={creatingPost}
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Class Selection */}
              {posts.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Lớp học
                  </label>
                  <select
                    value={selectedClassId || ""}
                    onChange={(e) => {
                      setSelectedClassId(
                        e.target.value ? Number(e.target.value) : null
                      );
                      // Clear error when user changes
                      if (createPostErrors.classId) {
                        setCreatePostErrors((prev) => ({
                          ...prev,
                          classId: undefined,
                        }));
                      }
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      createPostErrors.classId
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                    disabled={creatingPost}
                  >
                    <option value="">
                      -- Chọn lớp (mặc định:{" "}
                      {posts[0]?.class?.name || "Lớp đầu tiên"}) --
                    </option>
                    {Array.from(
                      new Map(
                        posts
                          .filter((p) => p.class)
                          .map((p) => [p.classId, p.class])
                      ).values()
                    ).map((classInfo) => (
                      <option key={classInfo!.id} value={classInfo!.id}>
                        {classInfo!.name}
                      </option>
                    ))}
                  </select>
                  {createPostErrors.classId && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <span>⚠</span>
                      {createPostErrors.classId}
                    </p>
                  )}
                </div>
              )}

              {/* Title Input */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPostTitle}
                  onChange={(e) => {
                    setNewPostTitle(e.target.value);
                    // Clear error when user types
                    if (createPostErrors.title) {
                      setCreatePostErrors((prev) => ({
                        ...prev,
                        title: undefined,
                      }));
                    }
                  }}
                  placeholder="Nhập tiêu đề bài viết..."
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    createPostErrors.title
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                  disabled={creatingPost}
                />
                {createPostErrors.title && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <span>⚠</span>
                    {createPostErrors.title}
                  </p>
                )}
              </div>

              {/* Content Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nội dung <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newPostContent}
                  onChange={(e) => {
                    setNewPostContent(e.target.value);
                    // Clear error when user types
                    if (createPostErrors.content) {
                      setCreatePostErrors((prev) => ({
                        ...prev,
                        content: undefined,
                      }));
                    }
                  }}
                  placeholder="Viết nội dung bài viết của bạn..."
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    createPostErrors.content
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                  rows={10}
                  disabled={creatingPost}
                />
                {createPostErrors.content && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <span>⚠</span>
                    {createPostErrors.content}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  onClick={closeCreateModal}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  disabled={creatingPost}
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreatePost}
                  disabled={
                    !newPostTitle.trim() ||
                    !newPostContent.trim() ||
                    creatingPost
                  }
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingPost ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Tạo bài viết
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
