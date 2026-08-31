import { Link } from "react-router-dom";
import logoSrc from "../../assets/lyzov-logo.png";
import logoDarkSrc from "../../assets/lyzov-logo-dark.png";

const SIZES = {
  xs: 36,
  sm: 50,
  md: 64,
  lg: 84,
  xl: 110,
  nav: 76,
};

/**
 * LyZov wordmark logo — bundled via Vite from src/assets.
 */
const Logo = ({
  size = "md",
  linked = true,
  to = "/",
  className = "",
  style = {},
  variant = "default",
}) => {
  const height = SIZES[size] ?? SIZES.md;

  const imgClass = `logo-img ${variant === "elevated" ? "logo-img-elevated" : ""}`;
  const imgStyle = {
    height,
    width: "auto",
    maxWidth: "100%",
    objectFit: "contain",
    display: "block",
    ...style,
  };

  const image = (
    <>
      <img
        src={logoSrc}
        alt="LyZov Store — Premium Lifestyle Shopping"
        width={Math.round(height * 2.8)}
        height={height}
        className={`${imgClass} dark:hidden`}
        style={imgStyle}
        loading="eager"
        decoding="async"
      />
      <img
        src={logoDarkSrc}
        alt="LyZov Store — Premium Lifestyle Shopping"
        width={Math.round(height * 2.8)}
        height={height}
        className={`${imgClass} hidden dark:block`}
        style={imgStyle}
        loading="eager"
        decoding="async"
      />
    </>
  );

  if (!linked) {
    return <span className={`logo-wrap ${className}`}>{image}</span>;
  }

  return (
    <Link
      to={to}
      className={`logo-wrap ${className}`}
      aria-label="LyZov Store — Go to homepage"
      style={{ display: "inline-flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}
    >
      {image}
    </Link>
  );
};

export default Logo;
