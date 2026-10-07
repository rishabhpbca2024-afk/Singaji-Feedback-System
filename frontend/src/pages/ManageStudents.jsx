import { useEffect, useState, useRef } from "react";
import {
  FiArrowLeft,
  FiLoader,
  FiEye,
  FiEyeOff,
  FiSave,
  FiCheckCircle,
  FiCheck,
  FiX,
  FiSearch,
  FiUserPlus,
  FiUploadCloud,
  FiDownload,
  FiTrash2,
  FiFileText,
  FiAlertTriangle,
  FiUsers,
} from "react-icons/fi";

import itegImage from "../assets/iteg.png";
import megImage from "../assets/meg.png";
import begImage from "../assets/beg.png";
import ssecImage from "../assets/ssec.png";

import Modal from "../components/Modal.jsx";
import CustomSelect from "../components/CustomSelect.jsx";

import "./ManageStudents.css";

const API_URL = import.meta.env.VITE_API_URL;

const DEPARTMENTS = [
  {
    name: "ITEG",
    title: "Information Technology & Emerging Giants",
    image: itegImage,
  },
  {
    name: "MEG",
    title: "Management & Economics Group",
    image: megImage,
  },
  {
    name: "BEG",
    title: "Basic Engineering & Sciences Group",
    image: begImage,
  },
  {
    name: "B.Tech",
    title: "Bachelor of Technology Engineering",
    image: ssecImage,
  },
];

const LEVELS = ["1A", "1B", "1C", "2A", "2B", "2C"];

function ManageStudents() {
  /* ========================================
     NAVIGATION & SELECTION STATES
  ======================================== */
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [saveSuccessMessage, setSaveSuccessMessage] = useState("");

  const [showSelectedStudents, setShowSelectedStudents] = useState(false);
  const [savedStudents, setSavedStudents] = useState([]);
  const [loadingSelectedStudents, setLoadingSelectedStudents] = useState(false);

  const [studentData, setStudentData] = useState({
    ITEG: {},
    MEG: {},
    BEG: {},
    "B.Tech": {},
  });

  /* ========================================
     ADD STUDENT MODAL STATES
  ======================================== */
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "",
    studentId: "",
    gmail: "",
    section: "ITEG",
    level: "1A",
    password: "",
  });

  /* ========================================
     EXCEL BULK UPLOAD MODAL STATES
  ======================================== */
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [excelDefaultDept, setExcelDefaultDept] = useState("ITEG");
  const [excelDefaultLevel, setExcelDefaultLevel] = useState("1A");
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const fileInputRef = useRef(null);

  /* ========================================
     FETCH STUDENTS
  ======================================== */
  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/students`, {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        console.error(data.message);
        return;
      }

      if (data.success) {
        setStudentData(data.sections || {});
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  /* ========================================
     TOTAL COUNTS HELPERS
  ======================================== */
  const getDeptTotalCount = (deptName) => {
    const dept = studentData[deptName];
    if (!dept) return 0;
    return Object.values(dept).reduce(
      (sum, list) => sum + (Array.isArray(list) ? list.length : 0),
      0
    );
  };

  const getLevelCount = (deptName, levelName) => {
    return studentData[deptName]?.[levelName]?.length || 0;
  };

  /* ========================================
     CURRENT STUDENT LIST & SEARCH
  ======================================== */
  const currentStudentsList =
    selectedDepartment && selectedLevel
      ? (studentData[selectedDepartment]?.[selectedLevel] || []).map(
          (student) => ({
            id: student.studentId,
            mongoId: student._id,
            name: student.name,
            email: student.gmail,
            section: student.section,
            level: student.level,
          })
        )
      : [];

  const filteredStudents = currentStudentsList.filter((student) => {
    if (selectedStudents.includes(student.id)) return false;
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;
    return (
      student.name.toLowerCase().includes(search) ||
      student.email.toLowerCase().includes(search) ||
      student.id.toLowerCase().includes(search)
    );
  });

  /* ========================================
     NAVIGATION HANDLERS
  ======================================== */
  const handleDepartmentClick = (deptName) => {
    setSelectedDepartment(deptName);
    setSelectedLevel(null);
    setSelectedStudents([]);
    setSearchTerm("");
    setSaveSuccessMessage("");
    setShowSelectedStudents(false);
    setSavedStudents([]);
  };

  const handleLevelClick = (levelName) => {
    setSelectedLevel(levelName);
    setSelectedStudents([]);
    setSearchTerm("");
    setSaveSuccessMessage("");
    setShowSelectedStudents(false);
    setSavedStudents([]);
  };

  const handleBackToDepartments = () => {
    setSelectedDepartment(null);
    setSelectedLevel(null);
    setSelectedStudents([]);
    setSearchTerm("");
    setSaveSuccessMessage("");
    setShowSelectedStudents(false);
    setSavedStudents([]);
  };

  const handleBackToLevels = () => {
    setSelectedLevel(null);
    setSelectedStudents([]);
    setSearchTerm("");
    setSaveSuccessMessage("");
    setShowSelectedStudents(false);
    setSavedStudents([]);
  };

  /* ========================================
     STUDENT SELECTION (SAMPLING QUOTA)
  ======================================== */
  const handleStudentSelect = (studentId) => {
    setSaveSuccessMessage("");
    setSelectedStudents((currentSelected) => {
      if (currentSelected.includes(studentId)) {
        return currentSelected.filter((id) => id !== studentId);
      }
      if (currentSelected.length >= 10) {
        alert("Maximum 10 students can be selected for feedback quota.");
        return currentSelected;
      }
      return [...currentSelected, studentId];
    });
  };

  const handleSave = async () => {
    if (selectedStudents.length !== 10) {
      alert("Please select exactly 10 students before saving.");
      return;
    }

    try {
      const selectedStudentData = currentStudentsList
        .filter((student) => selectedStudents.includes(student.id))
        .map((student) => ({
          name: student.name,
          gmail: student.email,
        }));

      const response = await fetch(`${API_URL}/api/selected-students`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          department: selectedDepartment,
          level: selectedLevel,
          students: selectedStudentData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to save students.");
        return;
      }

      if (data.success) {
        setSaveSuccessMessage(
          `Selection saved successfully! 10 students assigned for ${selectedDepartment} — Level ${selectedLevel}.`
        );
        setSelectedStudents([]);
        setTimeout(() => {
          setSaveSuccessMessage("");
        }, 3500);
      }
    } catch (error) {
      console.error("Error saving selected students:", error);
      alert("Something went wrong while saving students.");
    }
  };

  const handleViewSelectedStudents = async () => {
    if (!selectedDepartment || !selectedLevel) return;

    if (showSelectedStudents) {
      setShowSelectedStudents(false);
      setSavedStudents([]);
      return;
    }

    setLoadingSelectedStudents(true);
    try {
      const response = await fetch(
        `${API_URL}/api/selected-students?department=${encodeURIComponent(
          selectedDepartment
        )}&level=${encodeURIComponent(selectedLevel)}`,
        { credentials: "include" }
      );
      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to fetch selected students.");
        return;
      }

      if (data.success) {
        setSavedStudents(data.data || []);
        setShowSelectedStudents(true);
      }
    } catch (error) {
      console.error("Error fetching selected students:", error);
      alert("Something went wrong while fetching selected students.");
    } finally {
      setLoadingSelectedStudents(false);
    }
  };

  /* ========================================
     MODAL OPEN TRIGGERS
  ======================================== */
  const openAddStudentModal = (dept = null, lvl = null) => {
    setNewStudent({
      name: "",
      studentId: "",
      gmail: "",
      section: dept || selectedDepartment || "ITEG",
      level: lvl || selectedLevel || "1A",
      password: "",
    });
    setIsAddModalOpen(true);
  };

  const openExcelModal = (dept = null, lvl = null) => {
    setExcelFile(null);
    setUploadResult(null);
    setExcelDefaultDept(dept || selectedDepartment || "ITEG");
    setExcelDefaultLevel(lvl || selectedLevel || "1A");
    setIsExcelModalOpen(true);
  };

  /* ========================================
     DOWNLOAD SAMPLE TEMPLATE
  ======================================== */
  const handleDownloadTemplate = async (
    dept = selectedDepartment || "ITEG",
    lvl = selectedLevel || "1A"
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/api/students/template?department=${encodeURIComponent(
          dept
        )}&level=${encodeURIComponent(lvl)}`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to download template");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `Students_Template_${dept}_${lvl}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert("Error downloading template: " + err.message);
    }
  };

  /* ========================================
     SUBMIT MANUAL SINGLE STUDENT
  ======================================== */
  const handleAddStudentSubmit = async (e) => {
    e.preventDefault();
    if (!newStudent.name.trim() || !newStudent.gmail.trim()) {
      alert("Please provide at least a student name and email.");
      return;
    }

    setIsSubmittingStudent(true);
    try {
      const response = await fetch(`${API_URL}/api/students`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudent),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Failed to add student.");
        setIsSubmittingStudent(false);
        return;
      }

      alert(data.message || "Student added successfully!");
      setIsAddModalOpen(false);
      await fetchStudents();
    } catch (err) {
      console.error(err);
      alert("Something went wrong while adding student.");
    } finally {
      setIsSubmittingStudent(false);
    }
  };

  /* ========================================
     EXCEL BULK UPLOAD SUBMIT
  ======================================== */
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setExcelFile(file);
      setUploadResult(null);
    }
  };

  const handleExcelUploadSubmit = async (e) => {
    e.preventDefault();
    if (!excelFile) {
      alert("Please choose an Excel or CSV file to upload.");
      return;
    }

    setIsUploadingExcel(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", excelFile);
    formData.append("defaultSection", excelDefaultDept);
    formData.append("defaultLevel", excelDefaultLevel);

    try {
      const response = await fetch(`${API_URL}/api/students/upload-excel`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Failed to import students from file.");
        setIsUploadingExcel(false);
        return;
      }

      setUploadResult(data);
      await fetchStudents();
    } catch (err) {
      console.error("Excel upload error:", err);
      alert("Something went wrong during file upload.");
    } finally {
      setIsUploadingExcel(false);
    }
  };

  /* ========================================
     DELETE STUDENT HANDLER
  ======================================== */
  const handleDeleteStudent = async (studentId, studentName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete student "${studentName}" (${studentId})?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/students/${encodeURIComponent(studentId)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to delete student.");
        return;
      }

      // Remove from selected list if present
      setSelectedStudents((prev) => prev.filter((id) => id !== studentId));
      await fetchStudents();
    } catch (err) {
      console.error("Delete student error:", err);
      alert("Failed to delete student.");
    }
  };

  /* ========================================
     RENDER UI
  ======================================== */
  return (
    <div className="manage-students">
      {/* ──────────────────────────────────────────
          STEP 1: DEPARTMENT SELECTION
      ────────────────────────────────────────── */}
      {!selectedDepartment && (
        <section>
          <div className="students-header-row">
            <div className="students-header">
              <h1>Students Management</h1>
              <p>
                Add students manually or import via Excel for each department.
              </p>
            </div>

            <div className="students-action-group">
              <button
                type="button"
                className="btn-add-primary"
                onClick={() => openAddStudentModal()}
              >
                <FiUserPlus size={16} />
                <span>+ Add Student</span>
              </button>

              <button
                type="button"
                className="btn-import-excel"
                onClick={() => openExcelModal()}
              >
                <FiUploadCloud size={16} />
                <span>Import Excel / CSV</span>
              </button>

              <button
                type="button"
                className="btn-download-template"
                onClick={() => handleDownloadTemplate("ITEG", "1A")}
                title="Download Excel Template"
              >
                <FiDownload size={14} />
                <span>Template</span>
              </button>
            </div>
          </div>

          <div className="department-grid">
            {DEPARTMENTS.map((dept) => {
              const totalCount = getDeptTotalCount(dept.name);
              return (
                <div
                  key={dept.name}
                  className="department-card"
                  onClick={() => handleDepartmentClick(dept.name)}
                >
                  <img
                    src={dept.image}
                    alt={dept.name}
                    className="department-image"
                  />
                  <h2>{dept.name}</h2>
                  <p className="department-title">{dept.title}</p>
                  <span className="dept-student-badge">
                    <FiUsers size={12} />
                    {totalCount} Student{totalCount === 1 ? "" : "s"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ──────────────────────────────────────────
          STEP 2: LEVEL SELECTION (INSIDE DEPT)
      ────────────────────────────────────────── */}
      {selectedDepartment && !selectedLevel && (
        <section>
          <button className="back-button" onClick={handleBackToDepartments}>
            <FiArrowLeft style={{ marginRight: "6px", verticalAlign: "-2px" }} />
            Back to Departments
          </button>

          <div className="students-header-row">
            <div className="students-header">
              <h1>{selectedDepartment} Department</h1>
              <p>
                Select a class level or add students to {selectedDepartment}.
              </p>
            </div>

            <div className="students-action-group">
              <button
                type="button"
                className="btn-add-primary"
                onClick={() => openAddStudentModal(selectedDepartment)}
              >
                <FiUserPlus size={16} />
                <span>+ Add Student</span>
              </button>

              <button
                type="button"
                className="btn-import-excel"
                onClick={() => openExcelModal(selectedDepartment)}
              >
                <FiUploadCloud size={16} />
                <span>Import Excel to {selectedDepartment}</span>
              </button>

              <button
                type="button"
                className="btn-download-template"
                onClick={() => handleDownloadTemplate(selectedDepartment, "1A")}
              >
                <FiDownload size={14} />
                <span>Template</span>
              </button>
            </div>
          </div>

          <div className="level-grid">
            {LEVELS.map((level) => {
              const count = getLevelCount(selectedDepartment, level);
              return (
                <div
                  key={level}
                  className="level-card"
                  onClick={() => handleLevelClick(level)}
                >
                  <span className="level-badge">Level</span>
                  <h2>{level}</h2>
                  <span className="level-student-badge">
                    {count} Student{count === 1 ? "" : "s"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ──────────────────────────────────────────
          STEP 3: STUDENT SAMPLING & LIST
      ────────────────────────────────────────── */}
      {selectedDepartment && selectedLevel && (
        <section>
          <button className="back-button" onClick={handleBackToLevels}>
            <FiArrowLeft style={{ marginRight: "6px", verticalAlign: "-2px" }} />
            Back to Levels
          </button>

          {/* ── TOP ACTION BAR ── */}
          <div className="action-bar-top">
            <div className="student-page-title">
              <h1>
                {selectedDepartment} — Level {selectedLevel}
              </h1>
              <p>
                Manage students & select exactly 10 students for feedback quota.
              </p>
            </div>

            <div className="top-controls-group">
              <button
                type="button"
                className="btn-add-primary"
                onClick={() =>
                  openAddStudentModal(selectedDepartment, selectedLevel)
                }
              >
                <FiUserPlus size={15} />
                <span>+ Add Student</span>
              </button>

              <button
                type="button"
                className="btn-import-excel"
                onClick={() =>
                  openExcelModal(selectedDepartment, selectedLevel)
                }
              >
                <FiUploadCloud size={15} />
                <span>Import Excel</span>
              </button>

              {/* Selection counter */}
              <div
                className={`selection-counter-badge ${
                  selectedStudents.length === 10 ? "count-complete" : ""
                }`}
              >
                <span className="counter-dot"></span>
                <span>
                  Selected: <strong>{selectedStudents.length} / 10</strong>
                </span>
              </div>

              {/* View Selected Students button */}
              <button
                className={`view-selected-btn ${
                  showSelectedStudents ? "view-selected-btn--active" : ""
                }`}
                onClick={handleViewSelectedStudents}
                disabled={loadingSelectedStudents}
              >
                {loadingSelectedStudents ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <FiLoader className="spin" /> Loading...
                  </span>
                ) : showSelectedStudents ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <FiEyeOff /> Hide Selected
                  </span>
                ) : (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <FiEye /> View Selected (10)
                  </span>
                )}
              </button>

              {/* Save button */}
              <button
                className="save-button"
                onClick={handleSave}
                disabled={selectedStudents.length !== 10}
              >
                <FiSave style={{ marginRight: "6px", verticalAlign: "-2px" }} />
                Save Selection
              </button>
            </div>
          </div>

          {/* SUCCESS TOAST */}
          {saveSuccessMessage && (
            <div className="save-success-toast">
              <span className="toast-icon">
                <FiCheckCircle />
              </span>
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          {/* SELECTED STUDENTS PANEL */}
          {showSelectedStudents && (
            <div className="selected-students-container">
              <div className="selected-students-header">
                <div>
                  <h2>
                    <FiCheckCircle
                      style={{
                        color: "#10b981",
                        marginRight: "8px",
                        verticalAlign: "-2px",
                      }}
                    />
                    Currently Saved Selected Students
                  </h2>
                  <p>
                    {selectedDepartment} — Level {selectedLevel}
                  </p>
                </div>
                <span className="selected-total">
                  {savedStudents.length} / 10
                </span>
              </div>

              {savedStudents.length > 0 ? (
                <div className="selected-students-table-wrap">
                  <table className="selected-students-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Student Name</th>
                        <th>Email</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedStudents.map((student, index) => (
                        <tr key={student._id || index}>
                          <td>
                            <span className="student-number">{index + 1}</span>
                          </td>
                          <td>
                            <div className="table-user-cell">
                              <div className="avatar-circle">
                                {student.name?.charAt(0).toUpperCase()}
                              </div>
                              <span className="user-name">{student.name}</span>
                            </div>
                          </td>
                          <td className="text-secondary">{student.gmail}</td>
                          <td>
                            <span className="status-pill pill-active">
                              Selected
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-selected-students">
                  No students currently saved for this department and level.
                </div>
              )}
            </div>
          )}

          {/* SELECTED STUDENTS MINI PANEL */}
          {selectedStudents.length > 0 && (
            <div className="selected-mini-panel">
              <div className="selected-mini-header">
                <div className="selected-mini-title">
                  <span className="selected-mini-icon">
                    <FiCheckCircle style={{ color: "#10b981" }} />
                  </span>
                  <span>Currently Chosen for Submission</span>
                </div>
                <span
                  className={`selected-mini-count ${
                    selectedStudents.length === 10 ? "count-full" : ""
                  }`}
                >
                  {selectedStudents.length} / 10
                </span>
              </div>

              <div className="selected-mini-list">
                {currentStudentsList
                  .filter((s) => selectedStudents.includes(s.id))
                  .map((student, index) => (
                    <div key={student.id} className="selected-mini-row">
                      <span className="selected-mini-num">{index + 1}</span>
                      <div className="selected-mini-info">
                        <span className="selected-mini-name">
                          {student.name}
                        </span>
                        <span className="selected-mini-email">
                          {student.email} ({student.id})
                        </span>
                      </div>
                      <button
                        className="remove-student-btn"
                        onClick={() => handleStudentSelect(student.id)}
                        title="Remove student"
                      >
                        <FiX
                          style={{
                            marginRight: "4px",
                            verticalAlign: "-1px",
                          }}
                        />
                        Remove
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* SEARCH */}
          <div className="student-search">
            <span className="search-icon">
              <FiSearch />
            </span>
            <input
              type="text"
              placeholder="Search student by name, ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* STUDENT DATA TABLE */}
          <div className="data-table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 44 }}>Select</th>
                  <th>Student Name</th>
                  <th>Student ID / Roll No</th>
                  <th>Email</th>
                  <th>Section</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => {
                    const isSelected = selectedStudents.includes(student.id);
                    return (
                      <tr
                        key={student.id}
                        className={isSelected ? "row-selected" : ""}
                        onClick={() => handleStudentSelect(student.id)}
                      >
                        <td>
                          <input
                            type="checkbox"
                            className="custom-checkbox"
                            checked={isSelected}
                            onChange={() => handleStudentSelect(student.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td>
                          <div className="table-user-cell">
                            <div
                              className={`avatar-circle ${
                                isSelected ? "avatar-selected" : ""
                              }`}
                            >
                              {student.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="user-name">{student.name}</span>
                          </div>
                        </td>
                        <td>
                          <code
                            style={{
                              background: "#f1f5f9",
                              padding: "3px 8px",
                              borderRadius: "6px",
                              fontWeight: 700,
                              fontSize: "12px",
                              color: "#334155",
                            }}
                          >
                            {student.id}
                          </code>
                        </td>
                        <td className="text-secondary">{student.email}</td>
                        <td>
                          <span className="dept-badge">{selectedLevel}</span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="btn-table-delete"
                            onClick={() =>
                              handleDeleteStudent(student.id, student.name)
                            }
                            title="Delete Student"
                          >
                            <FiTrash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="no-data-cell">
                      {searchTerm
                        ? "No students found matching your search."
                        : `No registered students found in ${selectedDepartment} (${selectedLevel}). Click "+ Add Student" or "Import Excel" above to add students.`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* BOTTOM SAVE BAR */}
          <div className="save-section">
            <p>
              Feedback quota: Exactly 10 students required. Selected:{" "}
              <strong>{selectedStudents.length} / 10</strong>
            </p>

            <button
              className="save-button"
              onClick={handleSave}
              disabled={selectedStudents.length !== 10}
            >
              <FiSave style={{ marginRight: "6px", verticalAlign: "-2px" }} />
              Save Selection
            </button>
          </div>
        </section>
      )}

      {/* ──────────────────────────────────────────
          MODAL 1: ADD SINGLE STUDENT
      ────────────────────────────────────────── */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !isSubmittingStudent && setIsAddModalOpen(false)}
        title="Add New Student"
      >
        <form onSubmit={handleAddStudentSubmit}>
          <div className="modal-form-group">
            <label>Student Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Aman Sharma"
              value={newStudent.name}
              onChange={(e) =>
                setNewStudent({ ...newStudent, name: e.target.value })
              }
            />
          </div>

          <div className="modal-form-group">
            <label>Student ID / Roll Number *</label>
            <input
              type="text"
              required
              placeholder="e.g. ITEG-2024-001 or 0827IT221001"
              value={newStudent.studentId}
              onChange={(e) =>
                setNewStudent({ ...newStudent, studentId: e.target.value })
              }
            />
          </div>

          <div className="modal-form-group">
            <label>Student Gmail / Email *</label>
            <input
              type="email"
              required
              placeholder="e.g. aman.sharma@example.com"
              value={newStudent.gmail}
              onChange={(e) =>
                setNewStudent({ ...newStudent, gmail: e.target.value })
              }
            />
          </div>

          <div className="modal-form-group">
            <label>Department / Section *</label>
            <CustomSelect
              value={newStudent.section}
              onChange={(e) =>
                setNewStudent({ ...newStudent, section: e.target.value })
              }
              options={DEPARTMENTS.map((d) => d.name)}
            />
          </div>

          <div className="modal-form-group">
            <label>Class Level *</label>
            <CustomSelect
              value={newStudent.level}
              onChange={(e) =>
                setNewStudent({ ...newStudent, level: e.target.value })
              }
              options={LEVELS}
            />
          </div>

          <div className="modal-form-group">
            <label>Initial Password (Optional — default is student123)</label>
            <input
              type="text"
              placeholder="student123"
              value={newStudent.password}
              onChange={(e) =>
                setNewStudent({ ...newStudent, password: e.target.value })
              }
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmittingStudent}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmittingStudent}
            >
              {isSubmittingStudent ? "Adding Student..." : "Add Student"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ──────────────────────────────────────────
          MODAL 2: BULK IMPORT VIA EXCEL / CSV
      ────────────────────────────────────────── */}
      <Modal
        isOpen={isExcelModalOpen}
        onClose={() => !isUploadingExcel && setIsExcelModalOpen(false)}
        title="Import Students via Excel / CSV"
      >
        <div className="excel-modal-body">
          {/* Tip & Template Download */}
          <div className="template-tip-card">
            <div className="template-tip-text">
              <strong>Need the Excel format?</strong>
              Download our ready-to-use template with correct columns.
            </div>
            <button
              type="button"
              className="btn-template-sm"
              onClick={() =>
                handleDownloadTemplate(excelDefaultDept, excelDefaultLevel)
              }
            >
              <FiDownload size={13} />
              <span>Download Template</span>
            </button>
          </div>

          <form onSubmit={handleExcelUploadSubmit}>
            {/* File Dropzone */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
            />

            <div
              className={`excel-dropzone ${excelFile ? "has-file" : ""}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <FiUploadCloud className="excel-dropzone-icon" />
              <div className="excel-dropzone-title">
                {excelFile ? excelFile.name : "Click to choose Excel / CSV file"}
              </div>
              <div className="excel-dropzone-sub">
                Supports .xlsx, .xls, and .csv files up to 10MB
              </div>
            </div>

            {excelFile && (
              <div className="selected-file-info">
                <div className="file-name-meta">
                  <FiFileText style={{ color: "#ea580c" }} />
                  <span>
                    {excelFile.name} ({(excelFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-remove-file"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExcelFile(null);
                    setUploadResult(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  title="Remove file"
                >
                  <FiX size={18} />
                </button>
              </div>
            )}

            {/* Department default */}
            <div className="modal-form-group" style={{ marginTop: "14px" }}>
              <label>Default Department (applied if omitted in Excel row)</label>
              <CustomSelect
                value={excelDefaultDept}
                onChange={(e) => setExcelDefaultDept(e.target.value)}
                options={DEPARTMENTS.map((d) => d.name)}
              />
            </div>

            {/* Level default */}
            <div className="modal-form-group">
              <label>Default Level (applied if omitted in Excel row)</label>
              <CustomSelect
                value={excelDefaultLevel}
                onChange={(e) => setExcelDefaultLevel(e.target.value)}
                options={LEVELS}
              />
            </div>

            {/* Upload Result Feedback */}
            {uploadResult && (
              <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div className="upload-result-success">
                  <FiCheckCircle style={{ marginRight: "6px", verticalAlign: "-2px" }} />
                  {uploadResult.message}
                </div>

                {uploadResult.skippedCount > 0 && uploadResult.skippedDetails?.length > 0 && (
                  <div className="upload-result-skipped">
                    <strong>
                      <FiAlertTriangle style={{ marginRight: "4px", verticalAlign: "-2px" }} />
                      Skipped Rows Details ({uploadResult.skippedCount}):
                    </strong>
                    <ul>
                      {uploadResult.skippedDetails.map((item, idx) => (
                        <li key={idx}>
                          Row {item.row} {item.name ? `(${item.name})` : ""}: {item.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsExcelModalOpen(false)}
                disabled={isUploadingExcel}
              >
                {uploadResult ? "Done" : "Cancel"}
              </button>

              <button
                type="submit"
                className="btn-primary"
                disabled={!excelFile || isUploadingExcel}
              >
                {isUploadingExcel ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <FiLoader className="spin" /> Importing...
                  </span>
                ) : (
                  "Upload & Import Students"
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}

export default ManageStudents;