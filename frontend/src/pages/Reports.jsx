import { useEffect, useState } from "react";
import { FaStar } from "react-icons/fa";
import { FiAlertTriangle } from "react-icons/fi";
import "./Reports.css";
const API_URL = import.meta.env.VITE_API_URL;


function Reports() {
  const allDepartments = ["ITEG", "MEG", "BEG", "B.Tech"];

  const [selectedDeptFilter, setSelectedDeptFilter] = useState("All");

  // Today's date in YYYY-MM-DD format
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  });

  const [overallReport, setOverallReport] = useState({
    overallRating: 0,
    totalSubmissions: 0,
    lowScoreAlerts: 0,
  });

  const [campusCompletion, setCampusCompletion] = useState({
    percentage: 0,
    submitted: 0,
    designated: 0,
  });

  const [departmentReports, setDepartmentReports] = useState([]);
  const [topFaculty, setTopFaculty] = useState([]);
  const [lowScoreAlerts, setLowScoreAlerts] = useState([]);
  const authUser = JSON.parse(localStorage.getItem("authUser"));
  // =========================================================
  // FETCH REPORT WHEN DATE CHANGES
  // =========================================================

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/reports?date=${selectedDate}`,
          {
             credentials: "include",
          }
          
        );

        const data = await response.json();

        if (data.success) {
          setOverallReport(
            data.overall || {
              overallRating: 0,
              totalSubmissions: 0,
              lowScoreAlerts: 0,
            }
          );

          setDepartmentReports(data.departments || []);

          setTopFaculty(data.topRatedFaculty || []);

          setLowScoreAlerts(data.lowScoreDetails || []);

          setCampusCompletion(
            data.campusFeedbackCompletion || {
              percentage: 0,
              submitted: 0,
              designated: 0,
            }
          );
        }
      } catch (error) {
        console.error("Error fetching report:", error);
      }
    };

    fetchReport();
  }, [selectedDate]);

  return (
    <div className="reports-page">

      {/* =====================================================
          HEADER + FILTERS
      ===================================================== */}

      <div className="reports-header">
        <div>
          <h1>Analytics & Reports</h1>

          <p>
            Comprehensive overview of campus feedback metrics,
            department ratings, and faculty trends.
          </p>
        </div>

        <div className="filter-group">

          {/* Department Filter */}
          <label>Department:</label>

          <select
            value={selectedDeptFilter}
            onChange={(e) =>
              setSelectedDeptFilter(e.target.value)
            }
          >
            <option value="All">All Departments</option>
            <option value="ITEG">ITEG</option>
            <option value="MEG">MEG</option>
            <option value="BEG">BEG</option>
            <option value="B.Tech">B.Tech</option>
          </select>

          {/* Date Filter */}
          <label>Report Date:</label>

          <input
  type="date"
  className="af-select"
  value={selectedDate}
  onChange={(e) => setSelectedDate(e.target.value)}
/>

        </div>
      </div>

      {/* =====================================================
          TOP KPI CARDS
      ===================================================== */}

      <div className="reports-kpi-grid">

        <div className="kpi-report-card">
          <span className="kpi-title">
            Overall Feedback Score
          </span>

          <div className="kpi-main-val">
            <FaStar style={{ color: "#f59e0b", marginRight: "6px", verticalAlign: "-2px" }} />
            {overallReport.overallRating}{" "}
            <small>/ 5.0</small>
          </div>

          <p>
            Based on {overallReport.totalSubmissions}{" "}
            response submissions
          </p>
        </div>

        <div className="kpi-report-card">
          <span className="kpi-title">
            Campus Feedback Completion
          </span>

          <div className="kpi-main-val">
            {campusCompletion.percentage}%
          </div>

          <p>
            {campusCompletion.submitted} /{" "}
            {campusCompletion.designated} designated students
            submitted
          </p>
        </div>

        <div className="kpi-report-card">
          <span className="kpi-title">
            Active Low Score Alerts
          </span>

          <div className="kpi-main-val alert-text">
            {overallReport.lowScoreAlerts} Alerts
          </div>

          <p>
            Ratings under 3.5 needing review
          </p>
        </div>

      </div>

      {/* =====================================================
          DEPARTMENT PERFORMANCE
      ===================================================== */}

      <div className="reports-section-card">

        <h2>
          Department Ratings & Completion
        </h2>

        <div className="dept-perf-grid">

          {allDepartments
            .filter(
              (deptName) =>
                selectedDeptFilter === "All" ||
                deptName === selectedDeptFilter
            )
            .map((deptName) => {

              const dept = departmentReports.find(
                (item) =>
                  item.department === deptName
              );

              const rating =
                dept?.overallRating || 0;

              const submissions =
                dept?.totalSubmissions || 0;

              const alerts =
                dept?.lowScoreAlerts || 0;

              return (
                <div
                  key={deptName}
                  className="dept-perf-card"
                >

                  <h3>{deptName}</h3>

                  <div className="perf-score">
                    <FaStar style={{ color: "#f59e0b", marginRight: "5px", verticalAlign: "-2px" }} />
                    {rating} / 5
                  </div>

                  <div className="perf-bar-bg">

                    <div
                      className="perf-bar-fill"
                      style={{
                        width: `${(rating / 5) * 100}%`,
                      }}
                    />

                  </div>

                  <div className="perf-footer">

                    <span>
                      Submissions: {submissions}
                    </span>

                    <span>
                      Low Score Alerts: {alerts}
                    </span>

                  </div>

                </div>
              );
            })}

        </div>
      </div>

      {/* =====================================================
          FACULTY + LOW SCORE
      ===================================================== */}

      <div className="reports-two-col">

        {/* TOP FACULTY */}

        <div className="reports-section-card">

          <h2>Top Rated Faculty</h2>

          <div className="leaderboard-list">

  {topFaculty.filter((f) => Number(f.rating) >= 3.5).length > 0 ? (
  topFaculty
    .filter((f) => Number(f.rating) >= 3.5)
    .map((f, i) => (
      <div
        key={i}
        className="leaderboard-item"
      >
        <span className="rank-num">
          #{i + 1}
        </span>

        <div className="leader-info">
          <strong>{f.facultyName}</strong>

          <p>
            {f.department} • {f.subject}
          </p>
        </div>

        <span className="leader-score">
          <FaStar style={{ color: "#f59e0b", marginRight: "4px", verticalAlign: "-1px" }} />
          {f.rating}
        </span>
      </div>
    ))
) : (
  <p>No top-rated faculty for this date.</p>
)}
          </div>
        </div>

        {/* LOW SCORE ALERTS */}

        <div className="reports-section-card">

          <h2>
            Low Score Alerts & Reviews
          </h2>

          <div className="alerts-list">

            {lowScoreAlerts.length > 0 ? (
              lowScoreAlerts.map((a, idx) => (

                <div
                  key={idx}
                  className="alert-item"
                >

                  <div className="alert-item-header">

                    <strong style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <FiAlertTriangle style={{ color: "#ef4444" }} />
                      {a.facultyName}
                    </strong>

                    <span className="alert-score-badge">
                      {a.rating} / 5
                    </span>

                  </div>

                  <p className="alert-dept">
                    {a.department} • {a.subject}
                  </p>

                  <div className="alert-note">
                    Reason: {a.reason || "No remarks"}
                  </div>

                </div>

              ))
            ) : (
              <p>
                No low score alerts for this date.
              </p>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

export default Reports;