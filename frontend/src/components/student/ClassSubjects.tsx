"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, User } from "lucide-react";
import {
  assignmentAPI,
  lessonAPI,
  teacherAssignmentAPI,
} from "@/lib/apiClient";
import { Assignment, Lesson, TeacherAssignment } from "@/types";

interface ClassSubjectsProps {
  classId: number;
  className: string;
  onBack: () => void;
  onSelectSubject: (subjectId: number, subjectName: string) => void;
}

interface Subject {
  id: number;
  name: string;
  code: string;
  description?: string;
  lessonsCount: number;
  assignmentsCount: number;
  teacherName?: string;
  teacherEmail?: string;
}

export function ClassSubjects({
  classId,
  className,
  onBack,
  onSelectSubject,
}: ClassSubjectsProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const loadSubjects = async () => {
    try {
      setLoading(true);

      // Load lessons
      const lessonsResponse = await lessonAPI.getAll({
        page: 1,
        limit: 100,
        classId: classId,
      });

      let lessonsData: Lesson[] = [];
      if (lessonsResponse.data && lessonsResponse.data.lessons) {
        lessonsData = lessonsResponse.data.lessons;
      } else if (Array.isArray(lessonsResponse.data)) {
        lessonsData = lessonsResponse.data;
      } else if (lessonsResponse.data?.items) {
        lessonsData = lessonsResponse.data.items;
      }

      // Load assignments
      const assignmentsResponse = await assignmentAPI.getAll({
        page: 1,
        limit: 100,
      });
      const allAssignments =
        assignmentsResponse.data?.assignments ||
        assignmentsResponse.data?.items ||
        [];
      const classAssignments = allAssignments.filter(
        (a: Assignment) => a.classId === classId
      );

      // Load teacher assignments for this class
      const teacherAssignmentsResponse =
        await teacherAssignmentAPI.getByClassId(classId);
      // @ts-expect-error - API response structure varies
      const teacherAssignments: TeacherAssignment[] = Array.isArray(
        teacherAssignmentsResponse.data
      )
        ? teacherAssignmentsResponse.data
        : teacherAssignmentsResponse.data?.teacherAssignments || [];

      // Group by subject
      const subjectsMap = new Map<
        number,
        {
          id: number;
          name: string;
          code: string;
          description?: string;
          lessons: number;
          assignments: number;
          teacherName?: string;
          teacherEmail?: string;
        }
      >();

      lessonsData.forEach((lesson) => {
        if (lesson.lessonSubject) {
          const existing = subjectsMap.get(lesson.lessonSubject.id);
          if (existing) {
            existing.lessons++;
          } else {
            // Find teacher for this subject
            const teacherAssignment = teacherAssignments.find(
              (ta: TeacherAssignment) =>
                ta.subjectId === lesson.lessonSubject?.id && ta.isActive
            );

            subjectsMap.set(lesson.lessonSubject.id, {
              id: lesson.lessonSubject.id,
              name: lesson.lessonSubject.name,
              code: lesson.lessonSubject.code,
              description: lesson.lessonSubject.description,
              lessons: 1,
              assignments: 0,
              teacherName: teacherAssignment?.teacher?.name,
              teacherEmail: teacherAssignment?.teacher?.email,
            });
          }
        }
      });

      classAssignments.forEach((assignment: Assignment) => {
        if (assignment.assignmentSubject) {
          const existing = subjectsMap.get(assignment.assignmentSubject.id);
          if (existing) {
            existing.assignments++;
          } else {
            // Find teacher for this subject
            const teacherAssignment = teacherAssignments.find(
              (ta: TeacherAssignment) =>
                ta.subjectId === assignment.assignmentSubject?.id && ta.isActive
            );

            subjectsMap.set(assignment.assignmentSubject.id, {
              id: assignment.assignmentSubject.id,
              name: assignment.assignmentSubject.name,
              code: assignment.assignmentSubject.code,
              description: assignment.assignmentSubject.description,
              lessons: 0,
              assignments: 1,
              teacherName: teacherAssignment?.teacher?.name,
              teacherEmail: teacherAssignment?.teacher?.email,
            });
          }
        }
      });

      const subjectsArray = Array.from(subjectsMap.values()).map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        description: s.description,
        lessonsCount: s.lessons,
        assignmentsCount: s.assignments,
        teacherName: s.teacherName,
        teacherEmail: s.teacherEmail,
      }));

      setSubjects(subjectsArray);
    } catch (error) {
      console.error("Error loading subjects:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách môn học...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại danh sách lớp học
        </button>
        <h2 className="text-2xl font-bold text-gray-800">{className}</h2>
        <p className="text-gray-600 mt-1">
          Chọn môn học để xem bài giảng và bài tập
        </p>
      </div>

      {/* Subjects Grid */}
      {subjects.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Chưa có môn học nào
          </h3>
          <p className="text-gray-500">
            Lớp học này chưa có bài giảng hoặc bài tập
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <div
              key={subject.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer p-6 border-2 border-transparent hover:border-blue-500"
              onClick={() => onSelectSubject(subject.id, subject.name)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-3">
                  <BookOpen className="w-8 h-8" />
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  {subject.code}
                </span>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {subject.name}
              </h3>

              {subject.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {subject.description}
                </p>
              )}

              {(subject.teacherName || subject.teacherEmail) && (
                <div className="mb-3 pb-3 border-b border-gray-200">
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      {subject.teacherName && (
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {subject.teacherName}
                        </p>
                      )}
                      {subject.teacherEmail && (
                        <p className="text-xs text-gray-500 truncate">
                          {subject.teacherEmail}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Bài giảng:</span>
                  <span className="font-semibold text-blue-600">
                    {subject.lessonsCount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Bài tập:</span>
                  <span className="font-semibold text-orange-600">
                    {subject.assignmentsCount}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span className="text-gray-700">Tổng:</span>
                    <span className="text-gray-900">
                      {subject.lessonsCount + subject.assignmentsCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
