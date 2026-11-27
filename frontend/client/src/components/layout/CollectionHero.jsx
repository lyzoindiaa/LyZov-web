import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import heroBannerCouple from "../../assets/hero-banner-couple.jpg";
import heroBannerAppliances from "../../assets/hero-banner-appliances.jpg";
import heroBannerLifestyle from "../../assets/hero-banner-lifestyle.jpg";

const AUTO_ADVANCE_MS = 5000;

const carouselSlides = [
  {
    id: "everyday-essentials",
    title: "Everything You Love, Now on LyZov — Upto 35% OFF on first order — Furniture, Fashion, Electronics, Grocery, Beauty & Fitness",
    image: heroBannerCouple,
    to: "/shop",
    backdrop: "linear-gradient(90deg, #ead7eb 0%, #f5ece8 50%, #fbdcc4 100%)",
  },
  {
    id: "kitchen-home-appliances",
    title: "Everything You Love, Now on LyZov — Kitchen, Home, Cooling & Small Appliances",
    image: heroBannerAppliances,
    to: "/shop",
    backdrop: "#f6efe8",
  },
  {
    id: "toys-idols-electronics",
    title: "Everything You Love, Now on LyZov — Kids Toys, Idols & Gifts, Electronics",
    image: heroBannerLifestyle,
    to: "/shop",
    backdrop: "#fdf1e7",
  },
];

function CollectionHero() {
  const [activeSlide, setActiveSlide] = useState(0);
  const slideCount = carouselSlides.length;

  useEffect(() => {
    if (slideCount <= 1) return undefined;

    const interval = setInterval(() => {
      setActiveSlide((current) => (current + 1) % slideCount);
    }, AUTO_ADVANCE_MS);

    return () => clearInterval(interval);
  }, [slideCount]);

  return (
    <section
      className="about-hero-carousel"
      aria-roledescription="carousel"
      aria-label="LyZov collection banner"
    >
      <div className="about-hero-image-wrap">
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
              <div
                className="about-hero-backdrop"
                style={{ backgroundImage: `url(${slide.image})` }}
                aria-hidden="true"
              />
              <img
                src={slide.image}
                alt={slide.title}
                loading="eager"
                decoding="async"
                fetchPriority={index === 0 ? "high" : "auto"}
                className="about-hero-image"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CollectionHero;
