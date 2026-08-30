import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Truck, RotateCcw, Award, Sparkles } from "lucide-react";

const trustItems = [
  { icon: Truck, title: "Free Shipping", sub: "Orders above ₹999" },
  { icon: ShieldCheck, title: "100% Quality Checked", sub: "Hand-inspected products" },
  { icon: RotateCcw, title: "7-Day Replacement", sub: "Transit damage guarantee" },
  { icon: Award, title: "Direct Store Pricing", sub: "No middlemen markups" },
];

const Hero = () => {
  return (
    <section style={{ position: "relative", overflow: "hidden", backgroundColor: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
      {/* Subtle Dot-grid background */}
      <div className="dot-grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.35, pointerEvents: "none" }} />

      {/* Ambient Floating Orbs */}
      <div
        className="hero-float"
        style={{
          position: "absolute",
          top: "-60px",
          right: "12%",
          width: "360px",
          height: "360px",
          borderRadius: "9999px",
          background: "radial-gradient(circle, rgba(245,158,11,0.14), transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        className="hero-float-delay"
        style={{
          position: "absolute",
          bottom: "10%",
          left: "6%",
          width: "280px",
          height: "280px",
          borderRadius: "9999px",
          background: "radial-gradient(circle, rgba(59,130,246,0.08), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div className="container-page" style={{ paddingTop: "3.5rem", paddingBottom: "3.5rem", position: "relative" }}>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-14">
          {/* Left: Headline & Actions */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            {/* Eyebrow badge */}
            <div>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  backgroundColor: "var(--accent-bg)",
                  color: "var(--accent)",
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  padding: "0.35rem 0.85rem",
                  borderRadius: "9999px",
                  border: "1px solid var(--accent)",
                }}
              >
                <Sparkles size={12} /> Curated Marketplace
              </span>
            </div>

            {/* Main Headline with fixed clean gradient */}
            <h1
              style={{
                fontSize: "clamp(2.25rem, 4.2vw, 3.5rem)",
                fontWeight: 900,
                letterSpacing: "-0.03em",
                lineHeight: 1.12,
                color: "var(--ink)",
              }}
            >
              Everything crafted{" "}
              <span className="text-gold-gradient">
                for your lifestyle
              </span>{" "}
              &amp; space.
            </h1>

            <p style={{ maxWidth: "30rem", fontSize: "1rem", lineHeight: 1.75, color: "var(--ink-muted)" }}>
              Discover precision workout equipment, sacred handcrafted God idols, and everyday lifestyle essentials — curated with care and delivered safely to your door.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1rem", paddingTop: "0.25rem" }}>
              <Link to="/shop" className="btn btn-primary btn-lg btn-ripple">
                Explore All Products <ArrowRight size={16} />
              </Link>
              <Link to="/shop?sort=popular" className="btn btn-secondary btn-lg">
                Bestsellers
              </Link>
            </div>

            {/* Stat Counter Strip */}
            <div
              style={{
                display: "flex",
                gap: "2.5rem",
                flexWrap: "wrap",
                paddingTop: "1.5rem",
                borderTop: "1px solid var(--border)",
                marginTop: "0.5rem",
              }}
            >
              {[
                ["500+", "Active Products"],
                ["4.8★", "Average Rating"],
                ["10k+", "Satisfied Buyers"],
              ].map(([num, lbl]) => (
                <div key={lbl}>
                  <p style={{ fontSize: "1.375rem", fontWeight: 900, color: "var(--ink)", lineHeight: 1, letterSpacing: "-0.02em" }}>
                    {num}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "0.25rem", fontWeight: 500 }}>
                    {lbl}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Showcase Grid with authentic high-res imagery */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
          >
            {/* Card 1: Fitness Gear */}
            <Link
              to="/shop?category=equipment"
              className="group hover-lift"
              style={{
                position: "relative",
                aspectRatio: "4/5",
                overflow: "hidden",
                borderRadius: "1.25rem",
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                display: "block",
                textDecoration: "none",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=700&auto=format&fit=crop&q=80"
                alt="Workout Gear"
                loading="eager"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transition: "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
                className="group-hover:scale-105"
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)" }} />
              <div style={{ position: "absolute", bottom: "1rem", left: "1rem", right: "1rem" }}>
                <span className="badge badge-accent" style={{ fontSize: "9px", marginBottom: "0.4rem", display: "inline-flex" }}>
                  Fitness
                </span>
                <p style={{ fontSize: "1rem", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
                  Workout Gear
                </p>
              </div>
            </Link>

            {/* Card 2: Handcrafted Idols & Spiritual Decor */}
            <Link
              to="/shop?category=spiritual"
              className="group hover-lift"
              style={{
                position: "relative",
                aspectRatio: "4/5",
                overflow: "hidden",
                borderRadius: "1.25rem",
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                display: "block",
                textDecoration: "none",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1608889825205-eebdb9fc5806?w=700&auto=format&fit=crop&q=80"
                alt="God Idols & Decor"
                loading="eager"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transition: "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
                className="group-hover:scale-105"
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)" }} />
              <div style={{ position: "absolute", bottom: "1rem", left: "1rem", right: "1rem" }}>
                <span className="badge badge-accent" style={{ fontSize: "9px", marginBottom: "0.4rem", display: "inline-flex" }}>
                  Handcrafted
                </span>
                <p style={{ fontSize: "1rem", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
                  God Idols &amp; Decor
                </p>
              </div>
            </Link>

            {/* Card 3: Lifestyle Essentials / Accessories (Full width banner) */}
            <Link
              to="/shop"
              className="group hover-lift"
              style={{
                position: "relative",
                gridColumn: "1 / -1",
                aspectRatio: "16/7",
                overflow: "hidden",
                borderRadius: "1.25rem",
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                display: "block",
                textDecoration: "none",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900&auto=format&fit=crop&q=80"
                alt="Lifestyle Essentials"
                loading="eager"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transition: "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
                className="group-hover:scale-105"
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 65%, transparent 100%)" }} />
              <div style={{ position: "absolute", top: "50%", left: "1.5rem", transform: "translateY(-50%)" }}>
                <span className="badge badge-dark" style={{ fontSize: "10px", marginBottom: "0.5rem", display: "inline-flex" }}>
                  Curated
                </span>
                <p style={{ fontSize: "1.25rem", fontWeight: 800, color: "#FFFFFF", lineHeight: 1.2 }}>
                  Lifestyle Essentials
                </p>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", marginTop: "0.5rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-light)" }}>
                  Shop Collection <ArrowRight size={13} />
                </span>
              </div>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Trust Strip */}
      <div style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--bg-subtle)", padding: "1.5rem 0" }}>
        <div className="container-page">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {trustItems.map(({ icon: Icon, title, sub }) => (
              <div
                key={title}
                className="glass-card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.875rem",
                  padding: "0.875rem 1.125rem",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "0.75rem",
                    backgroundColor: "var(--accent-bg)",
                    color: "var(--accent)",
                  }}
                >
                  <Icon size={18} />
                </div>
                <div>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--ink)" }}>{title}</p>
                  <p style={{ fontSize: "0.6875rem", color: "var(--ink-muted)", marginTop: "0.15rem" }}>{sub}</p>
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
