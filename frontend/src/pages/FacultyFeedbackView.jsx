import React, { useState } from "react";
import { FaStar } from "react-icons/fa";
import { FiUser, FiClock, FiBookOpen, FiUsers, FiChevronUp, FiChevronDown } from "react-icons/fi";
import { mockFaculties } from "../data/mockData.js";
import "./FacultyFeedbackView.css";

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

function FacultyFeedbackView() {
  const [expandedMetrics, setExpandedMetrics] = useState({});
  // Logged-in faculty demo (Dr. Rahul Sharma)
  const faculty = mockFaculties[0];

  const toggleMetrics = (lectureId) => {
    setExpandedMetrics((prev) => ({
      ...prev,
      [lectureId]: !prev[lectureId],
    }));
  };

  const getStatusBadge = (rating) => {
    const num = Number(rating);
    if (num >= 4.5) return { label: "Excellent", className: "badge-excellent" };
    if (num >= 3.5) return { label: "Good", className: "badge-good" };
    if (num >= 2.5) return { label: "Needs Improvement", className: "badge-warning" };
    return { label: "Critical", className: "badge-critical" };
  };

  return (
    <div className="ffv-page">
      <div className="ffv-header">
        <div>
          <h1>Student Feedback Insights</h1>
          <p>
            Anonymous feedback ratings and metrics received from students for today's lectures.
          </p>
        </div>
        <div className="ffv-faculty-pill">
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <FiUser /> {faculty.name}
          </span>
          <span className="ffv-dept-badge">{faculty.department}</span>
        </div>
      </div>

      <div className="ffv-stats-strip">
        <div className="ffv-stat-card">
          <span className="label">Overall Feedback Rating</span>
          <strong className="val">
            <FaStar style={{ color: "#f59e0b", marginRight: "5px", verticalAlign: "-2px" }} />
            {faculty.overallRating} / 5.0
          </strong>
        </div>
        <div className="ffv-stat-card">
          <span className="label">Total Responses</span>
          <strong className="val">{faculty.totalFeedbacks} Submissions</strong>
        </div>
        <div className="ffv-stat-card">
          <span className="label">Today's Lectures</span>
          <strong className="val">{faculty.lecturesToday.length} Conducted</strong>
        </div>
      </div>

      <div className="ffv-lectures-list">
        {faculty.lecturesToday.map((lecture, index) => {
          const statusInfo = getStatusBadge(lecture.overallRating);
          const isExpanded = expandedMetrics[lecture.lectureId] ?? false;

          return (
            <div key={lecture.lectureId || index} className="ffv-lecture-card">
              <div className="ffv-lecture-top">
                <div>
                  <span className="ffv-lec-tag">{lecture.number}</span>
                  <h2>{lecture.subject}</h2>
                  <div className="ffv-lec-details">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <FiClock /> {lecture.time}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <FiBookOpen /> {lecture.className} ({lecture.group})
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <FiUsers /> Strength: {lecture.strength}
                    </span>
                  </div>
                </div>

                <div className="ffv-rating-box">
                  <div className="ffv-rating-num">{lecture.overallRating}</div>
                  <StarDisplay value={lecture.overallRating} />
                  <span className={`ffv-badge ${statusInfo.className}`}>
                    {statusInfo.label}
                  </span>
                </div>
              </div>

              <div className="ffv-sub-rate">
                Submission Rate: <strong>{lecture.responses} / {lecture.strength}</strong> ({Math.round((lecture.responses/lecture.strength)*100)}%)
              </div>

              {/* Feedback Matrix */}
              <div className="ffv-matrix-box">
                <h3>Parameter Breakdown Matrix</h3>
                <div className="ffv-table-responsive">
                  <table className="ffv-matrix-table">
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>1 (Poor)</th>
                        <th>2 (Fair)</th>
                        <th>3 (Avg)</th>
                        <th>4 (Good)</th>
                        <th>5 (Exc)</th>
                        <th>Average</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(isExpanded
                        ? lecture.parameters
                        : lecture.parameters?.slice(0, 5)
                      )?.map((param, idx) => (
                        <tr key={idx}>
                          <td className="param-text">{param.name}</td>
                          {param.ratings.map((cnt, rIdx) => (
                            <td key={rIdx} className="tc">{cnt}</td>
                          ))}
                          <td className="tc avg"><strong>{param.avg}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {lecture.parameters?.length > 5 && (
                  <button
                    className="ffv-expand-btn"
                    onClick={() => toggleMetrics(lecture.lectureId)}
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

              {/* Remarks */}
              {lecture.remarks && lecture.remarks.length > 0 && (
                <div className="ffv-remarks-box">
                  <h3>Anonymous Student Comments</h3>
                  <div className="ffv-remarks-grid">
                    {lecture.remarks.map((rem, rIdx) => (
                      <div key={rIdx} className="ffv-remark-card">
                        "{rem}"
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FacultyFeedbackView;
