import React from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiLock, FiArrowLeft, FiCheckCircle, FiEyeOff } from 'react-icons/fi';
import ssecLogo from '../assets/rename.png';
import './FeedbackHistory.css';

function FeedbackHistory() {
  return (
    <div className="feedback-history-container">
      <header className="feedback-history-header">
        <div className="header-brand">
          <img src={ssecLogo} alt="Singaji Logo" className="student-logo" />
          <div>
            <h1>Sant Singaji Educational Society</h1>
            <p>Student Confidentiality & Privacy</p>
          </div>
        </div>

        <Link to="/student/dashboard" className="back-link">
          <FiArrowLeft /> Back to Portal
        </Link>
      </header>

      <main className="feedback-history-main">
        <div className="history-card">
          <div className="history-shield-icon">
            <FiShield size={36} />
          </div>

          <h2>Why is Submission History Not Stored?</h2>
          <p className="history-subtitle">
            Your privacy and honest evaluation are the core foundations of the Singaji Feedback System.
          </p>

          <div className="history-features-list">
            <div className="history-feature-item">
              <div className="feature-icon">
                <FiEyeOff size={20} />
              </div>
              <div>
                <strong>100% Anonymous Submissions</strong>
                <p>
                  When you submit a lecture review, your ratings and suggestions are dissociated from your email and identity using one-way cryptographic hashing.
                </p>
              </div>
            </div>

            <div className="history-feature-item">
              <div className="feature-icon">
                <FiLock size={20} />
              </div>
              <div>
                <strong>Zero Personal Tracking</strong>
                <p>
                  Neither teachers, department heads, nor administrative staff can trace any feedback back to individual students. No personal submission records are linked to your profile.
                </p>
              </div>
            </div>

            <div className="history-feature-item">
              <div className="feature-icon">
                <FiCheckCircle size={20} />
              </div>
              <div>
                <strong>Direct One-Time Access</strong>
                <p>
                  Each feedback session uses a single-use token sent directly to your registered college email that expires immediately after completion.
                </p>
              </div>
            </div>
          </div>

          <div className="history-actions">
            <Link to="/student/dashboard" className="btn-primary">
              Return to Student Portal
            </Link>
            <Link to="/login" className="btn-secondary">
              Staff / Admin Sign In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default FeedbackHistory;
