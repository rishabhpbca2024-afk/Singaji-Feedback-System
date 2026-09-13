import React from 'react';

function Button({ label, onClick, type = 'button', variant = 'primary', disabled = false }) {
  return (
    <button
      type={type}
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

export default Button;
