import { ShieldCheck, Truck, Heart, Sparkles } from "lucide-react";

const reasons = [
  {
    icon: ShieldCheck,
    title: "Curated for Quality",
    description: "Every product is handpicked and quality-checked before it reaches you.",
  },
  {
    icon: Truck,
    title: "Delivered Across India",
    description: "Fast, secure shipping with real-time order tracking from checkout to doorstep.",
  },
  {
    icon: Heart,
    title: "Built Around You",
    description: "Wishlists, order history, and personalized support — shopping made simple.",
  },
  {
    icon: Sparkles,
    title: "Premium, Fair Pricing",
    description: "Direct, transparent pricing on curated, quality-checked products.",
  },
];

const WhyLyZov = () => (
  <section style={{ backgroundColor: "var(--bg-subtle)", borderBottom: "1px solid var(--border)" }}>
    <div className="container-page" style={{ paddingTop: "3rem", paddingBottom: "3rem" }}>
      <div style={{ textAlign: "center", maxWidth: "36rem", margin: "0 auto 2.5rem" }}>
        <span className="eyebrow">Why LyZov?</span>
        <h2
          style={{
            fontSize: "clamp(1.375rem, 2.5vw, 1.875rem)",
            fontWeight: 800,
            color: "var(--ink)",
            letterSpacing: "-0.025em",
            marginTop: "0.5rem",
          }}
        >
          A modern shopping experience you can trust
        </h2>
        <p style={{ fontSize: "0.9375rem", color: "var(--ink-muted)", lineHeight: 1.7, marginTop: "0.75rem" }}>
          Discover a wide selection of curated, quality-checked products on LyZov. Enjoy secure online shopping, direct pricing, and safe Pan-India delivery.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {reasons.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="glass-card"
            style={{
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div
              style={{
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "0.75rem",
                backgroundColor: "var(--accent-bg)",
                color: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon size={18} />
            </div>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--ink)" }}>{title}</h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--ink-muted)", lineHeight: 1.65 }}>{description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default WhyLyZov;
