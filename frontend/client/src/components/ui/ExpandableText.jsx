import { useEffect, useRef, useState } from "react";

const ExpandableText = ({
  text,
  lines = 3,
  className = "",
  style = {},
  buttonClassName = "",
  readMoreLabel = "Read more",
  readLessLabel = "Read less",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    setIsExpanded(false);
  }, [text]);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return undefined;

    const measure = () => {
      if (!textRef.current) return;
      const node = textRef.current;
      if (isExpanded) {
        const cs = window.getComputedStyle(node);
        const fontSize = parseFloat(cs.fontSize) || 14;
        const lineHeight = parseFloat(cs.lineHeight) || fontSize * 1.65;
        setIsOverflowing(node.scrollHeight > lineHeight * lines + 4);
      } else {
        setIsOverflowing(node.scrollHeight > node.clientHeight + 2);
      }
    };

    measure();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(measure);
      observer.observe(el);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [text, lines, isExpanded]);

  if (!text) return null;

  const clampedStyle = isExpanded
    ? {
        overflowWrap: "break-word",
        ...style,
      }
    : {
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: lines,
        overflow: "hidden",
        overflowWrap: "break-word",
        ...style,
      };

  const showToggle = isExpanded || isOverflowing;

  return (
    <div className="min-w-0">
      <p ref={textRef} className={className} style={clampedStyle}>
        {text}
      </p>
      {showToggle && (
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          className={`mt-1.5 inline-flex items-center text-xs sm:text-sm font-semibold text-[var(--accent)] hover:underline cursor-pointer bg-transparent border-0 p-0 ${buttonClassName}`}
        >
          {isExpanded ? readLessLabel : readMoreLabel}
        </button>
      )}
    </div>
  );
};

export default ExpandableText;
