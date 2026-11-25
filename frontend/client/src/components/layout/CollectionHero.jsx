import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import heroBannerOne from "../../assets/hero-crousal-1.jpeg";
import heroBannerTwo from "../../assets/hero-crousal-2.png";
import heroBannerThree from "../../assets/Hero.png";

const AUTO_ADVANCE_MS = 5000;

const carouselSlides = [
  {
    id: "toys-idols-electronics",
    title: "Everything You Love, Now on LyZov — Kids Toys, Idols & Gifts, Electronics",
    image: heroBannerOne,
    to: "/shop",
    objectPosition: "center center",
  },
  {
    id: "kitchen-home-appliances",
    title: "Everything You Love, Now on LyZov — Kitchen, Home, Cooling & Small Appliances",
    image: heroBannerTwo,
    to: "/shop",
    objectPosition: "center center",
  },
  {
    id: "everyday-essentials",
    title: "Everything You Love, Now on LyZov — Furniture, Fashion, Electronics, Grocery, Beauty & Fitness",
    image: heroBannerThree,
    to: "/shop",
    objectPosition: "center center",
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
                style={{ objectPosition: slide.objectPosition }}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CollectionHero;
