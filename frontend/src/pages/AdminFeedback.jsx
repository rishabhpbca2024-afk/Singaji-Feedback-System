import { useState, useEffect } from "react";
import { FaStar } from "react-icons/fa";
import { FiAlertTriangle } from "react-icons/fi";
import FacultyFeedbackModal from "../components/FacultyFeedbackModal.jsx";
import "./AdminFeedback.css";
const API_URL = import.meta.env.VITE_API_URL;

function StarDisplay({ value }) {
  return (
    <div className="star-display">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={
            i <= Math.round(Number(value) || 0)
              ? "star-on"
              : "star-off"
          }
        >
          <FaStar />
        </span>
      ))}
    </div>
  );
}

// ==========================================
// GET TODAY DATE IN LOCAL FORMAT
// ==========================================

const getTodayDate = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// ==========================================
// NORMALIZE API DATE
// ==========================================

const normalizeDate = (value) => {
  if (!value) return "";

  const stringValue = String(value).trim();

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    return stringValue;
  }

  // Mongo Date / ISO Date
  const date = new Date(stringValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

function AdminFeedback() {
  // ==========================================
  // STATE
  // ==========================================

  const [feedbacks, setFeedbacks] = useState([]);

  const [deptFilter, setDeptFilter] = useState("All");

  const [searchTerm, setSearchTerm] = useState("");

  // Empty means ALL dates
  const [dateFilter, setDateFilter] = useState("");

  const [selectedFacultyModal, setSelectedFacultyModal] =
    useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const authUser = JSON.parse(localStorage.getItem("authUser"));
  // ==========================================
  // FETCH FEEDBACKS
  // ==========================================

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const url = dateFilter
          ? `${API_URL}/api/feedback/all?date=${encodeURIComponent(
              dateFilter
            )}`
          : `${API_URL}/api/feedback/all`;

      const response = await fetch(url, {
      credentials: "include",
});
        const data = await response.json();


        if (
          response.ok &&
          data.success &&
          Array.isArray(data.feedbacks)
        ) {
          const mapped = data.feedbacks.map(
            (item, idx) => ({
              id:
                item._id ||
                item.id ||
                `fb-api-${idx}`,

                  facultyId:
                item.facultyId || "",

              name:
                item.facultyName ||
                item.faculty ||
                item.name ||
                "Faculty Member",

              department:
                item.department || "ITEG",

              subjects:
                Array.isArray(item.subjects)
                  ? item.subjects
                  : [],

              overallRating: Number(
                item.overallRating ||
                  item.rating ||
                  0
              ),

              totalFeedbacks: Number(
                item.totalFeedbacks || 0
              ),

              date: normalizeDate(item.date),
            })
          );


          setFeedbacks(mapped);
        } else if (response.ok && data.success) {
          setFeedbacks([]);
        } else {
          console.error(
            "[ADMIN FEEDBACK] API Error:",
            data.message
          );

          setFeedbacks([]);
        }
      } catch (err) {
        console.error(
          "[ADMIN FEEDBACK] Fetch error:",
          err
        );

        setFeedbacks([]);
      }
    };

    fetchFeedbacks();
  }, [dateFilter]);

  // ==========================================
  // FILTER
  // ==========================================

  const filtered = feedbacks.filter((fb) => {
    const matchDept =
      deptFilter === "All" ||
      fb.department === deptFilter;

    const search = searchTerm
      .toLowerCase()
      .trim();

    const matchSearch =
      !search ||
      fb.name
        .toLowerCase()
        .includes(search) ||
      fb.subjects?.some((subject) =>
        String(subject)
          .toLowerCase()
          .includes(search)
      );

    return matchDept && matchSearch;
  });

  // ==========================================
  // SUMMARY
  // ==========================================

  const lowScoreCount = feedbacks.filter(
    (fb) => Number(fb.overallRating) < 3.5
  ).length;

  const totalSubmissions =
    feedbacks.reduce(
      (total, fb) =>
        total +
        Number(fb.totalFeedbacks || 0),
      0
    );

  const totalRatingPoints =
    feedbacks.reduce(
      (total, fb) =>
        total +
        Number(fb.overallRating || 0) *
          Number(fb.totalFeedbacks || 0),
      0
    );

  const campusAverage =
    totalSubmissions > 0
      ? (
          totalRatingPoints /
          totalSubmissions
        ).toFixed(1)
      : "0.0";

  // ==========================================
  // OPEN FACULTY MODAL
  // ==========================================

  const handleOpenModal = (faculty) => {
   
    setSelectedFacultyModal(faculty);

    setIsModalOpen(true);
  };

  // ==========================================
  // CLOSE MODAL
  // ==========================================

  const handleCloseModal = () => {
    setIsModalOpen(false);

    setSelectedFacultyModal(null);
  };

  // ==========================================
  // MODAL DATE
  // ==========================================

  const modalDate =
    selectedFacultyModal?.date ||
    getTodayDate();

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="admin-feedback-page">
      {/* ==========================================
          HEADER
      ========================================== */}

      <div className="af-header">
        <div>
          <h1>Feedback Management</h1>

          <p>
            View and analyze student feedback
            submissions across departments.
          </p>
        </div>

        {lowScoreCount > 0 && (
          <div className="af-alert-pill">
            <FiAlertTriangle style={{ marginRight: "6px", verticalAlign: "-2px" }} />
            {lowScoreCount} low score alert
            {lowScoreCount > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* ==========================================
          SUMMARY CARDS
      ========================================== */}

      <div className="af-summary-grid">
        <div className="af-summary-card">
          <span className="af-summary-label">
            Total Submissions
          </span>

          <strong className="af-summary-value">
            {totalSubmissions}
          </strong>
        </div>

        <div className="af-summary-card">
          <span className="af-summary-label">
            Campus Average
          </span>

          <strong className="af-summary-value">
            <FaStar style={{ color: "#f59e0b", marginRight: "6px", verticalAlign: "-2px" }} />
            {campusAverage}
          </strong>
        </div>

        <div className="af-summary-card">
          <span className="af-summary-label">
            Needs Review
          </span>

          <strong className="af-summary-value af-value-alert">
            {lowScoreCount}
          </strong>
        </div>

        <div className="af-summary-card">
          <span className="af-summary-label">
            Reviewed
          </span>

          <strong className="af-summary-value">
            {feedbacks.length -
              lowScoreCount}
          </strong>
        </div>
      </div>

      {/* ==========================================
          FILTERS
      ========================================== */}

      <div className="af-filters">
        <input
          type="text"
          className="af-search"
          placeholder="Search by faculty or course..."
          value={searchTerm}
          onChange={(e) =>
            setSearchTerm(e.target.value)
          }
        />

        <select
          className="af-select"
          value={deptFilter}
          onChange={(e) =>
            setDeptFilter(e.target.value)
          }
        >
          <option value="All">
            All Departments
          </option>

          <option value="ITEG">
            ITEG
          </option>

          <option value="MEG">
            MEG
          </option>

          <option value="BEG">
            BEG
          </option>

          <option value="B.Tech">
            B.Tech
          </option>
        </select>

        {/* Date Filter */}

        <input
          type="date"
          className="af-select"
          value={dateFilter}
          onChange={(e) =>
            setDateFilter(e.target.value)
          }
        />
      </div>

      {/* ==========================================
          TABLE
      ========================================== */}

      <div className="af-table-wrap">
        <table className="af-table">
          <thead>
            <tr>
              <th>Faculty</th>

              <th>Dept</th>

              <th>Rating</th>

              <th>Date</th>

              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length > 0 ? (
              filtered.map((fb) => {
                const isAlert =
                  Number(fb.overallRating) <
                  3.5;

                return (
                  <tr
                    key={fb.id}
                    className={
                      isAlert
                        ? "af-row-alert"
                        : ""
                    }
                  >
                    {/* Faculty */}

                    <td>
                      <div className="af-faculty-name">
                        {fb.name}
                      </div>

                      <div className="af-course-name">
                        {fb.subjects &&
                        fb.subjects.length > 0
                          ? fb.subjects.join(
                              ", "
                            )
                          : "No course data"}
                      </div>
                    </td>

                    {/* Department */}

                    <td>
                      <span className="af-dept-tag">
                        {fb.department}
                      </span>
                    </td>

                    {/* Rating */}

                    <td>
                      <div className="af-rating-value">
                        {Number(
                          fb.overallRating || 0
                        ).toFixed(1)}
                      </div>

                      <StarDisplay
                        value={
                          fb.overallRating
                        }
                      />
                    </td>

                    {/* Date */}

                    <td>
                      <span className="af-date">
                        {fb.date
                          ? new Date(
                              `${fb.date}T00:00:00`
                            ).toLocaleDateString(
                              "en-GB"
                            )
                          : "N/A"}
                      </span>
                    </td>

                    {/* Action */}

                    <td>
                      <button
                        className="af-view-btn"
                        onClick={() =>
                          handleOpenModal(fb)
                        }
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="af-empty"
                >
                  No feedback entries match
                  your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ==========================================
          TABLE FOOTER
      ========================================== */}

      <div className="af-table-footer">
        Showing {filtered.length} of{" "}
        {feedbacks.length} entries
      </div>

      {/* ==========================================
          FACULTY FEEDBACK MODAL
      ========================================== */}

      <FacultyFeedbackModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        faculty={selectedFacultyModal}
        selectedDate={modalDate}
      />
    </div>
  );
}

export default AdminFeedback;