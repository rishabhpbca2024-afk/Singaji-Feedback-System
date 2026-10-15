import React from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo,
  FiTrash2,
  FiX,
  FiLoader,
} from "react-icons/fi";
import "./ConfirmModal.css";

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger", // 'danger' | 'warning' | 'success' | 'info'
  isLoading = false,
}) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "danger":
        return <FiTrash2 size={26} />;
      case "warning":
        return <FiAlertTriangle size={26} />;
      case "success":
        return <FiCheckCircle size={26} />;
      case "info":
      default:
        return <FiInfo size={26} />;
    }
  };

  const isAlertOnly = typeof onConfirm !== "function";

  return (
    <div className="confirm-modal-overlay" onClick={!isLoading ? onClose : undefined}>
      <div
        className={`confirm-modal-box confirm-modal-${type}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          className="confirm-modal-close"
          onClick={onClose}
          disabled={isLoading}
          aria-label="Close"
        >
          <FiX size={18} />
        </button>

        <div className="confirm-modal-body">
          <div className={`confirm-icon-circle confirm-icon-${type}`}>
            {getIcon()}
          </div>

          <h3 className="confirm-modal-title">{title}</h3>

          <div className="confirm-modal-message">
            {typeof message === "string" ? <p>{message}</p> : message}
          </div>
        </div>

        <div className="confirm-modal-actions">
          {!isAlertOnly && (
            <button
              type="button"
              className="confirm-btn-cancel"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            className={`confirm-btn-action confirm-btn-${type}`}
            onClick={isAlertOnly ? onClose : onConfirm}
            disabled={isLoading}
            autoFocus
          >
            {isLoading ? (
              <span className="confirm-btn-loading">
                <FiLoader className="spin" size={15} />
                <span>Processing...</span>
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
