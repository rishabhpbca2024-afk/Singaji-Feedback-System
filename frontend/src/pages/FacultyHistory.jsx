import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import { FiArrowLeft, FiMail } from "react-icons/fi";
import "./FacultyHistory.css";

const API_URL = import.meta.env.VITE_API_URL;

function FacultyHistory() {
  const { facultyId } = useParams();
  const navigate = useNavigate();

  const [facultyData, setFacultyData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const authUser = JSON.parse(localStorage.getItem("authUser"));

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (value) => {
    if (!value) return "N/A";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================================
  // FETCH FACULTY + HISTORY
  // =========================================================

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError("");

        // =====================================================
        // 1. GET ALL FACULTY
        // =====================================================

        const facultyResponse = await fetch(
          `${API_URL}/api/faculty`,
          {
            credentials: "include",
          }
        );

        const facultyResult =
          await facultyResponse.json();

        if (
          !facultyResponse.ok ||
          !facultyResult.success
        ) {
          throw new Error(
            facultyResult.message ||
              "Failed to fetch faculty details."
          );
        }

        // =====================================================
        // 2. FIND CURRENT FACULTY BY FACULTY ID
        // =====================================================

        const sections =
          facultyResult.sections || {};

        let selectedFaculty = null;

        for (const sectionName of Object.keys(
          sections
        )) {
          const sectionFaculty =
            Array.isArray(sections[sectionName])
              ? sections[sectionName]
              : [];

          const found =
            sectionFaculty.find(
              (member) =>
                String(
                  member.facultyId ||
                    member.id ||
                    member._id ||
                    ""
                ) === String(facultyId)
            );

          if (found) {
            selectedFaculty = {
              ...found,
              department:
                found.section ||
                sectionName,
            };

            break;
          }
        }

        if (!selectedFaculty) {
          throw new Error(
            "Faculty member not found."
          );
        }

        // =====================================================
        // 3. GET FACULTY HISTORY
        // =====================================================

      const historyUrl =
        `${API_URL}/api/feedback/faculty-history/${encodeURIComponent(
         facultyId
       )}`;

        const historyResponse = await fetch(
          historyUrl,
           {
               credentials: "include",
          }
        );

        const historyResult =
          await historyResponse.json();

        if (
          !historyResponse.ok ||
          !historyResult.success
        ) {
          throw new Error(
            historyResult.message ||
              "Failed to fetch faculty history."
          );
        }

       

        // =====================================================
        // 4. SET DATA
        // =====================================================

        setFacultyData({
          name:
            historyResult.faculty?.name ||
            selectedFaculty.name,

          department:
            historyResult.faculty?.department ||
            selectedFaculty.department ||
            "N/A",

          subject:
            Array.isArray(selectedFaculty.subjects)
              ? selectedFaculty.subjects.join(" & ")
              : selectedFaculty.subject ||
                "Core Specialization",

          email:
            selectedFaculty.gmail ||
            selectedFaculty.email ||
            "N/A",
        });

        setHistoryData(historyResult);
      } catch (err) {
        console.error(
          "[FACULTY HISTORY ERROR]:",
          err
        );

        setError(
          err.message ||
            "Failed to load faculty history."
        );
      } finally {
        setLoading(false);
      }
    };

    if (facultyId) {
      fetchHistory();
    }
  }, [facultyId]);

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="faculty-history-page">
        <button
          className="history-back-btn"
          onClick={() =>
            navigate("/admin/faculty")
          }
        >
          <FiArrowLeft style={{ marginRight: "6px", verticalAlign: "-2px" }} />
          Back to Faculty List
        </button>

        <div className="history-section-card">
          <h2>Loading Faculty History...</h2>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div className="faculty-history-page">
        <button
          className="history-back-btn"
          onClick={() =>
            navigate("/admin/faculty")
          }
        >
          <FiArrowLeft style={{ marginRight: "6px", verticalAlign: "-2px" }} />
          Back to Faculty List
        </button>

        <div className="history-section-card">
          <h2>Unable to Load History</h2>

          <p
            style={{
              color: "#dc2626",
              marginTop: "10px",
            }}
          >
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!facultyData || !historyData) {
    return null;
  }

  const faculty = facultyData;

  // =========================================================
  // QUESTION-WISE DATA
  // =========================================================

  const parameterAverages =
    historyData.parameterAverages || {};

  const questionScores = [
    {
      question:
        "Punctuality & Class Readiness",
      score:
        Number(
          parameterAverages.Punctuality
        ) || 0,
      category: "Classroom Management",
    },

    {
      question:
        "Clarity of Explanation & Concepts",
      score:
        Number(
          parameterAverages.Explanation
        ) || 0,
      category: "Teaching",
    },

    {
      question:
        "Communication & Interaction",
      score:
        Number(
          parameterAverages.Engagement
        ) || 0,
      category: "Communication",
    },

    {
      question:
        "Subject Knowledge & Depth",
      score:
        Number(
          parameterAverages.Resolution
        ) || 0,
      category: "Subject Knowledge",
    },

    {
      question:
        "Availability for Doubts & Guidance",
      score:
        Number(
          parameterAverages.Overall
        ) || 0,
      category: "Overall Experience",
    },
  ];

  // =========================================================
  // RECENT COMMENTS
  // =========================================================

  const recentComments =
    Array.isArray(
      historyData.recentComments
    )
      ? historyData.recentComments
      : [];

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="faculty-history-page">
      {/* =====================================================
          BACK BUTTON
      ===================================================== */}

      <button
        className="history-back-btn"
        onClick={() =>
          navigate("/admin/faculty")
        }
      >
        <FiArrowLeft style={{ marginRight: "6px", verticalAlign: "-2px" }} />
        Back to Faculty List
      </button>

      {/* =====================================================
          HEADER PROFILE CARD
      ===================================================== */}

      <div className="profile-card">
        <div className="profile-avatar">
          {faculty.name
            ?.replace(/^Dr\.\s*/i, "")
            .replace(
              /^Prof\.\s*/i,
              ""
            )
            .trim()
            .charAt(0)
            .toUpperCase() || "F"}
        </div>

        <div className="profile-details">
          <h1>{faculty.name}</h1>

          <p className="profile-sub">
            {faculty.department} Department
            {" • "}
            {faculty.subject}
          </p>

          <p className="profile-email">
            <FiMail style={{ marginRight: "6px", verticalAlign: "-2px" }} />
            {faculty.email}
          </p>
        </div>
      </div>

      {/* =====================================================
          SUMMARY KPI CARDS
      ===================================================== */}

      <div className="history-kpi-grid">
        {/* Total Lectures */}

        <div className="kpi-card">
          <span className="kpi-label">
            Total Lectures Held
          </span>

          <span className="kpi-value">
            {Number(
              historyData.totalLectures || 0
            )}
          </span>

          <span className="kpi-desc">
            Sessions completed
          </span>
        </div>

        {/* Total Feedbacks */}

        <div className="kpi-card">
          <span className="kpi-label">
            Total Feedbacks Received
          </span>

          <span className="kpi-value">
            {Number(
              historyData.totalFeedbacks ||
                0
            )}
          </span>

          <span className="kpi-desc">
            Student evaluations
          </span>
        </div>

        {/* Average Score */}

        <div className="kpi-card highlight-kpi">
          <span className="kpi-label">
            Average Score
          </span>

          <span className="kpi-value">
            <FaStar style={{ color: "#f59e0b", marginRight: "6px", verticalAlign: "-2px" }} />
            {Number(
              historyData.averageScore ||
                0
            ).toFixed(1)}

            <small> / 5</small>
          </span>

          <span className="kpi-desc">
            Overall satisfaction score
          </span>
        </div>
      </div>

      {/* =====================================================
          QUESTION-WISE SCORES
      ===================================================== */}

      <div className="history-section-card">
        <h2>
          Question-Wise Rating Analysis
        </h2>

        <div className="question-scores-list">
          {questionScores.map(
            (qs, index) => (
              <div
                key={index}
                className="qs-row"
              >
                <div className="qs-info">
                  <span className="qs-category">
                    {qs.category}
                  </span>

                  <span className="qs-text">
                    {qs.question}
                  </span>
                </div>

                <div className="qs-score-bar">
                  <div
                    className="qs-bar-fill"
                    style={{
                      width: `${
                        (qs.score / 5) *
                        100
                      }%`,
                    }}
                  />
                </div>

                <span className="qs-score-number">
                  {qs.score.toFixed(1)} / 5
                </span>
              </div>
            )
          )}
        </div>
      </div>

      {/* =====================================================
          RECENT STUDENT COMMENTS
      ===================================================== */}

      <div className="history-section-card">
        <h2>
          Recent Student Comments
        </h2>

        <div className="comments-list">
          {recentComments.length > 0 ? (
            recentComments.map(
              (fb, idx) => {
                const rating = Math.max(
                  0,
                  Math.min(
                    5,
                    Number(
                      fb.rating || 0
                    )
                  )
                );

                return (
                  <div
                    key={idx}
                    className="comment-card"
                  >
                    <div className="comment-top">
                      <span className="comment-date">
                        {formatDate(
                          fb.date
                        )}
                      </span>

                      <span className="comment-rating" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <span style={{ display: "inline-flex", gap: "2px", color: "#f59e0b" }}>
                          {[...Array(Math.max(1, Math.min(5, Math.round(rating))))].map((_, i) => (
                            <FaStar key={i} size={12} />
                          ))}
                        </span>
                        {" "}
                        (
                        {rating.toFixed(
                          1
                        )}
                        /5)
                      </span>
                    </div>

                    <p className="comment-text">
                      "{fb.remark}"
                    </p>

                    <span className="comment-student">
                      Student{" "}
                      {fb.level
                        ? `(Level ${fb.level})`
                        : ""}
                    </span>
                  </div>
                );
              }
            )
          ) : (
            <div className="comment-card">
              <p
                className="comment-text"
                style={{
                  color: "#64748b",
                }}
              >
                No student comments available.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FacultyHistory;