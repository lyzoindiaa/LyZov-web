const variantClasses = {
  primary: "btn-primary",
  accent: "btn-accent",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

const sizeClasses = {
  sm: "btn-sm",
  md: "btn-md",
  lg: "btn-lg",
};

const Button = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  type = "button",
  className = "",
  icon: Icon,
  onClick,
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`btn ${variantClasses[variant] || "btn-primary"} ${sizeClasses[size] || "btn-md"} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <>
          {Icon && <Icon size={16} />}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
