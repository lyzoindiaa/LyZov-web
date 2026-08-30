import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Truck, RotateCcw, Award, Sparkles } from "lucide-react";

const trustItems = [
  { icon: Truck,        title: "Free Shipping",        sub: "Orders above ₹999" },
  { icon: ShieldCheck,  title: "100% Quality Checked",  sub: "Hand-inspected products" },
  { icon: RotateCcw,    title: "7-Day Replacement",     sub: "Transit damage guarantee" },
  { icon: Award,        title: "Direct Store Pricing",  sub: "No middlemen markups" },
];

const Hero = () => {
  return (
    <section style={{ position: "relative", overflow: "hidden", backgroundColor: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
      {/* Dot-grid background */}
      <div className="dot-grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.5, pointerEvents: "none" }} />

      {/* Floating orbs */}
      <div className="hero-float" style={{ position: "absolute", top: "-80px", right: "10%", width: "340px", height: "340px", borderRadius: "9999px", background: "radial-gradient(circle, rgba(245,158,11,0.12), transparent 70%)", pointerEvents: "none" }} />
      <div className="hero-float-delay" style={{ position: "absolute", bottom: "0", left: "5%", width: "240px", height: "240px", borderRadius: "9999px", background: "radial-gradient(circle, rgba(59,130,246,0.08), transparent 70%)", pointerEvents: "none" }} />

      <div className="container-page" style={{ paddingTop: "3rem", paddingBottom: "3rem", position: "relative" }}>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">

          {/* Left: Headline */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {/* Eyebrow badge */}
            <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", backgroundColor: "var(--accent-bg)", color: "var(--accent)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", padding: "0.3rem 0.75rem", borderRadius: "9999px", border: "1px solid var(--accent)" }}>
                <Sparkles size={12} /> Curated Marketplace
              </span>
            </motion.div>

            {/* Headline */}
            <h1 style={{ fontSize: "clamp(2rem,4.5vw,3.5rem)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.08, color: "var(--ink)" }}>
              Everything crafted{" "}
              <span style={{ background: "linear-gradient(120deg,#D97706,#F59E0B,#FBBF24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                for your lifestyle
              </span>{" "}
              &amp; space.
            </h1>

            <p style={{ maxWidth: "28rem", fontSize: "1rem", lineHeight: 1.75, color: "var(--ink-muted)" }}>
              Discover precision workout equipment, sacred handcrafted God idols, and everyday lifestyle essentials — curated with care and delivered safely to your door.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.875rem" }}>
              <Link to="/" className="btn-primary btn-ripple" style={{ padding: "0.875rem 1.75rem", fontSize: "0.9rem" }}>
                Explore All Products <ArrowRight size={16} />
              </Link>
              <Link to="/?sort=popular" className="btn-secondary" style={{ padding: "0.875rem 1.75rem", fontSize: "0.9rem" }}>
                Bestsellers
              </Link>
            </div>

            {/* Stat pills */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55, duration: 0.5 }} style={{ display: "flex", gap: "1.75rem", flexWrap: "wrap", paddingTop: "0.5rem", borderTop: "1px solid var(--border)" }}>
              {[["500+", "Products"], ["4.8★", "Avg Rating"], ["10k+", "Happy Buyers"]].map(([num, lbl]) => (
                <div key={lbl}>
                  <p style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>{num}</p>
                  <p style={{ fontSize: "0.7rem", color: "var(--ink-muted)", marginTop: "0.2rem", fontWeight: 500 }}>{lbl}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Showcase grid */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.18 }} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>

            {/* Card 1 */}
            <Link to="/?category=equipment" className="group" style={{ position: "relative", aspectRatio: "4/5", overflow: "hidden", borderRadius: "1.25rem", backgroundColor: "var(--bg-raised)", display: "block", textDecoration: "none" }}>
              <img src="https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop&q=70" alt="Gym Equipment" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.7s ease" }} className="group-hover:scale-105" />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.72) 0%,transparent 55%)" }} />
              <div style={{ position: "absolute", bottom: "0.875rem", left: "0.875rem", right: "0.875rem" }}>
                <span className="badge badge-accent" style={{ fontSize: "9px", marginBottom: "0.375rem", display: "inline-flex" }}>Fitness</span>
                <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#fff" }}>Workout Gear</p>
              </div>
            </Link>

            {/* Card 2 */}
            <Link to="/?category=spiritual" className="group" style={{ position: "relative", aspectRatio: "4/5", overflow: "hidden", borderRadius: "1.25rem", backgroundColor: "var(--bg-raised)", display: "block", textDecoration: "none" }}>
              <img src="https://images.unsplash.com/photo-1567591974584-f1832dfaad58?w=600&auto=format&fit=crop&q=70" alt="God Idols" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.7s ease" }} className="group-hover:scale-105" />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.72) 0%,transparent 55%)" }} />
              <div style={{ position: "absolute", bottom: "0.875rem", left: "0.875rem", right: "0.875rem" }}>
                <span className="badge badge-accent" style={{ fontSize: "9px", marginBottom: "0.375rem", display: "inline-flex" }}>Handcrafted</span>
                <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#fff" }}>God Idols &amp; Decor</p>
              </div>
            </Link>

            {/* Card 3 — full-width banner */}
            <Link to="/" className="group" style={{ position: "relative", gridColumn: "1 / -1", aspectRatio: "16/7", overflow: "hidden", borderRadius: "1.25rem", backgroundColor: "var(--bg-raised)", display: "block", textDecoration: "none" }}>
              <img src="https://images.unsplash.com/photo-1556742521-9713bf272865?w=900&auto=format&fit=crop&q=70" alt="Lifestyle Essentials" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.7s ease" }} className="group-hover:scale-105" />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right,rgba(0,0,0,0.65) 0%,transparent 60%)" }} />
              <div style={{ position: "absolute", top: "50%", left: "1.25rem", transform: "translateY(-50%)" }}>
                <span className="badge badge-dark" style={{ fontSize: "9px", marginBottom: "0.5rem", display: "inline-flex" }}>Trending</span>
                <p style={{ fontSize: "1.125rem", fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>Lifestyle<br/>Essentials</p>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", marginTop: "0.5rem", fontSize: "0.7rem", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
                  Shop Now <ArrowRight size={11} />
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
              <div key={title} className="glass-card" style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.875rem 1rem", transition: "transform 0.2s,box-shadow 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}>
                <div style={{ width: "2.25rem", height: "2.25rem", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.625rem", backgroundColor: "var(--accent-bg)", color: "var(--accent)" }}>
                  <Icon size={17} />
                </div>
                <div>
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--ink)" }}>{title}</p>
                  <p style={{ fontSize: "0.675rem", color: "var(--ink-muted)", marginTop: "0.15rem" }}>{sub}</p>
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
