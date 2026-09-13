import React from 'react';

function FeedbackCard({ subject, faculty, date, rating }) {
  return (
    <div className="feedback-card">
      <h3>{subject || 'Subject'}</h3>
      <p>Faculty: {faculty || 'N/A'}</p>
      <p>Date: {date || 'N/A'}</p>
      <p>Rating: {rating || 'N/A'}</p>
    </div>
  );
}

export default FeedbackCard;
