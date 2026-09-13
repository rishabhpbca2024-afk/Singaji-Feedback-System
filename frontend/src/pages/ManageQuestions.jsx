import { useEffect, useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import Modal from "../components/Modal.jsx";
import "./ManageQuestions.css";

const API_URL = import.meta.env.VITE_API_URL;

function ManageQuestions() {
  const [questions, setQuestions] = useState([]);

  const categories = [
    "Teaching",
    "Communication",
    "Subject Knowledge",
    "Classroom Management",
    "Overall Experience",
  ];

const authUser = JSON.parse(localStorage.getItem("authUser"));

  useEffect(() => {
  const fetchQuestions = async () => {
    try {
     

     const response = await fetch(
      `${API_URL}/api/questions`,
     {
    credentials: "include",
  }
);

      const data = await response.json();

      if (data.success) {
        setQuestions(
          data.questions.map((q) => ({
            id: q._id,
            number: q.order,
            text: q.text,
            category: q.category,
            status: q.isActive ? "Active" : "Inactive",
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
    }
  };

  fetchQuestions();
}, []);

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [newQuestion, setNewQuestion] = useState({
    text: "",
    category: "Teaching",
    status: "Active",
  });

  const [editingQuestion, setEditingQuestion] = useState(null);

  // Add question handler
 const handleAddQuestion = async (e) => {
  e.preventDefault();

  if (!newQuestion.text.trim()) return;

  try {
    const response = await fetch(
       `${API_URL}/api/questions/create`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: newQuestion.text,
          category: newQuestion.category,
          status: newQuestion.status,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data.message);
      return;
    }

    const createdQuestion = {
      id: data.question._id,
      number: data.question.order,
      text: data.question.text,
      category: data.question.category,
      status: data.question.isActive ? "Active" : "Inactive",
    };

    setQuestions([...questions, createdQuestion]);

    setNewQuestion({
      text: "",
      category: "Teaching",
      status: "Active",
    });

    setIsAddModalOpen(false);
  } catch (error) {
    console.error("Error creating question:", error);
  }
};
  // Edit question handler
  const handleOpenEdit = (q) => {
  setEditingQuestion({ ...q });
  setIsEditModalOpen(true);
};

 const handleSaveEdit = async (e) => {
  e.preventDefault();

  if (!editingQuestion || !editingQuestion.text.trim()) return;

  try {
    const response = await fetch(
      `${API_URL}/api/questions/${editingQuestion.id}`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: editingQuestion.text,
          category: editingQuestion.category,
          status: editingQuestion.status,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data.message);
      return;
    }

    const updatedQuestion = {
      id: data.question._id,
      number: data.question.order,
      text: data.question.text,
      category: data.question.category,
      status: data.question.isActive ? "Active" : "Inactive",
    };

    setQuestions(
      questions.map((q) =>
        q.id === editingQuestion.id ? updatedQuestion : q
      )
    );

    setIsEditModalOpen(false);
    setEditingQuestion(null);
  } catch (error) {
    console.error("Error updating question:", error);
  }
};

  // Delete question handler
  const handleOpenDelete = (q) => {
    setEditingQuestion(q);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
  if (!editingQuestion) return;

  try {
    const response = await fetch(
      `${API_URL}/api/questions/${editingQuestion.id}`,
      {
        method: "DELETE",
       credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data.message);
      alert(data.message || "Failed to delete question.");
      return;
    }

    if (data.success) {
      const updated = questions.filter(
        (q) => q.id !== editingQuestion.id
      );

      const renumbered = updated.map(
        (q, idx) => ({
          ...q,
          number: idx + 1,
        })
      );

      setQuestions(renumbered);

      setIsDeleteModalOpen(false);
      setEditingQuestion(null);

    }
  } catch (error) {
    console.error("Error deleting question:", error);
    alert("Something went wrong while deleting the question.");
  }
};


  return (
    <div className="manage-questions-page">
      <div className="questions-header">
        <div>
          <h1>Manage Feedback Questions</h1>
          <p>Create, update, or reorganize questions included in student feedback forms.</p>
        </div>

        <button className="add-btn" onClick={() => setIsAddModalOpen(true)}>
          <FiPlus style={{ marginRight: "6px", verticalAlign: "-2px" }} />
          Add Question
        </button>
      </div>

      <div className="questions-list">
        {questions.length > 0 ? (
          questions.map((q) => (
            <div key={q.id} className="question-card">
              <div className="q-number-badge">Q{q.number}</div>

              <div className="q-content">
                <h3>{q.text}</h3>
                <div className="q-meta">
                  <span className="q-category-tag">{q.category}</span>
                  <span
                    className={`q-status-tag ${
                      q.status === "Active" ? "active" : "inactive"
                    }`}
                  >
                    {q.status}
                  </span>
                </div>
              </div>

              <div className="q-actions">
                <button className="btn-edit" onClick={() => handleOpenEdit(q)}>
                  Edit
                </button>
                <button className="btn-delete" onClick={() => handleOpenDelete(q)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-data-box">No feedback questions available. Add a question to get started.</div>
        )}
           
      </div>

      {/* ADD QUESTION MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Feedback Question"
      >
        <form onSubmit={handleAddQuestion} className="question-modal-form">
          <div className="modal-form-group">
            <label>Question Text</label>

            <textarea
              rows="3"
              placeholder="Type evaluation question here..."
              value={newQuestion.text}
              onChange={(e) =>
                setNewQuestion({ ...newQuestion, text: e.target.value })
              }
              required
            />
          </div>

          <div className="modal-form-group">
            <label>Category</label>
            <select
              value={newQuestion.category}
              onChange={(e) =>
                setNewQuestion({ ...newQuestion, category: e.target.value })
              }
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-form-group">
            <label>Status</label>
            <select
              value={newQuestion.status}
              onChange={(e) =>
                setNewQuestion({ ...newQuestion, status: e.target.value })
              }
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
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
              Add Question
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT QUESTION MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Question"
      >
        {editingQuestion && (
          <form onSubmit={handleSaveEdit} className="question-modal-form">
            <div className="modal-form-group">
              <label>Question Text</label>
              <textarea
                rows="3"
                value={editingQuestion.text}
                onChange={(e) =>
                  setEditingQuestion({
                    ...editingQuestion,
                    text: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="modal-form-group">
              <label>Category</label>
              <select
                value={editingQuestion.category}
                onChange={(e) =>
                  setEditingQuestion({
                    ...editingQuestion,
                    category: e.target.value,
                  })
                }
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-form-group">
              <label>Status</label>
              <select
                value={editingQuestion.status}
                onChange={(e) =>
                  setEditingQuestion({
                    ...editingQuestion,
                    status: e.target.value,
                  })
                }
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
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

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Question"
      >
        <div className="confirm-delete-body">
          <span className="confirm-icon">
            <FiTrash2 />
          </span>
          <p>
            Are you sure you want to delete Question {editingQuestion?.number}?
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

export default ManageQuestions;
