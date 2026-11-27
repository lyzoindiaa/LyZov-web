import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import lightLogoPng from "../../assets/lyzov-logo-light.png";
import darkLogoPng from "../../assets/lyzov-logo-dark.png";
import lightLogoWebp from "../../assets/lyzov-logo-light.webp";
import darkLogoWebp from "../../assets/lyzov-logo-dark.webp";

const SIZES = {
  xs: 36,
  sm: 50,
  md: 64,
  lg: 84,
  xl: 110,
  nav: 60,
};

/**
 * LyZov wordmark logo — single image rendered dynamically based on active theme.
 */
const Logo = ({
  size = "md",
  linked = true,
  to = "/",
  className = "",
  style = {},
  variant = "default",
}) => {
  const theme = useSelector((state) => state.ui?.theme || "dark");
  const isDark = theme === "dark";
  const height = SIZES[size] ?? SIZES.md;

  const webpSrc = isDark ? darkLogoWebp : lightLogoWebp;
  const pngSrc = isDark ? darkLogoPng : lightLogoPng;
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
    <picture>
      <source srcSet={webpSrc} type="image/webp" />
      <img
        src={pngSrc}
        alt="LyZov — Premium Lifestyle Shopping"
        width={Math.round(height * 2)}
        height={height}
        className={imgClass}
        style={imgStyle}
        loading="eager"
        decoding="async"
      />
    </picture>
  );

  if (!linked) {
    return <span className={`logo-wrap ${className}`}>{image}</span>;
  }

  return (
    <Link
      to={to}
      className={`logo-wrap ${className}`}
      aria-label="LyZov — Go to homepage"
      style={{ display: "inline-flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}
    >
      {image}
    </Link>
  );
};

export default Logo;
