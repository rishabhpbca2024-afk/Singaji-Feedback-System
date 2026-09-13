import { useEffect, useState } from "react";
import { FaGraduationCap, FaStar } from "react-icons/fa";
import { FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
const API_URL = import.meta.env.VITE_API_URL;

import "./AdminDashboard.css";

function StarRating({ value }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} className={`star ${i <= Math.round(value) ? "star-filled" : "star-empty"}`}>
        <FaStar size={13} />
      </span>
    );
  }
  return <div className="star-row">{stars}</div>;
}

function AdminDashboard() {
  const [recentFeedback, setRecentFeedback] = useState([]);
  const [lowScoreFeedback, setLowScoreFeedback] = useState([]);

  const [todayLectures, setTodayLectures] = useState(0);
  const [campusCompletion, setCampusCompletion] = useState({
    percentage: 0,
    submitted: 0,
    designated: 0,
  });
  const [overallReport, setOverallReport] = useState({
    overallRating: 0,
    totalSubmissions: 0,
    lowScoreAlerts: 0,
  });

  const authUser = JSON.parse(localStorage.getItem("authUser"));

  useEffect(() => {
  const fetchTodaySchedules = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/schedules/today`,
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
  const schedules = data.schedules || [];

  const totalLectures = schedules.reduce((total, schedule) => {
    let count = 0;

    if (schedule.slot1?.subject) {
      count++;
    }

    if (schedule.slot2?.subject) {
      count++;
    }

    if (schedule.slot3?.subject) {
      count++;
    }

    return total + count;
  }, 0);

  setTodayLectures(totalLectures);
}
    } catch (error) {
      console.error("Error fetching today's schedules:", error);
    }
  };

  fetchTodaySchedules();
}, []);


useEffect(() => {
  const fetchFeedbackReport = async () => {
    try {
      const today = new Date().toLocaleDateString("en-CA");

      // =====================================================
      // 1. TODAY'S REPORT
      //    Used only for top KPI cards
      // =====================================================

      const todayResponse = await fetch(
        `${API_URL}/api/reports?date=${today}`,
        {
           credentials: "include",
        }
      );

      const todayData = await todayResponse.json();

      if (!todayResponse.ok) {
        console.error(todayData.message);
        return;
      }

      // =====================================================
      // 2. ALL-TIME REPORT
      //    Used only for bottom sections
      // =====================================================

      const overallResponse = await fetch(
          `${API_URL}/api/reports`,
        {
          credentials: "include",
        }
      );

      const overallData = await overallResponse.json();

      if (!overallResponse.ok) {
        console.error(overallData.message);
        return;
      }

      // =====================================================
      // 3. TOP CARDS → TODAY'S DATA
      // =====================================================

      if (todayData.success) {
        setCampusCompletion(
          todayData.campusFeedbackCompletion || {
            percentage: 0,
            submitted: 0,
            designated: 0,
          }
        );

        setOverallReport(
          todayData.overall || {
            overallRating: 0,
            totalSubmissions: 0,
            lowScoreAlerts: 0,
          }
        );
      }

      // =====================================================
      // 4. LOWER SECTIONS → OVERALL / ALL-TIME DATA
      // =====================================================

      if (overallData.success) {
        const topRated = (
          overallData.topRatedFaculty || []
        ).map((faculty, index) => ({
          id: index + 1,
          student: faculty.department,
          faculty: faculty.facultyName,
          rating: faculty.rating,
          date: "",
          subject:
            faculty.subject ||
            "Subject not available",
        }));

        const lowRated = (
          overallData.lowScoreDetails || []
        ).map((faculty, index) => ({
          id: index + 1,
          faculty: faculty.facultyName,
          department: faculty.department,
          rating: faculty.rating,
          date: faculty.date
            ? new Date(
                faculty.date
              ).toLocaleDateString()
            : "",
          course:
            faculty.subject ||
            "Subject not available",
        }));

        setRecentFeedback(topRated);
        setLowScoreFeedback(lowRated);
      }
    } catch (error) {
      console.error(
        "Error fetching feedback report:",
        error
      );
    }
  };

  fetchFeedbackReport();
},[]);

  return (
    <div className="admin-dashboard">

      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Overview of today's academic and feedback activity</p>
      </div>


      {/* ========================
          STAT CARDS (4)
      ======================== */}
      <div className="dashboard-stats">

        {/* Today's Lectures */}
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-title">Today's Lectures Held</span>
            <span className="stat-icon-wrapper">
              <FaGraduationCap size={20} color="#ea580c" />
            </span>
          </div>
          <div className="stat-value">{todayLectures}</div>
          <div className="stat-description">Lectures conducted today</div>
        </div>


        {/* Low Score Alerts */}
        <div className="stat-card stat-card-alert">
          <div className="stat-card-top">
            <span className="stat-title">Low Score Alerts</span>
            <span className="stat-icon-wrapper alert-bg">
              <FiAlertTriangle size={20} color="#ef4444" />
            </span>
          </div>
          <div className="stat-value stat-value-alert">
            {overallReport.lowScoreAlerts}
          </div>
          <div className="stat-description">Classes require administrative review</div>
        </div>


        {/* Campus Average */}
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-title">Today's Campus Avg</span>
            <span className="stat-icon-wrapper star-bg">
              <FaStar size={20} color="#f59e0b" />
            </span>
          </div>
          <div className="stat-value">
            {overallReport.overallRating}
            <span className="stat-max"> / 5</span>
          </div>
          <div className="stat-description">Overall feedback rating</div>
        </div>


        {/* Feedback Completion */}
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-title">Feedback Completion</span>
            <span className="stat-icon-wrapper check-bg">
              <FiCheckCircle size={20} color="#10b981" />
            </span>
          </div>
          <div className="stat-value">
            {campusCompletion.percentage}%
          </div>

          <div className="stat-description">
            {campusCompletion.submitted} / {campusCompletion.designated} students completed feedback
          </div>

          <div className="completion-bar-bg">
            <div
              className="completion-bar-fill"
              style={{
                width: `${campusCompletion.percentage}%`,
              }}
            />
          </div>
        </div>

      </div>


      {/* ========================
          LOWER SECTIONS (2-col)
      ======================== */}
      <div className="dashboard-lower">

        {/* ---- TOP RECENT FEEDBACK ---- */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent High-Quality Feedback</h2>
            <span className="section-badge section-badge-green">Top Rated</span>
          </div>

          <div className="feedback-cards">
            {recentFeedback.map((fb) => (
              <div key={fb.id} className="feedback-item">
                <div className="feedback-item-top">
                  <div className="feedback-item-info">
                    <span className="feedback-class-tag">{fb.student}</span>
                    <span className="feedback-faculty">{fb.faculty}</span>
                  </div>
                  <div className="feedback-rating-badge">
                    <FaStar style={{ marginRight: "4px", verticalAlign: "-1px" }} />
                    {fb.rating}
                  </div>
                </div>
                <p className="feedback-subject">{fb.subject}</p>

                <StarRating value={fb.rating} />
                <p className="feedback-date">{fb.date}</p>
              </div>
            ))}
          </div>
        </div>


        {/* ---- NEEDS ATTENTION ---- */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Needs Attention</h2>
            <span className="section-badge section-badge-red">Low Score</span>
          </div>

          <div className="feedback-cards">
            {lowScoreFeedback.map((fb) => (
              <div key={fb.id} className="feedback-item feedback-item-alert">
                <div className="feedback-item-top">
                  <div className="feedback-item-info">
                    <span className="feedback-class-tag alert-tag">{fb.department}</span>
                    <span className="feedback-faculty">{fb.faculty}</span>
                  </div>
                  <div className="feedback-rating-badge rating-badge-alert">
                    <FiAlertTriangle style={{ marginRight: "4px", verticalAlign: "-1px" }} />
                    {fb.rating}
                  </div>
                </div>
                <p className="feedback-subject">{fb.course}</p>

                {/* <div className="alert-footer">
                  <span className="feedback-date">{fb.date}</span>
                  <button className="review-btn">view</button>
                </div> */}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

export default AdminDashboard;