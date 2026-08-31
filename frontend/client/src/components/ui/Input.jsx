import { forwardRef, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";

const Input = forwardRef(
  (
    {
      label,
      error,
      success,
      hint,
      type = "text",
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      className = "",
      containerClassName = "",
      required = false,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className={`w-full flex flex-col gap-1.5 ${containerClassName}`}>
        {label && (
          <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
            <span>
              {label} {required && <span className="text-[var(--red)]">*</span>}
            </span>
          </label>
        )}

        <div className="relative flex items-center">
          {LeftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-[var(--ink-subtle)]">
              <LeftIcon size={16} />
            </div>
          )}

          <input
            ref={ref}
            type={inputType}
            className={`
              w-full rounded-xl border bg-[var(--bg-subtle)] px-3.5 py-2.5 text-sm text-[var(--ink)]
              placeholder:text-[var(--ink-subtle)] outline-none transition-all duration-200
              ${LeftIcon ? "pl-10" : "pl-3.5"}
              ${isPassword || error || success || RightIcon ? "pr-10" : "pr-3.5"}
              ${
                error
                  ? "!border-[var(--red)] !bg-[var(--red-bg)] focus:!ring-2 focus:!ring-[var(--red)]/20 input-error"
                  : success
                  ? "!border-[var(--green)] focus:!ring-2 focus:!ring-[var(--green)]/20"
                  : "border-[var(--border)] hover:border-[var(--border-dark)] focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:ring-3 focus:ring-[var(--accent-bg)]"
              }
              ${className}
            `}
            {...props}
          />

          {/* Right Action / Status Icons */}
          <div className="absolute right-3 flex items-center gap-1.5 text-[var(--ink-subtle)]">
            {isPassword && (
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-[var(--ink-subtle)] hover:text-[var(--ink)] transition-colors p-0.5 rounded-md focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}

            {error && !isPassword && (
              <AlertCircle size={16} className="text-[var(--red)] animate-pulse shrink-0" />
            )}

            {success && !error && !isPassword && (
              <CheckCircle2 size={16} className="text-[var(--green)] shrink-0" />
            )}

            {RightIcon && !isPassword && !error && !success && (
              <RightIcon size={16} />
            )}
          </div>
        </div>

        {/* Error Feedback Message */}
        {error && (
          <p className="flex items-center gap-1 text-xs font-medium text-[var(--red)] input-error mt-0.5">
            <AlertCircle size={12} className="shrink-0" />
            <span>{error}</span>
          </p>
        )}

        {/* Hint Feedback Message */}
        {hint && !error && (
          <p className="text-xs text-[var(--ink-subtle)] mt-0.5">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
