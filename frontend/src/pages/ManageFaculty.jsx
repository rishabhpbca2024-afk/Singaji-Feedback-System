import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiPlus, FiTrash2 } from "react-icons/fi";

import itegImage from "../assets/iteg.png";
import megImage from "../assets/meg.png";
import begImage from "../assets/beg.png";
import ssecImage from "../assets/ssec.png";
import Modal from "../components/Modal.jsx";

import "./ManageFaculty.css";

const API_URL = import.meta.env.VITE_API_URL;

function ManageFaculty() {
  const navigate = useNavigate();

  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  

  const [facultyData, setFacultyData] = useState({
    ITEG: [],
    MEG: [],
    BEG: [],
    "B.Tech": [],
  });

  // Departments
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

  

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/faculty`,
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
          setFacultyData(data.sections);
        }
      } catch (error) {
        console.error("Error fetching faculty:", error);
      }
    };

    fetchFaculty();
  }, []);

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newFaculty, setNewFaculty] = useState({
    name: "",
    email: "",
    subjects: [],
  });

  const [subjectInput, setSubjectInput] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingFaculty, setDeletingFaculty] = useState(null);
  const [editSubjectInput, setEditSubjectInput] = useState("");

  // Department select
  const handleDepartmentClick = (department) => {
    setSelectedDepartment(department);
  };

  // Back to departments
  const handleBack = () => {
    setSelectedDepartment(null);
  };

  // View faculty history page
  const handleViewHistory = (facultyId) => {
    navigate(`/admin/faculty/history/${facultyId}`);
  };

  // Open Edit Modal
  const handleOpenEdit = (faculty) => {
    setEditingFaculty({
      id: faculty.id,
      name: faculty.name,
      email: faculty.email,
      subjects: [...faculty.subjects],
    });

    setIsEditModalOpen(true);
  };

  const authUser = JSON.parse(localStorage.getItem("authUser"));
  // Save Edit Faculty
  const handleSaveEdit = async (e) => {
    e.preventDefault();

    if (!editingFaculty) return;

    if (editingFaculty.subjects.length === 0) {
      alert("At least one subject is required");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/faculty/${editingFaculty.id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editingFaculty.name,
            gmail: editingFaculty.email,
            subjects: editingFaculty.subjects,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to update faculty");
        return;
      }

      if (data.success) {
        setFacultyData((prevData) => ({
          ...prevData,
          [selectedDepartment]: prevData[selectedDepartment].map((item) =>
            item.facultyId === data.faculty.facultyId
              ? data.faculty
              : item
          ),
        }));

        setIsEditModalOpen(false);
        setEditingFaculty(null);

      }
    } catch (error) {
      console.error("Error updating faculty:", error);
      alert("Server error. Please check backend.");
    }
  };

  // Save New Faculty
  // Save New Faculty
  const handleSaveNew = async (e) => {
    e.preventDefault();

    if (!newFaculty.name.trim()) {
      alert("Please enter faculty name");
      return;
    }

    if (!newFaculty.email.trim()) {
      alert("Please enter faculty email");
      return;
    }

    // Input me likha hua subject bhi subjects array me add karo
    let finalSubjects = [...newFaculty.subjects];

    if (subjectInput.trim()) {
      finalSubjects.push(subjectInput.trim());
    }

    if (finalSubjects.length === 0) {
      alert("Please enter at least one subject");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/faculty/create`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newFaculty.name.trim(),
            gmail: newFaculty.email.trim(),
            subjects: finalSubjects,
            section: selectedDepartment,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to add faculty");
        return;
      }

      if (data.success) {
        setFacultyData((prevData) => ({
          ...prevData,
          [selectedDepartment]: [
            ...(prevData[selectedDepartment] || []),
            data.faculty,
          ],
        }));

        setNewFaculty({
          name: "",
          email: "",
          subjects: [],
        });

        setSubjectInput("");
        setIsAddModalOpen(false);

      }
    } catch (error) {
      console.error("Error creating faculty:", error);
      alert("Server error. Please check backend.");
    }
  };
  // Open Delete Modal
  const handleOpenDelete = (faculty) => {
    setDeletingFaculty(faculty);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingFaculty) return;

    try {
      const response = await fetch(
        `${API_URL}/api/faculty/${deletingFaculty.id}`,
        {
          method: "DELETE",
          credentials: "include",
           headers: {
            "Content-Type": "application/json",
          },
        }
        
      );

      const data = await response.json();


      if (!response.ok) {
        alert(data.message || "Failed to delete faculty");
        return;
      }

      if (data.success) {
        setFacultyData((prevData) => ({
          ...prevData,
          [selectedDepartment]: prevData[selectedDepartment].filter(
            (item) => item.facultyId !== deletingFaculty.id
          ),
        }));

        setIsDeleteModalOpen(false);
        setDeletingFaculty(null);


      }
    } catch (error) {
      console.error("Error deleting faculty:", error);
      alert("Server error. Please check backend.");
    }
  };

  // Selected department faculty list
  const selectedFaculty = selectedDepartment
    ? (facultyData[selectedDepartment] || []).map((member) => ({
      id: member.facultyId,
      name: member.name,
      email: member.gmail,
      subjects: member.subjects,
    }))
    : [];


  return (
    <div className="manage-faculty">

      {/* STEP 1 — DEPARTMENT SELECTION */}
      {!selectedDepartment && (
        <section>
          <div className="faculty-page-title">
            <h1>Manage Faculty</h1>
            <p>Choose a department to view and manage faculty members.</p>
          </div>

          <div className="faculty-department-grid">
            {departments.map((department) => (
              <div
                key={department.name}
                className="faculty-department-card"
                onClick={() => handleDepartmentClick(department.name)}
              >
                <img
                  src={department.image}
                  alt={department.name}
                  className="faculty-department-image"
                />
                <h2>{department.name}</h2>
                <p className="faculty-dept-sub">{department.title}</p>
              </div>
            ))}
          </div>
        </section>
      )}


      {/* STEP 2 — FACULTY LIST */}
      {selectedDepartment && (
        <section>
          <button className="faculty-back-button" onClick={handleBack}>
            <FiArrowLeft style={{ marginRight: "6px", verticalAlign: "-2px" }} />
            Back to Departments
          </button>

          <div className="faculty-header">
            <div>
              <h1>{selectedDepartment} Faculty</h1>
              <p>Faculty members registered under {selectedDepartment}.</p>
            </div>

            <button
              className="add-faculty-button"
              onClick={() => setIsAddModalOpen(true)}
            >
              <FiPlus style={{ marginRight: "6px", verticalAlign: "-2px" }} />
              Add Faculty
            </button>
          </div>

          <div className="faculty-list">
            {selectedFaculty.length > 0 ? (
              selectedFaculty.map((member) => (
                <div key={member.id} className="faculty-row">
                  {/* Avatar */}
                  <div className="faculty-avatar">
                    {member.name
                      .replace("Dr. ", "")
                      .replace("Prof. ", "")
                      .charAt(0)}
                  </div>

                  {/* Faculty Info */}
                  <div className="faculty-info">
                    <h3>{member.name}</h3>
                    <p>{member.email}</p>
                    <span className="faculty-subject-tag">
                      {member.subjects.join(" & ")}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="faculty-actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleOpenEdit(member)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-view"
                      onClick={() => handleViewHistory(member.id)}
                    >
                      View History
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleOpenDelete(member)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="faculty-empty">
                No faculty members found. Click "+ Add Faculty" to add one.
              </div>
            )}
          </div>

          <div className="faculty-count">
            Total Faculty: <strong>{selectedFaculty.length}</strong>
          </div>
        </section>
      )}


      {/* EDIT FACULTY MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Faculty Member"
      >
        {editingFaculty && (
          <form onSubmit={handleSaveEdit} className="faculty-modal-form">
            <div className="modal-form-group">
              <label>Faculty Name</label>
              <input
                type="text"
                value={editingFaculty.name}
                onChange={(e) =>
                  setEditingFaculty({ ...editingFaculty, name: e.target.value })
                }
                required
              />
            </div>

            <div className="modal-form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={editingFaculty.email}
                onChange={(e) =>
                  setEditingFaculty({ ...editingFaculty, email: e.target.value })
                }
                required
              />
            </div>

            <div className="modal-form-group">
              <label>Subjects</label>

              <input
                type="text"
                placeholder="Enter subject"
                value={editSubjectInput}
                onChange={(e) => setEditSubjectInput(e.target.value)}
              />

              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  if (!editSubjectInput.trim()) return;

                  setEditingFaculty((prev) => ({
                    ...prev,
                    subjects: [
                      ...prev.subjects,
                      editSubjectInput.trim(),
                    ],
                  }));

                  setEditSubjectInput("");
                }}
              >
                + Add Subject
              </button>

              {editingFaculty.subjects.length > 0 && (
                <div style={{ marginTop: "10px" }}>
                  {editingFaculty.subjects.map((subject, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                        padding: "8px 10px",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                      }}
                    >
                      <span>{subject}</span>

                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          setEditingFaculty((prev) => ({
                            ...prev,
                            subjects: prev.subjects.filter(
                              (_, i) => i !== index
                            ),
                          }));
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>


      {/* ADD FACULTY MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={`Add Faculty to ${selectedDepartment}`}
      >
        <form onSubmit={handleSaveNew} className="faculty-modal-form">
          <div className="modal-form-group">
            <label>Faculty Name</label>
            <input
              type="text"
              placeholder="e.g. Dr. Ramesh Kumar"
              value={newFaculty.name}
              onChange={(e) =>
                setNewFaculty({ ...newFaculty, name: e.target.value })
              }
              required
            />
          </div>

          <div className="modal-form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="e.g. ramesh@singaji.edu.in"
              value={newFaculty.email}
              onChange={(e) =>
                setNewFaculty({ ...newFaculty, email: e.target.value })
              }
              required
            />
          </div>
          <div className="modal-form-group">
            <label>Subjects</label>

            <input
              type="text"
              placeholder="Enter subject"
              value={subjectInput}
              onChange={(e) => setSubjectInput(e.target.value)}
            />

            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                if (!subjectInput.trim()) return;

                setNewFaculty((prev) => ({
                  ...prev,
                  subjects: [...prev.subjects, subjectInput.trim()],
                }));

                setSubjectInput("");
              }}
            >
              + Add Subject
            </button>

            {newFaculty.subjects.length > 0 && (
              <div style={{ marginTop: "10px" }}>
                {newFaculty.subjects.map((subject, index) => (
                  <div key={index}>
                    {subject}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add Faculty
            </button>
          </div>
        </form>
      </Modal>


      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Faculty Member"
      >
        <div className="confirm-delete-body">
          <span className="confirm-icon">
            <FiTrash2 />
          </span>
          <p>
            Are you sure you want to delete{" "}
            <strong>{deletingFaculty?.name}</strong>?
            <br />
            This action cannot be undone.
          </p>
        </div>
        <div className="modal-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={handleConfirmDelete}
          >
            Delete
          </button>
        </div>
      </Modal>

    </div>
  );
}

export default ManageFaculty;