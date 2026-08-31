import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Truck, RotateCcw, Award, Sparkles } from "lucide-react";

const trustItems = [
  { icon: Truck, title: "Free Shipping", sub: "On orders above ₹999" },
  { icon: ShieldCheck, title: "Quality Guaranteed", sub: "Every item hand-inspected" },
  { icon: RotateCcw, title: "Easy Returns", sub: "7-day replacement support" },
  { icon: Award, title: "Best Value", sub: "Direct store pricing, no markups" },
];

const stats = [
  { value: "500+", label: "Curated Products" },
  { value: "4.8★", label: "Customer Rating" },
  { value: "10k+", label: "Happy Shoppers" },
];

const showcaseCards = [
  {
    to: "/shop?category=equipment",
    img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=700&auto=format&fit=crop&q=80",
    alt: "Barbells and gym equipment in a fitness studio",
    badge: "Fitness",
    title: "Gym Equipment",
    aspect: "4/5",
    objectPosition: "center 40%",
  },
  {
    to: "/shop?category=spiritual",
    img: "https://images.unsplash.com/photo-1567702014247-1947012845e7?w=700&auto=format&fit=crop&q=80",
    alt: "Handcrafted Lord Ganesha idol statue",
    badge: "Handcrafted",
    title: "God Idols & Murtis",
    aspect: "4/5",
    objectPosition: "center center",
  },
  {
    to: "/shop?category=accessories",
    img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=900&auto=format&fit=crop&q=80",
    alt: "Brass diyas and spiritual home decor for puja",
    badge: "Spiritual",
    title: "Puja & Home Decor",
    aspect: "16/7",
    wide: true,
    objectPosition: "center 55%",
  },
];

const Hero = () => {
  return (
    <section className="hero-section">
      <div className="hero-bg-glow hero-bg-glow--right" />
      <div className="hero-bg-glow hero-bg-glow--left" />
      <div className="dot-grid-bg hero-dot-grid" />

      <div className="container-page hero-inner">
        <div className="hero-grid">
          {/* Left: Content */}
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="hero-badge">
              <Sparkles size={13} /> Welcome to LyZov Store
            </span>

            <h1 className="hero-title">
              Shop smarter.{" "}
              <span className="text-gold-gradient">Live better.</span>
            </h1>

            <p className="hero-subtitle">
              From pro-grade workout gear to sacred handcrafted idols and everyday lifestyle picks —
              LyZov brings you quality you can trust, fair prices, and delivery straight to your door.
            </p>

            <div className="hero-cta-row">
              <Link to="/shop" className="btn btn-primary btn-lg btn-ripple">
                Start Shopping <ArrowRight size={17} />
              </Link>
              <Link to="/shop?sort=popular" className="btn btn-secondary btn-lg">
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
          </motion.div>

          {/* Right: Showcase */}
          <motion.div
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
          </motion.div>
        </div>
      </div>

      {/* Trust strip */}
      <div className="hero-trust-strip">
        <div className="container-page">
          <div className="hero-trust-grid">
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
      </div>
    </section>
  );
};

export default Hero;
