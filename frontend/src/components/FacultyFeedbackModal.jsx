import React, { useEffect, useState } from "react";
import { FaStar } from "react-icons/fa";
import {
  FiCalendar,
  FiX,
  FiAlertCircle,
  FiClock,
  FiLayers,
  FiUsers,
  FiAlertTriangle,
  FiChevronUp,
  FiChevronDown,
} from "react-icons/fi";
import "./FacultyFeedbackModal.css";

const API_URL = import.meta.env.VITE_API_URL;

function StarDisplay({ value }) {
  return (
    <div className="star-display">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={i <= Math.round(value) ? "star-on" : "star-off"}
        >
          <FaStar />
        </span>
      ))}
    </div>
  );
}

function FacultyFeedbackModal({
  isOpen,
  onClose,
  faculty,
  selectedDate,
}) {
  const [expandedMetrics, setExpandedMetrics] = useState({});
  const [viewData, setViewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

    const authUser = JSON.parse(localStorage.getItem("authUser"));


  useEffect(() => {
    if (!isOpen || !faculty || !selectedDate) {
      return;
    }

    const fetchFacultyFeedback = async () => {
      try {
        setLoading(true);
        setError("");
        setViewData(null);

      const response = await fetch(
  `${API_URL}/api/feedback/faculty-view?facultyId=${encodeURIComponent(
    faculty.facultyId
  )}&date=${selectedDate}`,
  {
    credentials: "include",
  }
);


        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load faculty feedback."
          );
        }

        setViewData(data);
      } catch (err) {
        console.error("Faculty feedback view error:", err);
        setError(
          err.message || "Failed to load faculty feedback."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyFeedback();
  }, [isOpen, faculty, selectedDate]);

  if (!isOpen || !faculty) return null;

  const toggleMetrics = (lectureId) => {
    setExpandedMetrics((prev) => ({
      ...prev,
      [lectureId]: !prev[lectureId],
    }));
  };

  const getStatusBadge = (rating) => {
    const num = Number(rating);

    if (num >= 4.5)
      return {
        label: "Excellent",
        className: "badge-excellent",
      };

    if (num >= 3.5)
      return {
        label: "Good",
        className: "badge-good",
      };

    if (num >= 2.5)
      return {
        label: "Needs Improvement",
        className: "badge-warning",
      };

    return {
      label: "Critical",
      className: "badge-critical",
    };
  };

  const lectures = viewData?.lectures || [];

  return (
    <div className="ffm-overlay" onClick={onClose}>
      <div
        className="ffm-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="ffm-header">
          <div className="ffm-header-info">
            <h2>
              {viewData?.faculty?.name || faculty.name}
            </h2>

            <div className="ffm-sub-bar">
              <span className="ffm-badge">
                {viewData?.faculty?.department ||
                  faculty.department}
              </span>

              <span className="ffm-date">
                <FiCalendar style={{ marginRight: "6px", verticalAlign: "-2px" }} />
                Feedback (
                {selectedDate
                  ? new Date(
                      `${selectedDate}T00:00:00`
                    ).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "Selected Date"}
                )
              </span>
            </div>
          </div>

          <button
            className="ffm-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="ffm-body">

          {/* Loading */}
          {loading && (
            <div className="ffm-empty-lectures">
              Loading feedback...
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="ffm-empty-lectures">
              <FiAlertCircle style={{ marginRight: "6px", verticalAlign: "-2px", color: "#ef4444" }} />
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Overview */}
              <div className="ffm-overview-strip">
                <div className="ffm-overview-card">
                  <span className="ffm-ov-label">
                    Overall Rating
                  </span>

                  <div className="ffm-ov-rating">
                    <strong>
                      <FaStar style={{ color: "#f59e0b", marginRight: "4px", verticalAlign: "-1px" }} />
                      {viewData?.overallRating || 0}
                    </strong>{" "}
                    / 5.0
                  </div>
                </div>

                <div className="ffm-overview-card">
                  <span className="ffm-ov-label">
                    Today's Lectures
                  </span>

                  <strong className="ffm-ov-num">
                    {lectures.length} Lectures
                  </strong>
                </div>

                <div className="ffm-overview-card">
                  <span className="ffm-ov-label">
                    Department
                  </span>

                  <strong className="ffm-ov-num">
                    {viewData?.faculty?.department ||
                      faculty.department}
                  </strong>
                </div>
              </div>

              <h3 className="ffm-section-title">
                Today's Conducted Lectures
              </h3>

              {lectures.length > 0 ? (
                lectures.map((lecture, index) => {
                  const statusInfo = getStatusBadge(
                    lecture.overallRating
                  );

                  const isLowScore =
                    Number(lecture.overallRating) < 3.5;

                  const lectureId =
                    lecture.lectureTime ||
                    `${lecture.subject}-${index}`;

                  const isExpanded =
                    expandedMetrics[lectureId] ?? false;

                  return (
                    <div
                      key={lectureId}
                      className={`ffm-lecture-card ${
                        isLowScore
                          ? "ffm-low-score"
                          : ""
                      }`}
                    >
                      {/* Lecture Header */}
                      <div className="ffm-lecture-header">
                        <div>
                          <span className="ffm-lec-number">
                            {lecture.number ||
                              `Lecture ${index + 1}`}
                          </span>

                          <h4 className="ffm-lec-subject">
                            {lecture.subject}
                          </h4>

                          <div className="ffm-lec-meta">
                            <span>
                              <FiClock style={{ marginRight: "4px", verticalAlign: "-2px" }} />
                              {lecture.lectureTime}
                            </span>

                            <span>
                              <FiLayers style={{ marginRight: "4px", verticalAlign: "-2px" }} />
                              Class:{" "}
                              {lecture.className || "-"}{" "}
                              {lecture.groups?.length > 0
                                ? `(${lecture.groups.join(
                                    ", "
                                  )})`
                                : ""}
                            </span>

                            <span>
                              <FiUsers style={{ marginRight: "4px", verticalAlign: "-2px" }} />
                              Strength:{" "}
                              {lecture.strength || 0}
                            </span>
                          </div>
                        </div>

                        <div className="ffm-lec-rating-box">
                          <div className="ffm-rating-number">
                            {lecture.overallRating}
                          </div>

                          <StarDisplay
                            value={
                              lecture.overallRating
                            }
                          />

                          <span
                            className={`ffm-status-badge ${statusInfo.className}`}
                          >
                            {statusInfo.label}
                          </span>

                          {isLowScore && (
                            <div className="ffm-needs-review-pill">
                              <FiAlertTriangle style={{ marginRight: "4px", verticalAlign: "-2px" }} />
                              Needs Review
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Submission Rate Bar */}
                      <div className="ffm-submission-banner">
                        <span>
                          Submission Rate:{" "}
                          <strong>
                            {lecture.responses || 0} /{" "}
                            {lecture.strength || 0}
                          </strong>{" "}
                          (
                          {lecture.strength > 0
                            ? Math.round(
                                ((lecture.responses || 0) /
                                  lecture.strength) *
                                  100
                              )
                            : 0}
                          %)
                        </span>
                      </div>

                      {/* Feedback Matrix */}
                      <div className="ffm-matrix-wrapper">
                        <h5 className="ffm-matrix-title">
                          Feedback Rating Matrix
                        </h5>

                        <div className="ffm-table-scroll">
                          <table className="ffm-matrix-table">
                            <thead>
                              <tr>
                                <th>Parameter</th>
                                <th className="tc">
                                  1 (Poor)
                                </th>
                                <th className="tc">
                                  2 (Fair)
                                </th>
                                <th className="tc">
                                  3 (Avg)
                                </th>
                                <th className="tc">
                                  4 (Good)
                                </th>
                                <th className="tc">
                                  5 (Exc)
                                </th>
                                <th className="tc">
                                  Average
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {(isExpanded
                                ? lecture.parameters
                                : lecture.parameters?.slice(
                                    0,
                                    5
                                  )
                              )?.map(
                                (param, idx) => (
                                  <tr key={idx}>
                                    <td className="param-name">
                                      {param.name}
                                    </td>

                                    {param.ratings.map(
                                      (
                                        cnt,
                                        rIdx
                                      ) => (
                                        <td
                                          key={
                                            rIdx
                                          }
                                          className="tc rating-cnt"
                                        >
                                          {cnt}
                                        </td>
                                      )
                                    )}

                                    <td className="tc param-avg">
                                      <strong>
                                        {param.avg}
                                      </strong>
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>

                        {lecture.parameters?.length >
                          5 && (
                          <button
                            className="ffm-toggle-metrics-btn"
                            onClick={() =>
                              toggleMetrics(
                                lectureId
                              )
                            }
                          >
                            {isExpanded ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                Show Top 5 Metrics <FiChevronUp />
                              </span>
                            ) : (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                View 10 Metrics <FiChevronDown />
                              </span>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Anonymous Student Remarks */}
                      {lecture.remarks &&
                        lecture.remarks.length > 0 && (
                          <div className="ffm-remarks-section">
                            <h5 className="ffm-remarks-title">
                              Written Student Remarks
                              (Anonymous)
                            </h5>

                            <div className="ffm-remarks-list">
                              {lecture.remarks.map(
                                (remark, rIdx) => (
                                  <div
                                    key={rIdx}
                                    className="ffm-remark-bubble"
                                  >
                                    "{remark}"
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  );
                })
              ) : (
                <div className="ffm-empty-lectures">
                  No submitted feedback for this faculty
                  on this date.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default FacultyFeedbackModal;