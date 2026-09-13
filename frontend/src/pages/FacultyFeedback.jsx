import React, { useEffect, useState } from "react";
import "./FacultyFeedback.css";


const API_URL = import.meta.env.VITE_API_URL;

function FacultyFeedback() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  });

  const [feedbackData, setFeedbackData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // GET AUTH DATA
  // ========================================================

  // =========================================================
  // FETCH MY FEEDBACK
  // =========================================================
   
  const fetchMyFeedback = async () => {
  setLoading(true);
  setError("");

  try {
    const response = await fetch(
      `${API_URL}/api/feedback/my-feedback?date=${selectedDate}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.message || "Failed to fetch feedback."
      );
    }

    setFeedbackData(data);
  } catch (error) {
    console.error(
      "Fetch faculty feedback error:",
      error
    );

    setError(
      error.message ||
        "Something went wrong while loading feedback."
    );

    setFeedbackData(null);
  } finally {
    setLoading(false);
  }
};

  // =========================================================
  // DATE CHANGE
  // =========================================================

  useEffect(() => {
    fetchMyFeedback();
  }, [selectedDate]);

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (dateString) => {
    if (!dateString) {
      return "";
    }

    const date = new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // =========================================================
  // RATING CLASS
  // =========================================================

  const getRatingClass = (rating) => {
    const value = Number(rating) || 0;

    if (value >= 4) {
      return "rating-good";
    }

    if (value >= 3) {
      return "rating-average";
    }

    return "rating-low";
  };

  // =========================================================
  // STARS
  // =========================================================

  const getStars = (rating) => {
    const value = Math.round(Number(rating) || 0);

    if (value <= 0) {
      return "☆";
    }

    return "★".repeat(
      Math.max(0, Math.min(value, 5))
    );
  };

  // =========================================================
  // MAIN DATA
  // =========================================================

  const faculty = feedbackData?.faculty || {};

  const facultyName =
    typeof faculty === "object"
      ? faculty.name || "Faculty"
      : String(faculty);

  const facultyDepartment =
    typeof faculty === "object"
      ? faculty.department || ""
      : "";

  const lectures = Array.isArray(
    feedbackData?.lectures
  )
    ? feedbackData.lectures
    : [];

  const totalFeedbacks =
    Number(feedbackData?.totalFeedbacks) || 0;

  const averageRating =
    Number(feedbackData?.averageRating) || 0;

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="faculty-feedback-page">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="faculty-feedback-header">

        <div>
          <h1>My Feedback</h1>

          <p>
            View feedback received for your lectures
            date-wise.
          </p>
        </div>

        <div className="faculty-feedback-date-box">

          <label htmlFor="feedback-date">
            Select Date
          </label>

          <input
            id="feedback-date"
            type="date"
            value={selectedDate}
            onChange={(event) =>
              setSelectedDate(event.target.value)
            }
          />

        </div>

      </div>


      {/* =====================================================
          SELECTED DATE
      ====================================================== */}

      <div className="selected-feedback-date">

        <span>
          Feedback for:
        </span>

        <strong>
          {formatDate(selectedDate)}
        </strong>

      </div>


      {/* =====================================================
          LOADING
      ====================================================== */}

      {loading && (
        <div className="feedback-loading">

          <div className="feedback-spinner"></div>

          <p>
            Loading your feedback...
          </p>

        </div>
      )}


      {/* =====================================================
          ERROR
      ====================================================== */}

      {!loading && error && (
        <div className="feedback-error">

          <div className="feedback-error-icon">
            !
          </div>

          <div>

            <h3>
              Unable to load feedback
            </h3>

            <p>
              {error}
            </p>

            <button
              type="button"
              onClick={fetchMyFeedback}
            >
              Try Again
            </button>

          </div>

        </div>
      )}


      {/* =====================================================
          DATA
      ====================================================== */}

      {!loading &&
        !error &&
        feedbackData && (
          <>

            {/* =================================================
                FACULTY INFO
            ================================================== */}

            <div className="faculty-info-card">

              <div className="faculty-avatar">

                {facultyName
                  .charAt(0)
                  .toUpperCase()}

              </div>

              <div className="faculty-info-content">

                <h2>
                  {facultyName}
                </h2>

                {facultyDepartment && (
                  <p>
                    Department:{" "}
                    {facultyDepartment}
                  </p>
                )}

              </div>

            </div>


            {/* =================================================
                SUMMARY CARDS
            ================================================== */}

            <div className="feedback-summary-grid">

              {/* Total Feedback */}

              <div className="feedback-summary-card">

                <div className="summary-icon">
                  📋
                </div>

                <div>

                  <span>
                    Total Responses
                  </span>

                  <strong>
                    {totalFeedbacks}
                  </strong>

                </div>

              </div>


              {/* Average Rating */}

              <div className="feedback-summary-card">

                <div className="summary-icon">
                  ⭐
                </div>

                <div>

                  <span>
                    Overall Rating
                  </span>

                  <strong>
                    {averageRating.toFixed(1)}
                    <small>
                      {" "} / 5
                    </small>
                  </strong>

                </div>

              </div>


              {/* Total Lectures */}

              <div className="feedback-summary-card">

                <div className="summary-icon">
                  📚
                </div>

                <div>

                  <span>
                    Lectures
                  </span>

                  <strong>
                    {lectures.length}
                  </strong>

                </div>

              </div>

            </div>


            {/* =================================================
                NO LECTURES
            ================================================== */}

            {lectures.length === 0 && (
              <div className="no-feedback-card">

                <div className="no-feedback-icon">
                  📭
                </div>

                <h2>
                  No Feedback Found
                </h2>

                <p>
                  There is no feedback available for
                  your lectures on{" "}
                  {formatDate(selectedDate)}.
                </p>

              </div>
            )}


            {/* =================================================
                LECTURE-WISE FEEDBACK
            ================================================== */}

            {lectures.length > 0 && (
              <div className="lectures-section">

                <div className="section-title">

                  <div>

                    <h2>
                      Lecture-wise Feedback
                    </h2>

                    <p>
                      Feedback received for each
                      lecture.
                    </p>

                  </div>

                  <span className="lecture-count">
                    {lectures.length}{" "}
                    {lectures.length === 1
                      ? "Lecture"
                      : "Lectures"}
                  </span>

                </div>


                {/* =================================================
                    LECTURE CARDS
                ================================================== */}

                <div className="lecture-feedback-list">

                  {lectures.map(
                    (lecture, index) => {

                      const ratings =
                        lecture?.ratings || {};

                      const explanation =
                        Number(
                          ratings.Explanation
                        ) || 0;

                      const punctuality =
                        Number(
                          ratings.Punctuality
                        ) || 0;

                      const engagement =
                        Number(
                          ratings.Engagement
                        ) || 0;

                      const resolution =
                        Number(
                          ratings.Resolution
                        ) || 0;

                      const overall =
                        Number(
                          ratings.Overall
                        ) || 0;

                      const feedbacks =
                        Array.isArray(
                          lecture?.feedbacks
                        )
                          ? lecture.feedbacks
                          : [];

                      return (
                        <div
                          className="lecture-card"
                          key={`${lecture?.scheduleId || "lecture"}-${lecture?.slotName || index}`}
                        >

                          {/* =================================
                              LECTURE HEADER
                          ================================== */}

                          <div className="lecture-card-header">

                            <div className="lecture-number">
                              {index + 1}
                            </div>


                            <div className="lecture-main-info">

                              <h3>
                                {lecture?.subject ||
                                  "Subject"}
                              </h3>

                              <div className="lecture-meta">

                                {lecture?.startTime &&
                                  lecture?.endTime && (
                                    <span>
                                      🕐{" "}
                                      {
                                        lecture.startTime
                                      }{" "}
                                      -{" "}
                                      {
                                        lecture.endTime
                                      }
                                    </span>
                                  )}

                                {lecture?.className && (
                                  <span>
                                    🏫{" "}
                                    {
                                      lecture.className
                                    }
                                  </span>
                                )}

                                {Array.isArray(
                                  lecture?.groups
                                ) &&
                                  lecture.groups
                                    .length > 0 && (
                                    <span>
                                      👥{" "}
                                      {lecture.groups.join(
                                        ", "
                                      )}
                                    </span>
                                  )}

                              </div>

                            </div>


                            {/* Response Count */}

                            <div className="lecture-response">

                              <strong>
                                {lecture?.feedbackCount ||
                                  0}
                              </strong>

                              <span>
                                Responses
                              </span>

                            </div>

                          </div>


                          {/* =================================
                              RATINGS
                          ================================== */}

                          <div className="rating-grid">

                            {/* Explanation */}

                            <div className="rating-item">

                              <div className="rating-label">
                                Explanation
                              </div>

                              <div className="rating-value-row">

                                <strong>
                                  {explanation.toFixed(
                                    1
                                  )}
                                </strong>

                                <span
                                  className={`rating-stars ${getRatingClass(
                                    explanation
                                  )}`}
                                >
                                  {getStars(
                                    explanation
                                  )}
                                </span>

                              </div>

                            </div>


                            {/* Punctuality */}

                            <div className="rating-item">

                              <div className="rating-label">
                                Punctuality
                              </div>

                              <div className="rating-value-row">

                                <strong>
                                  {punctuality.toFixed(
                                    1
                                  )}
                                </strong>

                                <span
                                  className={`rating-stars ${getRatingClass(
                                    punctuality
                                  )}`}
                                >
                                  {getStars(
                                    punctuality
                                  )}
                                </span>

                              </div>

                            </div>


                            {/* Engagement */}

                            <div className="rating-item">

                              <div className="rating-label">
                                Engagement
                              </div>

                              <div className="rating-value-row">

                                <strong>
                                  {engagement.toFixed(
                                    1
                                  )}
                                </strong>

                                <span
                                  className={`rating-stars ${getRatingClass(
                                    engagement
                                  )}`}
                                >
                                  {getStars(
                                    engagement
                                  )}
                                </span>

                              </div>

                            </div>


                            {/* Resolution */}

                            <div className="rating-item">

                              <div className="rating-label">
                                Resolution
                              </div>

                              <div className="rating-value-row">

                                <strong>
                                  {resolution.toFixed(
                                    1
                                  )}
                                </strong>

                                <span
                                  className={`rating-stars ${getRatingClass(
                                    resolution
                                  )}`}
                                >
                                  {getStars(
                                    resolution
                                  )}
                                </span>

                              </div>

                            </div>


                            {/* Overall */}

                            <div className="rating-item rating-item-overall">

                              <div className="rating-label">
                                Overall
                              </div>

                              <div className="rating-value-row">

                                <strong>
                                  {overall.toFixed(
                                    1
                                  )}
                                </strong>

                                <span
                                  className={`rating-stars ${getRatingClass(
                                    overall
                                  )}`}
                                >
                                  {getStars(overall)}
                                </span>

                              </div>

                            </div>

                          </div>


                          {/* =================================
                              INDIVIDUAL FEEDBACK
                          ================================== */}

                          {feedbacks.length > 0 && (
                            <div className="individual-feedback-section">

                              <div className="individual-feedback-title">

                                <h4>
                                  Student Feedback
                                </h4>

                                <span>
                                  {feedbacks.length}
                                </span>

                              </div>


                              <div className="feedback-items">

                                {feedbacks.map(
                                  (
                                    feedback,
                                    feedbackIndex
                                  ) => {

                                    return (
                                      <div
                                        className="individual-feedback-item"
                                        key={
                                          feedback?.id ||
                                          feedbackIndex
                                        }
                                      >

                                        {/* Feedback Header */}

                                        <div className="feedback-item-top">

                                          <span className="feedback-number">
                                            #
                                            {feedbackIndex +
                                              1}
                                          </span>

                                          {feedback?.submittedAt && (
                                            <span className="feedback-time">
                                              {new Date(
                                                feedback.submittedAt
                                              ).toLocaleString(
                                                "en-IN"
                                              )}
                                            </span>
                                          )}

                                        </div>


                                        {/* Feedback Ratings */}

                                        <div className="feedback-item-ratings">

                                          <span className="mini-rating">
                                            <b>
                                              Explanation:
                                            </b>{" "}
                                            {Number(
                                              feedback.explanation
                                            ).toFixed(1)}
                                          </span>

                                          <span className="mini-rating">
                                            <b>
                                              Punctuality:
                                            </b>{" "}
                                            {Number(
                                              feedback.punctuality
                                            ).toFixed(1)}
                                          </span>

                                          <span className="mini-rating">
                                            <b>
                                              Engagement:
                                            </b>{" "}
                                            {Number(
                                              feedback.engagement
                                            ).toFixed(1)}
                                          </span>

                                          <span className="mini-rating">
                                            <b>
                                              Resolution:
                                            </b>{" "}
                                            {Number(
                                              feedback.resolution
                                            ).toFixed(1)}
                                          </span>

                                          <span className="mini-rating">
                                            <b>
                                              Overall:
                                            </b>{" "}
                                            {Number(
                                              feedback.overall
                                            ).toFixed(1)}
                                          </span>

                                        </div>


                                        {/* Student Level */}

                                        {(feedback?.studentLevel ||
                                          feedback?.section) && (
                                          <div className="feedback-student-info">

                                            {feedback?.studentLevel && (
                                              <span>
                                                Level:{" "}
                                                {
                                                  feedback.studentLevel
                                                }
                                              </span>
                                            )}

                                            {feedback?.section && (
                                              <span>
                                                Department:{" "}
                                                {
                                                  feedback.section
                                                }
                                              </span>
                                            )}

                                          </div>
                                        )}


                                        {/* Remarks */}

                                        {feedback?.remarks &&
                                          feedback.remarks.trim() !==
                                            "" && (
                                            <div className="feedback-remarks">

                                              <span>
                                                Remarks
                                              </span>

                                              <p>
                                                {
                                                  feedback.remarks
                                                }
                                              </p>

                                            </div>
                                          )}

                                      </div>
                                    );
                                  }
                                )}

                              </div>

                            </div>
                          )}


                          {/* No feedback for lecture */}

                          {feedbacks.length === 0 && (
                            <div className="lecture-no-feedback">
                              No feedback submitted for
                              this lecture.
                            </div>
                          )}

                        </div>
                      );
                    }
                  )}

                </div>

              </div>
            )}

          </>
        )}

    </div>
  );
}

export default FacultyFeedback;