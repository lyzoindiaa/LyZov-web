import React, { useState, useEffect, useRef } from "react";
import { Image as ImageIcon } from "lucide-react";
import { optimizeCloudinaryUrl, getCloudinarySrcSet } from "../../utils/imageOptimizer";

/**
 * High-performance LazyImage component.
 * - Native loading="lazy" + decoding="async"
 * - Shimmer skeleton state to eliminate Cumulative Layout Shift (CLS)
 * - Crossfade on asset load
 * - Fallback placeholder on network failure or empty src
 */
const LazyImage = ({
  src,
  alt = "",
  className = "",
  style = {},
  aspectRatio = "1/1",
  objectFit = "cover",
  fetchPriority = "auto",
  fallbackComponent = null,
  containerClassName = "",
  containerStyle = {},
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  // Reset state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);

    // If image is already cached by browser
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [src]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setHasError(true);
    setIsLoaded(false);
    if (onError) onError(e);
  };

  return (
    <div
      className={`relative overflow-hidden ${containerClassName}`}
      style={{
        aspectRatio,
        backgroundColor: "var(--img-tile, rgba(0, 0, 0, 0.04))",
        ...containerStyle,
      }}
    >
      {/* Skeleton Shimmer while loading */}
      {!isLoaded && !hasError && (
        <div
          className="absolute inset-0 skeleton animate-pulse"
          style={{
            background: "linear-gradient(90deg, var(--surface) 0%, var(--border) 50%, var(--surface) 100%)",
            backgroundSize: "200% 100%",
          }}
          aria-hidden="true"
        />
      )}

      {/* Main Image */}
      {!hasError && src ? (
        <img
          ref={imgRef}
          src={optimizeCloudinaryUrl(src, { width: 600 })}
          srcSet={getCloudinarySrcSet(src)}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
          alt={alt}
          loading="lazy"
          decoding="async"
          fetchPriority={fetchPriority}
          referrerPolicy="no-referrer"
          onLoad={handleLoad}
          onError={handleError}
          className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          } ${className}`}
          style={{
            objectFit,
            ...style,
          }}
        />
      ) : null}

      {/* Error Fallback */}
      {(hasError || !src) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-[var(--ink-muted)] bg-[var(--surface)] text-center">
          {fallbackComponent || (
            <>
              <ImageIcon size={28} className="opacity-40 mb-1" />
              <span className="text-[10px] font-semibold tracking-wider uppercase opacity-60">
                Image Unavailable
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default LazyImage;
