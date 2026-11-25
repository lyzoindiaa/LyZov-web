import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import heroBannerOne from "../../assets/hero-crousal-1.jpeg";
import heroBannerTwo from "../../assets/hero-crousal-2.png";
import heroBannerThree from "../../assets/Hero.png";

const AUTO_ADVANCE_MS = 10000;
const SWIPE_THRESHOLD_PX = 40;

const carouselSlides = [
  {
    id: "toys-idols-electronics",
    title: "Everything You Love, Now on LyZov — Kids Toys, Idols & Gifts, Electronics",
    image: heroBannerOne,
    to: "/shop",
    fit: "cover",
    objectPosition: "center center",
    backdrop: "#fdf4ef",
  },
  {
    id: "kitchen-home-appliances",
    title: "Everything You Love, Now on LyZov — Kitchen, Home, Cooling & Small Appliances",
    image: heroBannerTwo,
    to: "/shop",
    fit: "cover",
    objectPosition: "center 45%",
    backdrop: "#f4efea",
  },
  {
    id: "everyday-essentials",
    title: "Everything You Love, Now on LyZov — Furniture, Fashion, Electronics, Grocery, Beauty & Fitness",
    image: heroBannerThree,
    to: "/shop",
    fit: "contain",
    objectPosition: "center center",
    backdrop: "linear-gradient(90deg, #ebdcf0 0%, #f5eceb 50%, #fadcc5 100%)",
  },
];

function CollectionHero() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isTouchInteracting, setIsTouchInteracting] = useState(false);
  const touchStartXRef = useRef(null);

  const slideCount = carouselSlides.length;

  const goToSlide = useCallback(
    (index) => {
      if (slideCount <= 1) return;
      const normalized = ((index % slideCount) + slideCount) % slideCount;
      setActiveSlide(normalized);
    },
    [slideCount]
  );

  const goToNext = useCallback(() => {
    goToSlide(activeSlide + 1);
  }, [activeSlide, goToSlide]);

  const goToPrevious = useCallback(() => {
    goToSlide(activeSlide - 1);
  }, [activeSlide, goToSlide]);

  useEffect(() => {
    if (slideCount <= 1 || isTouchInteracting) return undefined;

    const timer = setTimeout(goToNext, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [activeSlide, isTouchInteracting, slideCount, goToNext]);

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
    setIsTouchInteracting(true);
  };

  const handleTouchEnd = (e) => {
    const startX = touchStartXRef.current;
    const endX = e.changedTouches[0]?.clientX ?? null;
    touchStartXRef.current = null;
    setIsTouchInteracting(false);

    if (startX === null || endX === null) return;
    const deltaX = endX - startX;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;

    if (deltaX < 0) {
      goToNext();
    } else {
      goToPrevious();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goToNext();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goToPrevious();
    }
  };

  return (
    <section
      className="about-hero-carousel"
      aria-roledescription="carousel"
      aria-label="Featured LyZov collections"
      onKeyDown={handleKeyDown}
    >
      <div className="container-page">
        <div
          className="about-hero-image-wrap"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={() => setIsTouchInteracting(false)}
        >
          <div
            className="about-hero-track"
            style={{ transform: `translateX(-${activeSlide * 100}%)` }}
          >
            {carouselSlides.map((slide, index) => (
              <Link
                key={slide.id}
                to={slide.to}
                className="about-hero-slide"
                style={{ background: slide.backdrop }}
                aria-label={slide.title}
                tabIndex={index === activeSlide ? 0 : -1}
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  loading="eager"
                  decoding="async"
                  fetchPriority={index === 0 ? "high" : "auto"}
                  className="about-hero-image"
                  style={{
                    objectFit: slide.fit,
                    objectPosition: slide.objectPosition,
                  }}
                />
              </Link>
            ))}
          </div>

          {slideCount > 1 && (
            <>
              <button
                type="button"
                className="about-hero-nav about-hero-nav--prev"
                onClick={goToPrevious}
                aria-label="Previous banner"
              >
                <ChevronLeft size={20} strokeWidth={2.4} />
              </button>

              <button
                type="button"
                className="about-hero-nav about-hero-nav--next"
                onClick={goToNext}
                aria-label="Next banner"
              >
                <ChevronRight size={20} strokeWidth={2.4} />
              </button>

              <div className="about-hero-dots" role="tablist" aria-label="Banner slides">
                {carouselSlides.map((slide, index) => {
                  const isActive = index === activeSlide;
                  return (
                    <button
                      key={slide.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-label={`Go to slide ${index + 1} of ${slideCount}`}
                      className={`about-hero-dot ${isActive ? "is-active" : ""}`}
                      onClick={() => goToSlide(index)}
                    >
                      {isActive && (
                        <span
                          key={`progress-${activeSlide}-${isTouchInteracting ? "paused" : "run"}`}
                          className="about-hero-dot-progress"
                          style={{
                            animationDuration: `${AUTO_ADVANCE_MS}ms`,
                            animationPlayState: isTouchInteracting ? "paused" : "running",
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default CollectionHero;
