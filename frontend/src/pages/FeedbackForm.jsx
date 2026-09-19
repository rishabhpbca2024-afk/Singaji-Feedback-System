import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import {
  FiAlertTriangle,
  FiMail,
  FiClock,
  FiLock,
  FiArrowRight,
  FiCheckCircle,
} from "react-icons/fi";
import ssecLogo from "../assets/rename.png";
import "./FeedbackForm.css";

const API_URL = import.meta.env.VITE_API_URL;

function FeedbackForm() {
  const [searchParams] = useSearchParams();

  // ==========================================
  // TOKEN FROM EMAIL LINK
  // ==========================================

  const token = searchParams.get("token") || "";

  // ==========================================
  // TRUSTED FEEDBACK DATA
  // ==========================================

  const [feedbackInfo, setFeedbackInfo] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(true);

  // ==========================================
  // DATE
  // ==========================================

  const dateParam = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // ==========================================
  // FORM STATES
  // ==========================================

  const [step, setStep] = useState("form");
  const [showCloseMsg, setShowCloseMsg] = useState(false);

  // ==========================================
  // PREVENT BROWSER BACK BUTTON AFTER SUBMIT
  // ==========================================

  useEffect(() => {
    if (step === "success") {
      window.history.pushState(null, "", window.location.href);

      const handlePopState = () => {
        window.history.pushState(null, "", window.location.href);
      };

      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [step]);

  const handleCloseTab = () => {
    window.close();
    setShowCloseMsg(true);
  };

  // Questions from database
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  // Ratings
  const [ratings, setRatings] = useState({});

  // Comment
  const [comment, setComment] = useState("");

  // General validation
  const [validationError, setValidationError] = useState("");

  // Submit loading
  const [submitting, setSubmitting] = useState(false);

  // ==========================================
  // TRUSTED DATA FROM BACKEND
  // ==========================================

  const facultyName = feedbackInfo?.facultyName || "";

  const subjectName = feedbackInfo?.subject || "";

  const facultyIdParam = feedbackInfo?.facultyId || "";

  const classNameParam = feedbackInfo?.level || "";

  const timeParam = feedbackInfo?.lectureTime || "";

  const lectureEndTimeParam =
    feedbackInfo?.lectureEndTime || "";

  // ==========================================
  // VERIFY FEEDBACK TOKEN
  // ==========================================

  useEffect(() => {
    const verifyToken = async () => {
      try {
        setLoadingFeedback(true);
        setValidationError("");

        // Demo/Test bypass for local testing
        if (token === "demo" || token === "test") {
          setFeedbackInfo({
            facultyName: "Dr. Demo Professor",
            subject: "Computer Networks & Security",
            facultyId: "demo123",
            level: "B.Tech 3rd Year (Section A)",
            lectureTime: "10:00 AM - 11:30 AM",
            lectureEndTime: "11:30 AM",
          });
          return;
        }

        // Token missing
        if (!token) {
          setValidationError(
            "Invalid feedback link. Feedback token is missing."
          );
          return;
        }

        const response = await fetch(
          `${API_URL}/api/feedback/verify-token?token=${encodeURIComponent(
            token
          )}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          setValidationError(
            data.message || "Invalid or expired feedback link."
          );
          return;
        }

        // Store trusted data returned by backend
        setFeedbackInfo(data.feedback);

      } catch (error) {
        console.error(
          "Feedback token verification error:",
          error
        );

        setValidationError(
          "Unable to verify feedback link. Please try again."
        );
      } finally {
        setLoadingFeedback(false);
      }
    };

    verifyToken();
  }, [token]);

  // ==========================================
  // FETCH QUESTIONS
  // ==========================================

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoadingQuestions(true);

        const response = await fetch(
          `${API_URL}/api/questions`
        );

        const data = await response.json();

        if (response.ok && data.success && data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
        } else if (token === "demo" || token === "test") {
          setQuestions([
            { _id: "q1", text: "How clearly did the faculty explain the concepts during today's lecture?" },
            { _id: "q2", text: "Was the faculty punctual and well-prepared for the session?" },
            { _id: "q3", text: "How engaging and interactive was the teaching method?" },
            { _id: "q4", text: "How effectively were your doubts and queries resolved?" },
            { _id: "q5", text: "What is your overall rating for today's lecture?" },
          ]);
        } else {
          console.error(
            "Failed to fetch questions:",
            data.message
          );

          setValidationError(
            data.message || "Failed to load questions."
          );
        }
      } catch (error) {
        console.error(
          "Error fetching questions:",
          error
        );

        if (token === "demo" || token === "test") {
          setQuestions([
            { _id: "q1", text: "How clearly did the faculty explain the concepts during today's lecture?" },
            { _id: "q2", text: "Was the faculty punctual and well-prepared for the session?" },
            { _id: "q3", text: "How engaging and interactive was the teaching method?" },
            { _id: "q4", text: "How effectively were your doubts and queries resolved?" },
            { _id: "q5", text: "What is your overall rating for today's lecture?" },
          ]);
        } else {
          setValidationError(
            "Unable to load feedback questions."
          );
        }
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, []);

  // ==========================================
  // RATING CHANGE
  // ==========================================

  const handleRatingChange = (qIndex, value) => {
    setRatings((prev) => ({
      ...prev,
      [qIndex]: value,
    }));

    setValidationError("");
  };

  // ==========================================
  // SUBMIT FEEDBACK
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear old errors
    setValidationError("");

    // ==========================================
    // 1. TOKEN CHECK
    // ==========================================

    if (!token || !feedbackInfo) {
      setValidationError(
        "Invalid or expired feedback link."
      );
      return;
    }

    // ==========================================
    // 2. QUESTIONS CHECK
    // ==========================================

    if (questions.length === 0) {
      setValidationError(
        "No questions are available."
      );
      return;
    }

    // ==========================================
    // 3. CHECK ALL QUESTIONS ANSWERED
    // ==========================================

    const unanswered = [];

    questions.forEach((_, idx) => {
      if (!ratings[idx]) {
        unanswered.push(idx + 1);
      }
    });

    if (unanswered.length > 0) {
      setValidationError(
        `Please provide ratings for all questions. Unanswered: ${unanswered.join(
          ", "
        )}`
      );
      return;
    }

    // ==========================================
    // 4. CHECK EXPECTED 5 QUESTIONS
    // ==========================================

    if (questions.length < 5) {
      setValidationError(
        "Feedback questions are not configured correctly. Please contact administrator."
      );
      return;
    }

    // ==========================================
    // 5. PREPARE METRICS
    // ==========================================

    const metrics = {
      Explanation: Number(ratings[0]),
      Punctuality: Number(ratings[1]),
      Engagement: Number(ratings[2]),
      Resolution: Number(ratings[3]),
      Overall: Number(ratings[4]),
    };

    // ==========================================
    // 6. EXTRA VALIDATION
    // ==========================================

    const invalidMetric = Object.entries(metrics).some(
      ([, value]) =>
        value < 1 ||
        value > 5 ||
        Number.isNaN(value)
    );

    if (invalidMetric) {
      setValidationError(
        "Please select a valid rating for every question."
      );
      return;
    }

    if (token === "demo" || token === "test") {
      setStep("success");
      return;
    }

    try {
      setSubmitting(true);

      // ==========================================
      // 7. SEND TO BACKEND
      // ==========================================

      const response = await fetch(
        `${API_URL}/api/feedback/submit`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            token,
            metrics,
            remarks: comment.trim(),
          }),
        }
      );

      const data = await response.json();

      // ==========================================
      // 8. HANDLE BACKEND ERROR
      // ==========================================

      if (!response.ok || !data.success) {
        const message =
          data.message ||
          "Feedback submission failed.";

        console.error(
          "Feedback submission failed:",
          message
        );

        setValidationError(message);

        // IMPORTANT:
        // Do not show success screen
        return;
      }

      // ==========================================
      // 9. SUCCESS
      // ==========================================
      setStep("success");

    } catch (error) {
      console.error(
        "Feedback submission error:",
        error
      );

      setValidationError(
        "Unable to submit feedback. Please check your internet connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loadingFeedback) {
    return (
      <div className="feedback-form-container">
        <header className="student-header">
          <div className="header-brand">
            <img
              src={ssecLogo}
              alt="SSISM Logo"
              className="student-logo"
            />

            <div>
              <h1>Singaji Educational Society</h1>
              <p>Student Lecture Feedback Portal</p>
            </div>
          </div>
        </header>

        <main className="feedback-form-main">
          <div className="feedback-card-wrapper">
            <div className="loading-questions">
              Verifying feedback link...
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ==========================================
  // INVALID TOKEN SCREEN
  // ==========================================

  if (!feedbackInfo) {
    return (
      <div className="feedback-form-container">
        <header className="student-header">
          <div className="header-brand">
            <img
              src={ssecLogo}
              alt="SSISM Logo"
              className="student-logo"
            />

            <div>
              <h1>Singaji Educational Society</h1>
              <p>Student Lecture Feedback Portal</p>
            </div>
          </div>
        </header>

        <main className="feedback-form-main">
          <div className="feedback-card-wrapper">
            <div className="feedback-error-banner">
              <FiAlertTriangle style={{ marginRight: "6px", verticalAlign: "-2px" }} />
              {validationError ||
                "Invalid feedback link."}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="feedback-form-container">

      {/* ==========================================
          HEADER
      ========================================== */}

      <header className="student-header">
        <div className="header-brand">
          <img
            src={ssecLogo}
            alt="SSISM Logo"
            className="student-logo"
          />

          <div>
            <h1>Singaji Educational Society</h1>
            <p>Student Lecture Feedback Portal</p>
          </div>
        </div>
      </header>

      <main className="feedback-form-main">

        {/* ==========================================
            STEP 1: INVITATION
        ========================================== */}

        {step === "invite" && (
          <div className="feedback-card-wrapper invite-card">

            <div className="email-invitation-banner">
              <span className="email-badge">
                <FiMail style={{ marginRight: "6px", verticalAlign: "-2px" }} />
                Lecture Completed Notification
              </span>

              <h2>Your Feedback Matters!</h2>

              <p>
                You recently attended the lecture session.
                Please share your honest feedback to help us
                continuously improve teaching quality.
              </p>
            </div>

            <div className="lecture-meta-card">

              <div className="meta-row">
                <span className="meta-label">
                  Faculty Name:
                </span>

                <strong className="meta-val">
                  {facultyName}
                </strong>
              </div>

              <div className="meta-row">
                <span className="meta-label">
                  Subject:
                </span>

                <strong className="meta-val">
                  {subjectName}
                </strong>
              </div>

              <div className="meta-row">
                <span className="meta-label">
                  Class & Group:
                </span>

                <strong className="meta-val">
                  {classNameParam || "Not available"}
                </strong>
              </div>

              <div className="meta-row">
                <span className="meta-label">
                  Lecture Time:
                </span>

                <strong className="meta-val">
                  <FiClock style={{ marginRight: "6px", verticalAlign: "-2px" }} />
                  {timeParam} ({dateParam})
                </strong>
              </div>

            </div>

            <div className="invite-footer">

              <p className="anon-note">
                <FiLock style={{ marginRight: "6px", verticalAlign: "-2px" }} />
                Your feedback is 100% anonymous.
                Student identity is never shared.
              </p>

              <button
                className="student-card-btn give-feedback-btn"
                onClick={() => setStep("form")}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                Give Feedback <FiArrowRight />
              </button>

            </div>
          </div>
        )}

        {/* ==========================================
            STEP 2: FEEDBACK FORM
        ========================================== */}

        {step === "form" && (
          <div className="feedback-card-wrapper">

            <div className="lecture-info-header">
              <h2>
                Student Feedback Questionnaire
              </h2>

              <p>
                Faculty:{" "}
                <strong>{facultyName}</strong>{" "}
                | Subject:{" "}
                <strong>{subjectName}</strong>
              </p>
            </div>

            {/* GENERAL ERROR */}

            {validationError && (
              <div className="feedback-error-banner">
                <FiAlertTriangle style={{ marginRight: "6px", verticalAlign: "-2px" }} />
                {validationError}
              </div>
            )}

            {loadingQuestions ? (
              <div className="loading-questions">
                Loading questions...
              </div>
            ) : questions.length === 0 ? (
              <div className="feedback-error-banner">
                No questions available.
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="questions-form"
              >

                {/* ==========================================
                    DB QUESTIONS
                ========================================== */}

                {questions.map((question, index) => (
                  <div
                    key={question._id}
                    className="form-q-block"
                  >

                    <p className="q-text">
                      <strong>
                        {index + 1}.{" "}
                        {question.text}
                      </strong>
                    </p>

                    <div className="star-rating-row">

                      {[1, 2, 3, 4, 5].map(
                        (val) => (
                          <button
                            key={val}
                            type="button"
                            disabled={submitting}
                            className={`star-option-btn ${ratings[index] >= val
                              ? "active-star"
                              : ""
                              }`}
                            onClick={() =>
                              handleRatingChange(
                                index,
                                val
                              )
                            }
                            title={`${val} - ${val === 1
                              ? "Poor"
                              : val === 2
                                ? "Fair"
                                : val === 3
                                  ? "Average"
                                  : val === 4
                                    ? "Good"
                                    : "Excellent"
                              }`}
                          >
                            <FaStar />
                          </button>
                        )
                      )}

                      <span className="star-rating-label">
                        {ratings[index]
                          ? `${ratings[index]} / 5 (${ratings[index] === 1
                            ? "Poor"
                            : ratings[index] === 2
                              ? "Fair"
                              : ratings[index] === 3
                                ? "Average"
                                : ratings[index] === 4
                                  ? "Good"
                                  : "Excellent"
                          })`
                          : "Select Rating"}
                      </span>

                    </div>
                  </div>
                ))}

                {/* ==========================================
                    COMMENTS
                ========================================== */}

                <div className="form-q-block">

                  <label className="q-text">
                    <strong>
                      Additional Comments / Suggestions
                      (Optional)
                    </strong>
                  </label>

                  <textarea
                    rows="3"
                    className="remarks-textarea"
                    placeholder="Share any suggestions or comments about today's lecture..."
                    value={comment}
                    onChange={(e) =>
                      setComment(e.target.value)
                    }
                    disabled={submitting}
                  />

                </div>

                {/* ==========================================
                    SUBMIT BUTTON
                ========================================== */}

                <button
                  type="submit"
                  className="student-card-btn submit-feedback-btn"
                  disabled={submitting}
                >
                  {submitting
                    ? "Submitting Feedback..."
                    : "Submit Feedback"}
                </button>

              </form>
            )}

          </div>
        )}

        {/* ==========================================
            STEP 3: SUCCESS
        ========================================== */}

        {step === "success" && (
          <div className="submission-success-card">

            <div className="success-icon">
              <FiCheckCircle size={36} />
            </div>

            <h2>
              Feedback Submitted Successfully!
            </h2>

            <p>
              Thank you for helping us improve teaching
              quality at SSISM.
            </p>

            <p className="anon-sub">
              Your response has been recorded anonymously.
            </p>

            <button
              className="student-card-btn close-tab-btn"
              onClick={handleCloseTab}
            >
              <FiXCircle size={18} /> Close Window
            </button>

            {showCloseMsg && (
              <p className="close-tab-note">
                If the tab does not close automatically, please close this browser tab manually.
              </p>
            )}

          </div>
        )}

      </main>
    </div>
  );
}

export default FeedbackForm;