import { useEffect, useState } from "react";
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
} from "react-icons/fi";

import itegImage from "../assets/iteg.png";
import megImage from "../assets/meg.png";
import begImage from "../assets/beg.png";
import ssecImage from "../assets/ssec.png";

import "./ManageStudents.css";

const API_URL = import.meta.env.VITE_API_URL;


function ManageStudents() {

  /* ========================================
     STATES
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


  const departments = [
    {
      name: "ITEG",
      image: itegImage,
    },
    {
      name: "MEG",
      image: megImage,
    },
    {
      name: "BEG",
      image: begImage,
    },
    {
      name: "B.Tech",
      image: ssecImage,
    },
  ];

  const levels = ["1A", "1B", "1C", "2A", "2B", "2C"];
    const authUser = JSON.parse(localStorage.getItem("authUser"));

  useEffect(() => {
    const fetchStudents = async () => {
      try {
       

         const response = await fetch(
         `${API_URL}/api/students`,
        {
          credentials: "include",
       }
      );
        const data = await response.json();

        if (!response.ok) {
          console.error(data.message);
          return;
        }

        if (data.success) {
          setStudentData(data.sections);
        }
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    fetchStudents();
  }, []);

  /* ========================================
     DEPARTMENTS
  ======================================== */

  const currentStudentsList =
    selectedDepartment && selectedLevel
      ? (studentData[selectedDepartment]?.[selectedLevel] || []).map(
        (student) => ({
          id: student.studentId,
          name: student.name,
          email: student.gmail,
          section: student.section,
          level: student.level,
        })
      )
      : [];
  /* ========================================
     FILTER STUDENTS
  ======================================== */

  const filteredStudents = currentStudentsList.filter((student) => {
    // Hide already selected students from the list
    if (selectedStudents.includes(student.id)) return false;

    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;
    return (
      student.name.toLowerCase().includes(search) ||
      student.email.toLowerCase().includes(search)
    );
  });


  /* ========================================
     HANDLERS
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


      const response = await fetch(
        `${API_URL}/api/selected-students`,
        {
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
        }
      );

      const data = await response.json();


      if (!response.ok) {
        alert(data.message || "Failed to save students.");
        return;
      }

      if (data.success) {
        setSaveSuccessMessage(
          `Selection saved successfully! 10 students have been assigned for ${selectedDepartment} — Level ${selectedLevel}.`
        );

        setSelectedStudents([]);

        setTimeout(() => {
          setSaveSuccessMessage("");
        }, 3000);

      }
    } catch (error) {
      console.error("Error saving selected students:", error);
      alert("Something went wrong while saving students.");
    }
  };


  const handleViewSelectedStudents = async () => {
    if (!selectedDepartment || !selectedLevel) {
      return;
    }

    // Toggle off if already showing
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
        {
        credentials: "include",
  }
);

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to fetch selected students.");
        return;
      }

      if (data.success) {
        setSavedStudents(data.data);
        setShowSelectedStudents(true);
      }
    } catch (error) {
      console.error("Error fetching selected students:", error);
      alert("Something went wrong while fetching selected students.");
    } finally {
      setLoadingSelectedStudents(false);
    }
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
     UI
  ======================================== */

  return (
    <div className="manage-students">

      {/* STEP 1: DEPARTMENT SELECTION */}
      {!selectedDepartment && (
        <section>
          <div className="students-header">
            <h1>Students Management</h1>
            <p>Select a department to view and manage student evaluation groups.</p>
          </div>

          <div className="department-grid">
            {departments.map((department) => (
              <div
                key={department.name}
                className="department-card"
                onClick={() => handleDepartmentClick(department.name)}
              >
                <img
                  src={department.image}
                  alt={department.name}
                  className="department-image"
                />
                <h2>{department.name}</h2>
                <p className="department-title">{department.title}</p>
              </div>
            ))}
          </div>
        </section>
      )}


      {/* STEP 2: LEVEL SELECTION */}
      {selectedDepartment && !selectedLevel && (
        <section>
          <button className="back-button" onClick={handleBackToDepartments}>
            <FiArrowLeft style={{ marginRight: "6px", verticalAlign: "-2px" }} />
            Back to Departments
          </button>

          <div className="students-header">
            <h1>{selectedDepartment} Department</h1>
            <p>Select a section level for {selectedDepartment}.</p>
          </div>

          <div className="level-grid">
            {levels.map((level) => (
              <div
                key={level}
                className="level-card"
                onClick={() => handleLevelClick(level)}
              >
                <span className="level-badge">Level</span>
                <h2>{level}</h2>
                <p>Click to view students</p>
              </div>
            ))}
          </div>
        </section>
      )}


      {/* STEP 3: STUDENT SELECTION */}
      {selectedDepartment && selectedLevel && (
        <section>
          <button className="back-button" onClick={handleBackToLevels}>
            <FiArrowLeft style={{ marginRight: "6px", verticalAlign: "-2px" }} />
            Back to Levels
          </button>

          {/* ── TOP ACTION BAR ── */}
          <div className="action-bar-top">
            <div className="student-page-title">
              <h1>{selectedDepartment} — Level {selectedLevel}</h1>
              <p>Select exactly 10 students for feedback sampling.</p>
            </div>

            <div className="top-controls-group">
              {/* Selection counter */}
              <div className={`selection-counter-badge ${selectedStudents.length === 10 ? "count-complete" : ""}`}>
                <span className="counter-dot"></span>
                <span>Selected: <strong>{selectedStudents.length} / 10</strong></span>
              </div>

              {/* View Selected Students button — always visible at top */}
              <button
                className={`view-selected-btn ${showSelectedStudents ? "view-selected-btn--active" : ""}`}
                onClick={handleViewSelectedStudents}
                disabled={loadingSelectedStudents}
              >
                {loadingSelectedStudents ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <FiLoader className="spin" /> Loading...
                  </span>
                ) : showSelectedStudents ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <FiEyeOff /> Hide Selected
                  </span>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <FiEye /> View Selected Students
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

          {/* SELECTED STUDENTS PANEL (shows below action bar when toggled) */}
          {showSelectedStudents && (
            <div className="selected-students-container">
              <div className="selected-students-header">
                <div>
                  <h2>
                    <FiCheckCircle style={{ color: "#10b981", marginRight: "8px", verticalAlign: "-2px" }} />
                    Currently Selected Students
                  </h2>
                  <p>{selectedDepartment} — Level {selectedLevel}</p>
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
                        <tr key={student._id}>
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
                            <span className="status-pill pill-active">Selected</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-selected-students">
                  No students have been selected for this department and level yet.
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
                  <span>Selected Students</span>
                </div>
                <span className={`selected-mini-count ${selectedStudents.length === 10 ? "count-full" : ""}`}>
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
                        <span className="selected-mini-name">{student.name}</span>
                        <span className="selected-mini-email">{student.email}</span>
                      </div>
                      <button
                        className="remove-student-btn"
                        onClick={() => handleStudentSelect(student.id)}
                        title="Remove student"
                      >
                        <FiX style={{ marginRight: "4px", verticalAlign: "-1px" }} />
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
              placeholder="Search student by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* STUDENT TABLE */}
          <div className="data-table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Section</th>
                  <th>Status</th>
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
                            <div className={`avatar-circle ${isSelected ? "avatar-selected" : ""}`}>
                              {student.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="user-name">{student.name}</span>
                          </div>
                        </td>
                        <td className="text-secondary">{student.email}</td>
                        <td>
                          <span className="dept-badge">{selectedLevel}</span>
                        </td>
                        <td>
                          <span className={`status-pill ${isSelected ? "pill-active" : ""}`}>
                            {isSelected ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <FiCheck /> Selected
                              </span>
                            ) : (
                              "Unselected"
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="no-data-cell">
                      No students found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* BOTTOM SAVE BAR */}
          <div className="save-section">
            <p>
              Requirements: Exactly 10 students required. Currently selected:{" "}
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

    </div>
  );
}

export default ManageStudents;