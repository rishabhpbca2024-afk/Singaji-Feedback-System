import React from 'react';

function Loading({ message }) {
  return (
    <div className="loading">
      <p>{message || 'Loading...'}</p>
    </div>
  );
}

export default Loading;
