"use client";

import { useEffect, useState } from "react";
import { StudentEnrollment } from "@/types";
import { GraduationCap } from "lucide-react";
import { studentEnrollmentAPI } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { ClassDetail } from "./ClassDetail";
import { ClassSubjects } from "./ClassSubjects";

interface StudentClassListProps {
  onTabChange: (tab: string) => void;
}

type ViewState =
  | { type: "list" }
  | { type: "subjects"; classId: number; className: string }
  | { type: "detail"; classId: number; className: string; subjectId: number };

export function StudentClassList({ onTabChange }: StudentClassListProps) {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState<ViewState>({ type: "list" });

  useEffect(() => {
    if (user?.id) {
      loadEnrollments(user.id);
    }
  }, [user]);

  const loadEnrollments = async (studentId: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await studentEnrollmentAPI.getByStudentId(studentId);
      console.log("API Response:", response); // Debug log

      // API trả về { success, message, data: { student, enrollments, pagination } }
      // Hoặc đôi khi trả về trực tiếp array
      let enrollmentData: StudentEnrollment[] = [];

      if (Array.isArray(response.data)) {
        enrollmentData = response.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if (response.data && (response.data as any).enrollments) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        enrollmentData = (response.data as any).enrollments;
      }

      console.log("Enrollments:", enrollmentData); // Debug log

      const activeEnrollments = enrollmentData.filter(
        (e: StudentEnrollment) => e.isActive !== false
      );
      setEnrollments(activeEnrollments);
    } catch (err) {
      console.error("Error loading enrollments:", err);
      setError("Không thể tải danh sách lớp học");
    } finally {
      setLoading(false);
    }
  };

  // If a class is selected, show ClassDetail
  if (viewState.type === "detail") {
    return (
      <ClassDetail
        classId={viewState.classId}
        className={viewState.className}
        initialSubject={viewState.subjectId}
        onBack={() =>
          setViewState({
            type: "subjects",
            classId: viewState.classId,
            className: viewState.className,
          })
        }
        onTabChange={onTabChange}
      />
    );
  }

  // Show ClassSubjects when viewing subjects for a class
  if (viewState.type === "subjects") {
    return (
      <ClassSubjects
        classId={viewState.classId}
        className={viewState.className}
        onBack={() => setViewState({ type: "list" })}
        onSelectSubject={(subjectId) =>
          setViewState({
            type: "detail",
            classId: viewState.classId,
            className: viewState.className,
            subjectId,
          })
        }
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách lớp học...</p>
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
          onClick={() => user?.id && loadEnrollments(user.id)}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Lớp học của tôi</h2>
        <p className="text-gray-600 mt-1">
          Danh sách các lớp học bạn đang tham gia
        </p>
      </div>

      {enrollments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Chưa có lớp học nào
          </h3>
          <p className="text-gray-500">
            Bạn chưa đăng ký lớp học nào. Hãy liên hệ giáo viên hoặc quản trị
            viên để được thêm vào lớp.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enrollment) => {
            // API trả về enrollmentClass thay vì class
            const classData =
              // @ts-expect-error - API structure varies
              enrollment.enrollmentClass || enrollment.class;

            return (
              <div
                key={enrollment.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer"
                onClick={() =>
                  setViewState({
                    type: "subjects",
                    classId: classData?.id,
                    className: classData?.name || "Lớp học",
                  })
                }
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-3">
                    <GraduationCap className="w-8 h-8" />
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      enrollment.status === "active" || enrollment.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {enrollment.status === "active" || enrollment.isActive
                      ? "Đang học"
                      : "Đã nghỉ"}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {classData?.name || "Không có tên"}
                </h3>

                {classData?.code && (
                  <p className="text-sm text-gray-600 mb-3">
                    Mã lớp:{" "}
                    <span className="font-mono font-semibold">
                      {classData.code}
                    </span>
                  </p>
                )}

                {classData?.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {classData.description}
                  </p>
                )}

                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>
                      Tham gia:{" "}
                      {enrollment.createdAt
                        ? new Date(enrollment.createdAt).toLocaleDateString(
                            "vi-VN"
                          )
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
