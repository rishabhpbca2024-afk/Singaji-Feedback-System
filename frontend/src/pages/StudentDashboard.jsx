import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEdit3, FiShield, FiMail, FiArrowRight, FiCheckCircle, FiKey } from "react-icons/fi";
import ssecLogo from "../assets/rename.png";
import "./StudentDashboard.css";

function StudentDashboard() {
  const [tokenInput, setTokenInput] = useState("");
  const [inputError, setInputError] = useState("");
  const navigate = useNavigate();

  const handleTokenSubmit = (e) => {
    e.preventDefault();
    const trimmed = tokenInput.trim();
    if (!trimmed) {
      setInputError("Please enter your feedback token or paste your feedback link");
      return;
    }

    // If student pasted a full URL like https://.../student/feedback?token=XYZ or #token=XYZ
    let token = trimmed;
    try {
      if (trimmed.includes("token=")) {
        const urlPart = trimmed.includes("#") ? trimmed.split("#")[1] : trimmed.split("?")[1];
        const params = new URLSearchParams(urlPart);
        token = params.get("token") || trimmed;
      }
    } catch {
      token = trimmed;
    }

    navigate(`/student/feedback?token=${encodeURIComponent(token)}`);
  };

  return (
    <div className="student-container">
      <header className="student-header">
        <div className="header-brand">
          <img src={ssecLogo} alt="Singaji Logo" className="student-logo" />
          <div>
            <h1>Sant Singaji Educational Society</h1>
            <p>Student Feedback Portal</p>
          </div>
        </div>

        <Link to="/login" className="student-logout-btn">
          Staff / Admin Login
        </Link>
      </header>

      <main className="student-main">
        {/* Welcome Banner */}
        <div className="welcome-banner">
          <h2>Welcome to Student Feedback Portal</h2>
          <p>
            Your feedback helps improve teaching quality and campus learning. Feedback sessions are 100% anonymous, safe, and confidential.
          </p>
        </div>

        {/* Action Grid */}
        <div className="student-card-grid">
          {/* Direct Token Access Card */}
          <div className="student-card student-token-card">
            <div>
              <h3 style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <FiKey style={{ color: "var(--primary, #ea580c)" }} /> Enter Feedback Token
              </h3>
              <p>
                Received an email link? Paste your token or full link here to begin your feedback session:
              </p>

              <form onSubmit={handleTokenSubmit} className="student-token-form">
                <input
                  type="text"
                  placeholder="Paste token or link (e.g. fb_...)"
                  value={tokenInput}
                  onChange={(e) => {
                    setTokenInput(e.target.value);
                    setInputError("");
                  }}
                  className="student-token-input"
                />
                {inputError && <p className="student-token-error">{inputError}</p>}
                <button type="submit" className="student-card-btn" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", border: "none", cursor: "pointer", width: "100%" }}>
                  Start Feedback <FiArrowRight />
                </button>
              </form>
            </div>
          </div>

          {/* Anonymity & History Notice Card */}
          <div className="student-card">
            <div>
              <h3 style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <FiShield style={{ color: "var(--primary, #ea580c)" }} /> 100% Anonymous & Secure
              </h3>
              <p>
                Your feedback responses are never attached to your name or email. Submissions are cryptographically hashed for complete student privacy.
              </p>
            </div>
            <Link to="/student/history" className="student-card-btn secondary">
              Learn About Anonymity & Privacy
            </Link>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="student-how-it-works">
          <h3>How Student Feedback Works</h3>
          <div className="student-steps-grid">
            <div className="student-step-item">
              <span className="step-number">1</span>
              <div>
                <strong>Lecture Ends</strong>
                <p>Following scheduled lecture slots, feedback triggers for selected classes.</p>
              </div>
            </div>
            <div className="student-step-item">
              <span className="step-number">2</span>
              <div>
                <strong>Check Email</strong>
                <p>Selected students automatically receive an encrypted one-time feedback link.</p>
              </div>
            </div>
            <div className="student-step-item">
              <span className="step-number">3</span>
              <div>
                <strong>Submit Honestly</strong>
                <p>Rate the lecture questions and leave suggestions with complete peace of mind.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default StudentDashboard;
