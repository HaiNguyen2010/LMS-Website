"use client";

import { useEffect, useState } from "react";
import { assignmentAPI, classAPI, subjectAPI } from "@/lib/apiClient";
import type { Assignment, Class, Subject, MCQQuestion } from "@/types";
import {
  Eye,
  Edit,
  Trash2,
  School,
  BookOpen,
  Calendar,
  Plus,
  Paperclip,
} from "lucide-react";
import { AssignmentModal } from "./AssignmentModal";
import { AssignmentViewModal } from "./AssignmentViewModal";

interface FormData {
  title: string;
  description: string;
  type: "essay" | "file_upload" | "mcq";
  classId: string;
  subjectId: string;
  dueDate: string;
  maxGrade: number;
  instructions: string;
  allowedFileTypes: string;
  maxFileSize: number;
  autoGrade: boolean;
  showCorrectAnswers: boolean;
  status: "draft" | "published" | "closed";
  mcqQuestions: MCQQuestion[];
  files: File[];
  existingAttachments?: Array<{
    id: number;
    fileName: string;
    fileUrl: string;
    fileSize: number;
  }>;
  attachmentsToDelete?: number[];
}

interface FormErrors {
  [key: string]: string;
}

// Interface for backend response with different alias names
interface AssignmentBackendResponse {
  id: number;
  title: string;
  description?: string;
  type: string;
  classId: number;
  subjectId: number;
  dueDate: string;
  maxGrade: number;
  instructions?: string;
  allowedFileTypes?: string;
  maxFileSize?: number;
  mcqQuestions?: MCQQuestion[];
  autoGrade?: boolean;
  showCorrectAnswers?: boolean;
  fileUrl?: string;
  fileName?: string;
  assignmentClass?: Class;
  assignmentSubject?: Subject;
  class?: Class;
  subject?: Subject;
  attachments?: Array<{
    id: number;
    fileName: string;
    fileUrl: string;
    fileSize: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export function AssignmentList() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(
    null
  );
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(
    null
  );
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    type: "essay",
    classId: "",
    subjectId: "",
    dueDate: "",
    maxGrade: 10,
    instructions: "",
    allowedFileTypes: "pdf,doc,docx",
    maxFileSize: 10,
    autoGrade: false,
    showCorrectAnswers: false,
    status: "draft",
    mcqQuestions: [],
    files: [],
    existingAttachments: [],
    attachmentsToDelete: [],
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [assignmentsRes, classesRes, subjectsRes] = await Promise.all([
        assignmentAPI.getAll({ page: 1, limit: 50 }),
        classAPI.getAll({ page: 1, limit: 100 }),
        subjectAPI.getAll({ page: 1, limit: 100 }),
      ]);

      // Map assignments
      const assignmentsData =
        assignmentsRes.data?.assignments || assignmentsRes.data?.items || [];
      const mappedAssignments: Assignment[] = assignmentsData.map(
        (assignment: AssignmentBackendResponse) => ({
          ...assignment,
          type: assignment.type as Assignment["type"],
          class: assignment.assignmentClass || assignment.class,
          subject: assignment.assignmentSubject || assignment.subject,
        })
      );

      setAssignments(mappedAssignments);
      setClasses(classesRes.data?.classes || classesRes.data?.items || []);
      setSubjects(subjectsRes.data?.subjects || subjectsRes.data?.items || []);
    } catch (err) {
      setError("Không thể tải dữ liệu");
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
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
          onClick={loadData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const getAssignmentTypeLabel = (type: string) => {
    switch (type) {
      case "essay":
        return "Bài luận";
      case "file_upload":
        return "Nộp file";
      case "mcq":
        return "Trắc nghiệm";
      default:
        return type;
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.title.trim()) {
      errors.title = "Tiêu đề không được để trống";
    }
    if (!formData.classId) {
      errors.classId = "Vui lòng chọn lớp học";
    }
    if (!formData.subjectId) {
      errors.subjectId = "Vui lòng chọn môn học";
    }
    if (!formData.dueDate) {
      errors.dueDate = "Vui lòng chọn hạn nộp";
    }
    if (formData.maxGrade <= 0 || formData.maxGrade > 100) {
      errors.maxGrade = "Điểm tối đa phải từ 0.01 đến 100";
    }
    if (formData.type === "mcq" && formData.mcqQuestions.length === 0) {
      errors.mcqQuestions = "Vui lòng thêm ít nhất 1 câu hỏi trắc nghiệm";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "essay",
      classId: "",
      subjectId: "",
      dueDate: "",
      maxGrade: 10,
      instructions: "",
      allowedFileTypes: "pdf,doc,docx",
      maxFileSize: 10,
      autoGrade: false,
      showCorrectAnswers: false,
      status: "draft",
      mcqQuestions: [],
      files: [],
      existingAttachments: [],
      attachmentsToDelete: [],
    });
    setFormErrors({});
    setEditingAssignment(null);
  };

  const handleOpenModal = (assignment?: Assignment) => {
    if (assignment) {
      setEditingAssignment(assignment);

      // Parse mcqQuestions if it's a string
      let mcqQuestions = [];
      if (assignment.mcqQuestions) {
        if (Array.isArray(assignment.mcqQuestions)) {
          mcqQuestions = assignment.mcqQuestions;
        } else if (typeof assignment.mcqQuestions === "string") {
          try {
            mcqQuestions = JSON.parse(assignment.mcqQuestions);
          } catch (e) {
            console.error("Failed to parse mcqQuestions:", e);
            mcqQuestions = [];
          }
        }
      }

      setFormData({
        title: assignment.title,
        description: assignment.description || "",
        type: assignment.type,
        classId: String(assignment.classId),
        subjectId: String(assignment.subjectId),
        dueDate: assignment.dueDate.split("T")[0],
        maxGrade: assignment.maxGrade,
        instructions: assignment.instructions || "",
        allowedFileTypes: assignment.allowedFileTypes || "pdf,doc,docx",
        maxFileSize: assignment.maxFileSize || 10,
        autoGrade: assignment.autoGrade || false,
        showCorrectAnswers: assignment.showCorrectAnswers || false,
        status:
          (assignment.status === "archived" ? "closed" : assignment.status) ||
          "draft",
        mcqQuestions: mcqQuestions,
        files: [],
        existingAttachments:
          (
            assignment as unknown as {
              attachments?: Array<{
                id: number;
                fileName: string;
                fileUrl: string;
                fileSize: number;
              }>;
            }
          ).attachments || [],
        attachmentsToDelete: [],
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const submitData = new FormData();

      // Add text fields
      submitData.append("title", formData.title);
      submitData.append("description", formData.description);
      submitData.append("type", formData.type);
      submitData.append("classId", formData.classId);
      submitData.append("subjectId", formData.subjectId);
      submitData.append("dueDate", formData.dueDate);
      submitData.append("maxGrade", String(formData.maxGrade));
      submitData.append("instructions", formData.instructions);
      submitData.append("status", formData.status);

      // Add file submission settings for file_upload and essay types
      if (formData.type === "file_upload" || formData.type === "essay") {
        submitData.append("allowedFileTypes", formData.allowedFileTypes);
        submitData.append("maxFileSize", String(formData.maxFileSize));
      }

      submitData.append("autoGrade", String(formData.autoGrade));
      submitData.append(
        "showCorrectAnswers",
        String(formData.showCorrectAnswers)
      );

      // Add MCQ questions if any
      if (formData.mcqQuestions.length > 0) {
        submitData.append(
          "mcqQuestions",
          JSON.stringify(formData.mcqQuestions)
        );
      }

      // Add multiple files
      formData.files.forEach((file) => {
        submitData.append("files", file);
      });

      // If editing, add attachments to delete
      if (
        editingAssignment &&
        formData.attachmentsToDelete &&
        formData.attachmentsToDelete.length > 0
      ) {
        submitData.append(
          "deleteAttachmentIds",
          JSON.stringify(formData.attachmentsToDelete)
        );
      }

      if (editingAssignment) {
        await assignmentAPI.update(editingAssignment.id, submitData);
      } else {
        await assignmentAPI.create(submitData);
      }

      handleCloseModal();
      loadData();
    } catch (err) {
      setFormErrors({
        submit: (err as Error)?.message || "Có lỗi xảy ra khi lưu bài tập",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài tập này?")) {
      return;
    }

    try {
      await assignmentAPI.delete(id);
      loadData();
    } catch (err) {
      setError("Không thể xóa bài tập");
      console.error("Error deleting assignment:", err);
    }
  };

  const handleViewAssignment = async (assignment: Assignment) => {
    try {
      const response = await assignmentAPI.getById(assignment.id);
      const assignmentData = response.data;

      // Map assignmentClass and assignmentSubject to class and subject
      if (assignmentData) {
        const mappedAssignment = {
          ...assignmentData,
          class:
            (assignmentData as AssignmentBackendResponse).assignmentClass ||
            assignmentData.class,
          subject:
            (assignmentData as AssignmentBackendResponse).assignmentSubject ||
            assignmentData.subject,
        };
        setViewingAssignment(mappedAssignment);
      } else {
        setViewingAssignment(null);
      }

      setShowViewModal(true);
    } catch (err) {
      setError("Không thể tải chi tiết bài tập");
      console.error("Error loading assignment details:", err);
    }
  };

  const addMCQQuestion = () => {
    setFormData({
      ...formData,
      mcqQuestions: [
        ...formData.mcqQuestions,
        { question: "", options: ["", "", "", ""], correctAnswer: 0 },
      ],
    });
  };

  const updateMCQQuestion = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const updatedQuestions = [...formData.mcqQuestions];
    if (field === "question" || field === "correctAnswer") {
      updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    }
    setFormData({ ...formData, mcqQuestions: updatedQuestions });
  };

  const updateMCQOption = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const updatedQuestions = [...formData.mcqQuestions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setFormData({ ...formData, mcqQuestions: updatedQuestions });
  };

  const removeMCQQuestion = (index: number) => {
    const updatedQuestions = formData.mcqQuestions.filter(
      (_, i) => i !== index
    );
    setFormData({ ...formData, mcqQuestions: updatedQuestions });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Danh sách bài tập{" "}
          {assignments.length > 0 && `(${assignments.length})`}
        </h2>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2"
        >
          <Plus size={20} />
          Thêm bài tập
        </button>
      </div>

      <div className="space-y-4">
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className={`border rounded-lg p-5 hover:shadow-md transition ${
              isOverdue(assignment.dueDate)
                ? "bg-red-50 border-red-200"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {assignment.title}
                  </h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                    {getAssignmentTypeLabel(assignment.type)}
                  </span>
                  {isOverdue(assignment.dueDate) && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                      Quá hạn
                    </span>
                  )}
                </div>

                {assignment.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {assignment.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <School size={16} />
                    <span>
                      Lớp:{" "}
                      {assignment.class?.name || `ID ${assignment.classId}`}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <BookOpen size={16} />
                    <span>
                      Môn:{" "}
                      {assignment.subject?.name || `ID ${assignment.subjectId}`}
                    </span>
                  </span>
                  {(assignment as AssignmentBackendResponse).attachments &&
                    (assignment as AssignmentBackendResponse).attachments!
                      .length > 0 && (
                      <span className="inline-flex items-center gap-1 text-blue-600">
                        <Paperclip size={16} />
                        <span>
                          {
                            (assignment as AssignmentBackendResponse)
                              .attachments!.length
                          }{" "}
                          tệp đính kèm
                        </span>
                      </span>
                    )}
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={16} />
                    <span>
                      Hạn nộp:{" "}
                      {new Date(assignment.dueDate).toLocaleDateString("vi-VN")}
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleViewAssignment(assignment)}
                  className="px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition text-sm inline-flex items-center gap-1"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => handleOpenModal(assignment)}
                  className="px-3 py-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition text-sm inline-flex items-center gap-1"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(assignment.id)}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition text-sm inline-flex items-center"
                  title="Xóa bài tập"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {assignments.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Không có bài tập nào
        </div>
      )}

      {/* Create/Edit Modal */}
      <AssignmentModal
        showModal={showModal}
        editingAssignment={editingAssignment}
        formData={formData}
        formErrors={formErrors}
        classes={classes}
        subjects={subjects}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        setFormData={setFormData}
        addMCQQuestion={addMCQQuestion}
        updateMCQQuestion={updateMCQQuestion}
        updateMCQOption={updateMCQOption}
        removeMCQQuestion={removeMCQQuestion}
      />

      {/* View Modal */}
      <AssignmentViewModal
        showViewModal={showViewModal}
        viewingAssignment={viewingAssignment}
        onClose={() => setShowViewModal(false)}
        getAssignmentTypeLabel={getAssignmentTypeLabel}
      />
    </div>
  );
}
