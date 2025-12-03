"use client";

import { useEffect, useState } from "react";
import { gradeAPI, userAPI, classAPI, subjectAPI } from "@/lib/apiClient";
import type {
  Grade,
  User,
  Class,
  Subject,
  CreateGradeData,
  GradeType,
  Term,
} from "@/types";
import { Edit, Trash2, Plus, X, Eye } from "lucide-react";

interface FormData {
  studentId: string;
  subjectId: string;
  classId: string;
  gradeValue: string;
  gradeType: GradeType;
  weight: string;
  term: Term;
  academicYear: string;
  remarks: string;
}

export function GradeManagement() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingGrade, setDeletingGrade] = useState<Grade | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingGrade, setViewingGrade] = useState<Grade | null>(null);

  // Form states
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState<FormData>({
    studentId: "",
    subjectId: "",
    classId: "",
    gradeValue: "",
    gradeType: "homework",
    weight: "1",
    term: "1",
    academicYear: `${currentYear}-${currentYear + 1}`,
    remarks: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Autocomplete states for student input
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>("");
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  // Filter states
  const [filterClassId, setFilterClassId] = useState<string>("");
  const [filterSubjectId, setFilterSubjectId] = useState<string>("");
  const [filterTerm, setFilterTerm] = useState<string>("");
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>("");
  const [searchStudentName, setSearchStudentName] = useState<string>("");
  const [showFilterStudentDropdown, setShowFilterStudentDropdown] =
    useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [gradesRes, studentsRes, classesRes, subjectsRes] =
        await Promise.all([
          gradeAPI.getAll({ page: 1, limit: 100 }),
          userAPI.getAll({ page: 1, limit: 100, role: "student" }),
          classAPI.getAll({ page: 1, limit: 100 }),
          subjectAPI.getAll({ page: 1, limit: 100 }),
        ]);

      // Map grades to ensure proper nested data structure
      const gradesData = gradesRes.data?.grades || gradesRes.data?.items || [];
      const mappedGrades = gradesData.map(
        (
          grade: Grade & {
            gradeStudent?: User;
            gradeSubject?: Subject;
            gradeClass?: Class;
          }
        ) => ({
          ...grade,
          student: grade.gradeStudent || grade.student,
          subject: grade.gradeSubject || grade.subject,
          class: grade.gradeClass || grade.class,
        })
      );

      setGrades(mappedGrades);
      setStudents(studentsRes.data?.users || studentsRes.data?.items || []);
      setClasses(classesRes.data?.classes || classesRes.data?.items || []);
      setSubjects(subjectsRes.data?.subjects || subjectsRes.data?.items || []);
    } catch (err) {
      setError("Không thể tải dữ liệu");
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    const currentYear = new Date().getFullYear();
    setFormData({
      studentId: "",
      subjectId: "",
      classId: "",
      gradeValue: "",
      gradeType: "homework",
      weight: "1",
      term: "1",
      academicYear: `${currentYear}-${currentYear + 1}`,
      remarks: "",
    });
    setFormErrors({});
    setEditingGrade(null);
    setStudentSearchTerm("");
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.studentId) errors.studentId = "Vui lòng chọn học sinh";
    if (!formData.subjectId) errors.subjectId = "Vui lòng chọn môn học";
    if (!formData.classId) errors.classId = "Vui lòng chọn lớp";
    if (!formData.gradeValue) {
      errors.gradeValue = "Vui lòng nhập điểm";
    } else {
      const grade = parseFloat(formData.gradeValue);
      if (isNaN(grade) || grade < 0 || grade > 10) {
        errors.gradeValue = "Điểm phải từ 0 đến 10";
      }
    }
    if (!formData.academicYear) {
      errors.academicYear = "Vui lòng nhập năm học";
    } else if (!/^\d{4}-\d{4}$/.test(formData.academicYear)) {
      errors.academicYear =
        "Năm học phải có định dạng YYYY-YYYY (ví dụ: 2024-2025)";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenModal = (grade?: Grade) => {
    if (grade) {
      setEditingGrade(grade);
      setFormData({
        studentId: String(grade.studentId),
        subjectId: String(grade.subjectId),
        classId: String(grade.classId),
        gradeValue: String(grade.gradeValue),
        gradeType: grade.gradeType,
        weight: String(grade.weight || 1),
        term: grade.term,
        academicYear: grade.academicYear,
        remarks: grade.remarks || "",
      });
      // Set student search term when editing
      const student = students.find((s) => s.id === grade.studentId);
      setStudentSearchTerm(student ? `${student.name} (${student.code})` : "");
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

    if (!validateForm()) return;

    setSaving(true);
    try {
      const submitData: CreateGradeData = {
        studentId: parseInt(formData.studentId),
        subjectId: parseInt(formData.subjectId),
        classId: parseInt(formData.classId),
        gradeValue: parseFloat(formData.gradeValue),
        gradeType: formData.gradeType,
        weight: parseFloat(formData.weight),
        term: formData.term,
        academicYear: formData.academicYear,
        remarks: formData.remarks || undefined,
      };

      if (editingGrade) {
        await gradeAPI.update(editingGrade.id, submitData);
      } else {
        await gradeAPI.create(submitData);
      }

      handleCloseModal();
      loadData();
    } catch (err) {
      setFormErrors({
        submit: (err as Error)?.message || "Có lỗi xảy ra khi lưu điểm",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (grade: Grade) => {
    setDeletingGrade(grade);
    setShowDeleteModal(true);
  };

  const handleViewClick = (grade: Grade) => {
    setViewingGrade(grade);
    setShowViewModal(true);
  };

  const handleDelete = async () => {
    if (!deletingGrade) return;

    setSaving(true);
    try {
      await gradeAPI.delete(deletingGrade.id);
      setShowDeleteModal(false);
      setDeletingGrade(null);
      loadData();
    } catch (err) {
      setFormErrors({
        submit: (err as Error)?.message || "Có lỗi xảy ra khi xóa điểm",
      });
    } finally {
      setSaving(false);
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

  const getGradeTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      homework: "Bài tập",
      quiz: "Kiểm tra",
      midterm: "Giữa kỳ",
      final: "Cuối kỳ",
      assignment: "Bài tập lớn",
      participation: "Tham gia",
    };
    return types[type] || type;
  };

  const getTermLabel = (term: string) => {
    if (term === "1") return "HK1";
    if (term === "2") return "HK2";
    if (term === "final") return "Cuối năm";
    return term;
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 8) return "text-green-600 bg-green-50";
    if (grade >= 6.5) return "text-blue-600 bg-blue-50";
    if (grade >= 5) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  // Filter grades based on filter criteria
  const filteredGrades = grades.filter((grade) => {
    // Filter by class
    if (filterClassId && String(grade.classId) !== filterClassId) {
      return false;
    }

    // Filter by subject
    if (filterSubjectId && String(grade.subjectId) !== filterSubjectId) {
      return false;
    }

    // Filter by term
    if (filterTerm && grade.term !== filterTerm) {
      return false;
    }

    // Filter by academic year
    if (filterAcademicYear && grade.academicYear !== filterAcademicYear) {
      return false;
    }

    // Search by student name
    if (searchStudentName) {
      const studentName = grade.student?.name?.toLowerCase() || "";
      const searchTerm = searchStudentName.toLowerCase();
      if (!studentName.includes(searchTerm)) {
        return false;
      }
    }

    return true;
  });

  // Get unique academic years from grades for filter dropdown
  const uniqueAcademicYears = Array.from(
    new Set(grades.map((g) => g.academicYear))
  ).sort();

  const resetFilters = () => {
    setFilterClassId("");
    setFilterSubjectId("");
    setFilterTerm("");
    setFilterAcademicYear("");
    setSearchStudentName("");
  };

  // Filter students based on search term (for modal)
  const filteredStudents = students.filter((student) => {
    const searchLower = studentSearchTerm.toLowerCase();
    return (
      student.name?.toLowerCase().includes(searchLower) ||
      student.code?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower)
    );
  });

  // Filter students for filter dropdown
  const filteredStudentsForFilter = students.filter((student) => {
    const searchLower = searchStudentName.toLowerCase();
    return (
      student.name?.toLowerCase().includes(searchLower) ||
      student.code?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower)
    );
  });

  const handleStudentSelect = (student: User) => {
    setFormData({ ...formData, studentId: String(student.id) });
    setStudentSearchTerm(`${student.name} (${student.code})`);
    setShowStudentDropdown(false);
  };

  const handleFilterStudentSelect = (student: User) => {
    setSearchStudentName(`${student.name} (${student.code})`);
    setShowFilterStudentDropdown(false);
  };

  const handleStudentInputChange = (value: string) => {
    setStudentSearchTerm(value);
    setShowStudentDropdown(true);

    // If input is cleared, clear the selected student
    if (!value) {
      setFormData({ ...formData, studentId: "" });
    }
  };

  const handleFilterStudentInputChange = (value: string) => {
    setSearchStudentName(value);
    setShowFilterStudentDropdown(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý điểm</h2>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2"
        >
          <Plus size={20} />
          Thêm điểm
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Search Student Name - with autocomplete */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm học sinh
            </label>
            <input
              type="text"
              value={searchStudentName}
              onChange={(e) => handleFilterStudentInputChange(e.target.value)}
              onFocus={() => setShowFilterStudentDropdown(true)}
              onBlur={() => {
                // Delay to allow click on dropdown
                setTimeout(() => setShowFilterStudentDropdown(false), 200);
              }}
              placeholder="Gõ tên hoặc mã học sinh..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {/* Dropdown list */}
            {showFilterStudentDropdown &&
              filteredStudentsForFilter.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredStudentsForFilter.slice(0, 50).map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => handleFilterStudentSelect(student)}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">
                        {student.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Mã: {student.code} • {student.email}
                      </div>
                    </button>
                  ))}
                  {filteredStudentsForFilter.length > 50 && (
                    <div className="px-3 py-2 text-sm text-gray-500 bg-gray-50">
                      Hiển thị 50/{filteredStudentsForFilter.length} kết quả. Gõ
                      thêm để lọc...
                    </div>
                  )}
                </div>
              )}

            {/* Show message when no results */}
            {showFilterStudentDropdown &&
              searchStudentName &&
              filteredStudentsForFilter.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-sm text-gray-500">
                  Không tìm thấy học sinh phù hợp
                </div>
              )}
          </div>

          {/* Filter by Class */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lọc theo lớp
            </label>
            <select
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả lớp</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.code ? `(${cls.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lọc theo môn
            </label>
            <select
              value={filterSubjectId}
              onChange={(e) => setFilterSubjectId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả môn</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} {subject.code ? `(${subject.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Term */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lọc theo học kỳ
            </label>
            <select
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả học kỳ</option>
              <option value="1">Học kỳ 1</option>
              <option value="2">Học kỳ 2</option>
            </select>
          </div>

          {/* Filter by Academic Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lọc theo năm học
            </label>
            <select
              value={filterAcademicYear}
              onChange={(e) => setFilterAcademicYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả năm học</option>
              {uniqueAcademicYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary and Reset Button */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Hiển thị{" "}
            <span className="font-semibold">{filteredGrades.length}</span> /{" "}
            {grades.length} điểm
          </div>
          {(filterClassId ||
            filterSubjectId ||
            filterTerm ||
            filterAcademicYear ||
            searchStudentName) && (
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Học sinh
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Môn học
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lớp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Loại điểm
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Học kỳ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Điểm
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Năm học
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày ghi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredGrades.map((grade) => (
              <tr key={grade.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {grade.student?.name || `ID ${grade.studentId}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {grade.subject?.name || `ID ${grade.subjectId}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {grade.class?.name || `ID ${grade.classId}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getGradeTypeLabel(grade.gradeType)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getTermLabel(grade.term)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1 text-sm font-bold rounded ${getGradeColor(
                      grade.gradeValue
                    )}`}
                  >
                    {grade.gradeValue}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {grade.academicYear}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(grade.recordedAt).toLocaleDateString("vi-VN")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleViewClick(grade)}
                    className="text-green-600 hover:text-green-900 mr-3 inline-flex items-center gap-1"
                    title="Xem chi tiết"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleOpenModal(grade)}
                    className="text-blue-600 hover:text-blue-900 mr-3 inline-flex items-center gap-1"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(grade)}
                    className="text-red-600 hover:text-red-900 inline-flex items-center"
                    title="Xóa điểm"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredGrades.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {grades.length === 0
            ? "Không có điểm nào"
            : "Không tìm thấy điểm phù hợp với bộ lọc"}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {editingGrade ? "Sửa điểm" : "Thêm điểm mới"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Student - with autocomplete */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Học sinh <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={studentSearchTerm}
                    onChange={(e) => handleStudentInputChange(e.target.value)}
                    onFocus={() => setShowStudentDropdown(true)}
                    onBlur={() => {
                      // Delay to allow click on dropdown
                      setTimeout(() => setShowStudentDropdown(false), 200);
                    }}
                    placeholder="Gõ tên hoặc mã học sinh..."
                    disabled={!!editingGrade}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.studentId
                        ? "border-red-500"
                        : "border-gray-300"
                    } ${editingGrade ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  />
                  {formErrors.studentId && (
                    <p className="mt-1 text-sm text-red-500">
                      {formErrors.studentId}
                    </p>
                  )}

                  {/* Dropdown list */}
                  {showStudentDropdown && filteredStudents.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredStudents.slice(0, 50).map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => handleStudentSelect(student)}
                          className={`w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 ${
                            formData.studentId === String(student.id)
                              ? "bg-blue-100"
                              : ""
                          }`}
                        >
                          <div className="font-medium text-gray-900">
                            {student.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Mã: {student.code} • {student.email}
                          </div>
                        </button>
                      ))}
                      {filteredStudents.length > 50 && (
                        <div className="px-3 py-2 text-sm text-gray-500 bg-gray-50">
                          Hiển thị 50/{filteredStudents.length} kết quả. Gõ thêm
                          để lọc...
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show message when no results */}
                  {showStudentDropdown &&
                    studentSearchTerm &&
                    filteredStudents.length === 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-sm text-gray-500">
                        Không tìm thấy học sinh phù hợp
                      </div>
                    )}
                </div>

                {/* Class */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lớp <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.classId}
                    onChange={(e) =>
                      setFormData({ ...formData, classId: e.target.value })
                    }
                    disabled={!!editingGrade}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.classId ? "border-red-500" : "border-gray-300"
                    } ${editingGrade ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  >
                    <option value="">Chọn lớp</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} {cls.code ? `(${cls.code})` : ""}
                      </option>
                    ))}
                  </select>
                  {formErrors.classId && (
                    <p className="mt-1 text-sm text-red-500">
                      {formErrors.classId}
                    </p>
                  )}
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Môn học <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) =>
                      setFormData({ ...formData, subjectId: e.target.value })
                    }
                    disabled={!!editingGrade}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.subjectId
                        ? "border-red-500"
                        : "border-gray-300"
                    } ${editingGrade ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  >
                    <option value="">Chọn môn học</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name} {subject.code ? `(${subject.code})` : ""}
                      </option>
                    ))}
                  </select>
                  {formErrors.subjectId && (
                    <p className="mt-1 text-sm text-red-500">
                      {formErrors.subjectId}
                    </p>
                  )}
                </div>

                {/* Grade Value */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Điểm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="10"
                    value={formData.gradeValue}
                    onChange={(e) =>
                      setFormData({ ...formData, gradeValue: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.gradeValue
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="0.0 - 10.0"
                  />
                  {formErrors.gradeValue && (
                    <p className="mt-1 text-sm text-red-500">
                      {formErrors.gradeValue}
                    </p>
                  )}
                </div>

                {/* Grade Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại điểm
                  </label>
                  <select
                    value={formData.gradeType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gradeType: e.target.value as GradeType,
                      })
                    }
                    disabled={!!editingGrade}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      editingGrade ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                  >
                    <option value="homework">Bài tập</option>
                    <option value="quiz">Kiểm tra</option>
                    <option value="midterm">Giữa kỳ</option>
                    <option value="final">Cuối kỳ</option>
                    <option value="assignment">Bài tập lớn</option>
                  </select>
                </div>

                {/* Term */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Học kỳ
                  </label>
                  <select
                    value={formData.term}
                    onChange={(e) =>
                      setFormData({ ...formData, term: e.target.value as Term })
                    }
                    disabled={!!editingGrade}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      editingGrade ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                  >
                    <option value="1">Học kỳ 1</option>
                    <option value="2">Học kỳ 2</option>
                    <option value="final">Cuối năm</option>
                  </select>
                </div>

                {/* Academic Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Năm học <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) =>
                      setFormData({ ...formData, academicYear: e.target.value })
                    }
                    disabled={!!editingGrade}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.academicYear
                        ? "border-red-500"
                        : "border-gray-300"
                    } ${editingGrade ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    placeholder="2024-2025"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Định dạng: YYYY-YYYY (VD: 2024-2025)
                  </p>
                  {formErrors.academicYear && (
                    <p className="mt-1 text-sm text-red-500">
                      {formErrors.academicYear}
                    </p>
                  )}
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hệ số
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="5"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData({ ...formData, weight: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) =>
                    setFormData({ ...formData, remarks: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập ghi chú (nếu có)"
                />
              </div>

              {formErrors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{formErrors.submit}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {saving
                    ? "Đang lưu..."
                    : editingGrade
                    ? "Cập nhật"
                    : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingGrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Chi tiết điểm số
              </h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Student Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Thông tin học sinh
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Tên học sinh</p>
                    <p className="text-sm font-medium text-gray-900">
                      {viewingGrade.student?.name ||
                        `ID ${viewingGrade.studentId}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Mã học sinh</p>
                    <p className="text-sm font-medium text-gray-900">
                      {viewingGrade.student?.code || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">
                      {viewingGrade.student?.email || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Class & Subject Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    Lớp học
                  </h4>
                  <p className="text-lg font-bold text-blue-700">
                    {viewingGrade.class?.name || `ID ${viewingGrade.classId}`}
                  </p>
                  {viewingGrade.class?.code && (
                    <p className="text-xs text-blue-600 mt-1">
                      Mã: {viewingGrade.class.code}
                    </p>
                  )}
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-green-900 mb-2">
                    Môn học
                  </h4>
                  <p className="text-lg font-bold text-green-700">
                    {viewingGrade.subject?.name ||
                      `ID ${viewingGrade.subjectId}`}
                  </p>
                  {viewingGrade.subject?.code && (
                    <p className="text-xs text-green-600 mt-1">
                      Mã: {viewingGrade.subject.code}
                    </p>
                  )}
                </div>
              </div>

              {/* Grade Info */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Điểm số</p>
                    <p
                      className={`text-3xl font-bold ${
                        viewingGrade.gradeValue >= 8
                          ? "text-green-600"
                          : viewingGrade.gradeValue >= 6.5
                          ? "text-blue-600"
                          : viewingGrade.gradeValue >= 5
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {viewingGrade.gradeValue}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Hệ số</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {viewingGrade.weight || 1}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Loại điểm</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {getGradeTypeLabel(viewingGrade.gradeType)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Academic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Học kỳ
                  </label>
                  <p className="text-sm text-gray-900 px-3 py-2 bg-gray-100 rounded">
                    {getTermLabel(viewingGrade.term)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Năm học
                  </label>
                  <p className="text-sm text-gray-900 px-3 py-2 bg-gray-100 rounded">
                    {viewingGrade.academicYear}
                  </p>
                </div>
              </div>

              {/* Timestamps */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày ghi điểm
                </label>
                <p className="text-sm text-gray-900 px-3 py-2 bg-gray-100 rounded">
                  {new Date(viewingGrade.recordedAt).toLocaleString("vi-VN")}
                </p>
              </div>

              {/* Remarks */}
              {viewingGrade.remarks && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-900">
                    {viewingGrade.remarks}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleOpenModal(viewingGrade);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
              >
                <Edit size={16} />
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingGrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-red-600">Xác nhận xóa</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Bạn có chắc chắn muốn xóa điểm này?
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <p>
                  <span className="font-medium">Học sinh:</span>{" "}
                  {deletingGrade.student?.name}
                </p>
                <p>
                  <span className="font-medium">Môn học:</span>{" "}
                  {deletingGrade.subject?.name}
                </p>
                <p>
                  <span className="font-medium">Điểm:</span>{" "}
                  {deletingGrade.gradeValue}
                </p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ Hành động này không thể hoàn tác!
                </p>
              </div>
            </div>

            {formErrors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800">{formErrors.submit}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                {saving ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
