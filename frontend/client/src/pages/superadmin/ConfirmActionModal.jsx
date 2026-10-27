import React, { useEffect } from "react";
import { AlertCircle, X, RefreshCw } from "lucide-react";

const ConfirmActionModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  confirmVariant = "danger", // 'danger' | 'accent' | 'primary'
  loading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const isDanger = confirmVariant === "danger";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
        animation: "modalFadeIn 0.2s ease-out",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "28rem",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--surface)",
          borderRadius: "1rem",
          border: "1px solid var(--border)",
          boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.3)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "1.25rem 1.5rem",
            display: "flex",
            alignItems: "flex-start",
            gap: "0.875rem",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              width: "2.5rem",
              height: "2.5rem",
              borderRadius: "50%",
              backgroundColor: isDanger ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)",
              color: isDanger ? "#ef4444" : "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AlertCircle size={20} />
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--ink)" }}>
              {title}
            </h3>
            <p
              style={{
                margin: "0.35rem 0 0",
                fontSize: "0.8125rem",
                color: "var(--ink-muted)",
                lineHeight: 1.5,
              }}
            >
              {message}
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: "none",
              border: "none",
              color: "var(--ink-muted)",
              cursor: loading ? "not-allowed" : "pointer",
              padding: "0.25rem",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            padding: "0.875rem 1.5rem",
            backgroundColor: "var(--bg-raised)",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "0.5rem 1.125rem",
              borderRadius: "0.5rem",
              border: "1px solid var(--border)",
              backgroundColor: "transparent",
              color: "var(--ink-muted)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "0.5rem",
              border: "none",
              backgroundColor: isDanger ? "#ef4444" : "var(--accent)",
              color: "#ffffff",
              fontSize: "0.8125rem",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              boxShadow: isDanger
                ? "0 2px 8px rgba(239, 68, 68, 0.3)"
                : "0 2px 8px rgba(0, 0, 0, 0.15)",
            }}
          >
            {loading && <RefreshCw size={13} className="animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmActionModal;
