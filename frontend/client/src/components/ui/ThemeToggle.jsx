import { useDispatch, useSelector } from "react-redux";
import { SunMedium, MoonStar } from "lucide-react";
import { toggleTheme } from "../../features/ui/uiSlice";

const ThemeToggle = ({ className = "", size = 18, showLabel = false }) => {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.ui.theme);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => dispatch(toggleTheme())}
      className={`btn-icon relative inline-flex items-center justify-center transition-transform active:scale-95 ${className}`}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle dark/light theme"
      style={{
        width: showLabel ? "auto" : "2.25rem",
        height: "2.25rem",
        padding: showLabel ? "0 0.75rem" : "0",
        gap: showLabel ? "0.5rem" : "0",
        borderRadius: "9999px",
        backgroundColor: "var(--bg-raised)",
        border: "1px solid var(--border)",
        color: "var(--ink)",
        cursor: "pointer",
      }}
    >
      {isDark ? (
        <SunMedium size={size} className="text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <MoonStar size={size} className="text-slate-700 transition-transform duration-300 rotate-0 hover:-rotate-12" />
      )}
      {showLabel && (
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ink)" }}>
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
