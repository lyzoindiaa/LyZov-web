import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Truck, RotateCcw, Award, Sparkles } from "lucide-react";

import gymImg from "../../assets/hero-gym.svg";
import spiritualImg from "../../assets/hero-spiritual.svg";
import decorImg from "../../assets/hero-decor.svg";


// Trust items for the hero trust strip
// Each item has an icon, title, and subtitle describing the guarantee
// These are displayed in rounded cards (border-radius: 1rem)
const trustItems = [
  { icon: Truck, title: "Free Shipping", sub: "On orders above ₹999" },
  { icon: ShieldCheck, title: "Quality Guaranteed", sub: "Every item hand-inspected" },
  { icon: RotateCcw, title: "Easy Returns", sub: "7-day replacement support" },
  { icon: Award, title: "Best Value", sub: "Direct pricing, no markups" },
];

// Statistics displayed in the hero section
// Each stat card has rounded corners (border-radius: 1rem)
const stats = [
  { value: "500+", label: "Curated Products" },
  { value: "4.8★", label: "Customer Rating" },
  { value: "10k+", label: "Happy Shoppers" },
];

// Category cards configuration for hero showcase
// Each card has rounded corners (border-radius: 1.35rem) and links to specific product categories
// Cards include: Gym Equipment, God Idols & Murtis, and Puja & Home Decor
const showcaseCards = [
  {
    to: "/shop?sort=popular",
    img: gymImg,
    alt: "Popular and trending products",
    badge: "Trending",
    title: "Popular Collection",
    aspect: "4/5",
    objectPosition: "center center",
  },
  {
    to: "/shop?sort=newest",
    img: spiritualImg,
    alt: "Curated new arrivals",
    badge: "Curated",
    title: "New Arrivals",
    aspect: "4/5",
    objectPosition: "center center",
  },
  {
    to: "/shop?sort=rating",
    img: decorImg,
    alt: "Top customer rated selections",
    badge: "Top Rated",
    title: "Featured Picks",
    aspect: "16/7",
    wide: true,
    objectPosition: "center center",
  },
];

const Hero = () => {
  return (
    <section className="hero-section">
      <div className="hero-bg-glow hero-bg-glow--right" />
      <div className="hero-bg-glow hero-bg-glow--left" />
      <div className="dot-grid-bg hero-dot-grid" />

      {/* <div className="container-page hero-inner">
        <div className="hero-grid"> */}
      {/* Left: Content */}
      {/* <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="hero-badge">
              <Sparkles size={13} /> Welcome to LyZov
            </span>

            <h1 className="hero-title">
              Shop smarter.{" "}
              <span className="text-gold-gradient">Live better.</span>
            </h1>

            <p className="hero-subtitle">
              Discover a wide selection of curated, quality-checked products on LyZov. Enjoy secure online shopping, direct pricing, and safe Pan-India delivery.
            </p>

            <div className="hero-cta-row">
              <Link to="/shop" className="btn btn-primary btn-lg btn-ripple w-full sm:w-auto">
                Start Shopping <ArrowRight size={17} />
              </Link>
              <Link to="/shop?sort=popular" className="btn btn-secondary btn-lg w-full sm:w-auto">
                View Bestsellers
              </Link>
            </div>

            <div className="hero-stats">
              {stats.map(({ value, label }) => (
                <div key={label} className="hero-stat-card">
                  <p className="hero-stat-value">{value}</p>
                  <p className="hero-stat-label">{label}</p>
                </div>
              ))}
            </div>
          </motion.div> */}

      {/* Right: Showcase - Category Cards */}
      {/* This section displays rounded category cards for Gym Equipment, God Idols & Murtis, and Puja & Home Decor */}
      {/* Each card has rounded corners (border-radius: 1.35rem) as defined in ui-extras.css */}
      {/* Cards link to specific product categories and include hover effects */}
      {/* <motion.div
            className="hero-showcase"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
          >
          {showcaseCards.map(({ to, img, alt, badge, title, aspect, wide, objectPosition }) => (
              <Link
                key={title}
                to={to}
                className={`hero-showcase-card group ${wide ? "hero-showcase-card--wide" : ""}`}
                style={{ aspectRatio: aspect }}
              >
                <img
                  src={img}
                  alt={alt}
                  loading="eager"
                  referrerPolicy="no-referrer"
                  className="hero-showcase-img"
                  style={{ objectPosition: objectPosition || "center center" }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div
                  className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-neutral-900/40 to-neutral-950 -z-10"
                  style={{ borderRadius: "inherit" }}
                />
                <div className={`hero-showcase-overlay ${wide ? "hero-showcase-overlay--wide" : ""}`} />
                <div className={`hero-showcase-caption ${wide ? "hero-showcase-caption--wide" : ""}`}>
                  <span className="badge badge-accent">{badge}</span>
                  <p className="hero-showcase-title">{title}</p>
                  {wide && (
                    <span className="hero-showcase-link">
                      Shop Collection <ArrowRight size={14} />
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </motion.div> */}


      {/* </div>
      </div> */}

      {/* Trust strip - displays shipping, quality, returns, and value guarantees */}
      {/* Each trust card has rounded corners (border-radius: 1rem) */}
      {/* <div className="hero-trust-strip">
        <div className="container-page">
          <div className="hero-trust-grid" style={{ justifyContent: "center" }}>
            {trustItems.map(({ icon: Icon, title, sub }) => (
              <div key={title} className="hero-trust-card">
                <div className="hero-trust-icon">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="hero-trust-title">{title}</p>
                  <p className="hero-trust-sub">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div> */}
    </section>
  );
};

export default Hero;
