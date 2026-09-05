import { Link } from "react-router-dom";
import { Instagram, Twitter, Linkedin, Youtube, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import Logo from "../ui/Logo";

const footerColumns = [
  {
    title: "Categories",
    links: [
      { label: "Gym & Workout Gear", to: "/shop?category=equipment" },
      { label: "God Idols & Murtis", to: "/shop?category=spiritual" },
      { label: "Accessories & Decor", to: "/shop?category=accessories" },
      { label: "All Products", to: "/shop" },
    ],
  },
  {
    title: "Help & Support",
    links: [
      { label: "Track Your Order", to: "/dashboard/orders" },
      { label: "Shipping Policy", to: "/shipping" },
      { label: "7-Day Replacement", to: "/returns" },
      { label: "Contact & Concierge", to: "/contact" },
    ],
  },
  {
    title: "My Account",
    links: [
      { label: "My Orders", to: "/dashboard/orders" },
      { label: "Wishlist", to: "/dashboard/wishlist" },
      { label: "Saved Addresses", to: "/dashboard/addresses" },
      { label: "Sign In", to: "/login" },
    ],
  },
];


const Footer = () => {
  return (
    <footer style={{ borderTop: "2px solid var(--accent)", backgroundColor: "var(--bg-subtle)", position: "relative" }}>
      {/* ── Value Props Banner ── */}
      <div style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
        <div className="container-page py-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  borderRadius: "9999px",
                  backgroundColor: "var(--accent-bg)",
                  color: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Truck size={18} />
              </div>
              <div>
                <h5 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--ink)" }}>Fast Pan-India Delivery</h5>
                <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>Secure, insured shipping on every order</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  borderRadius: "9999px",
                  backgroundColor: "var(--green-bg)",
                  color: "var(--green)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <ShieldCheck size={18} />
              </div>
              <div>
                <h5 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--ink)" }}>Quality You Can Trust</h5>
                <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>Handpicked products, inspected before dispatch</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  borderRadius: "9999px",
                  backgroundColor: "var(--blue-bg)",
                  color: "var(--blue)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <RotateCcw size={18} />
              </div>
              <div>
                <h5 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--ink)" }}>7-Day Easy Replacement</h5>
                <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>Simple returns if something&apos;s not right</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Links ── */}
      <div className="container-page" style={{ paddingTop: "3.5rem", paddingBottom: "3rem" }}>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="sm:col-span-2" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Logo size="lg" variant="elevated" />
            <p style={{ maxWidth: "24rem", fontSize: "0.875rem", color: "var(--ink-muted)", lineHeight: 1.7 }}>
              LyZov is your trusted online store for premium fitness gear, handcrafted spiritual idols, and everyday lifestyle essentials — carefully selected, quality-checked, and delivered safely across India.
            </p>
            <div style={{ display: "flex", gap: "0.625rem", paddingTop: "0.5rem" }}>
              {[
                { Icon: Instagram, url: "https://instagram.com/lyzov_store", label: "Instagram" },
                { Icon: Twitter, url: "https://twitter.com/lyzov_store", label: "Twitter" },
                { Icon: Linkedin, url: "https://linkedin.com/company/lyzov-store", label: "LinkedIn" },
                { Icon: Youtube, url: "https://youtube.com/@lyzov_store", label: "YouTube" },
              ].map(({ Icon, url, label }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon"
                  aria-label={label}
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--ink)",
                  marginBottom: "1.25rem",
                }}
              >
                {col.title}
              </h4>
              <ul style={{ display: "flex", flexDirection: "column", gap: "0.75rem", listStyle: "none", padding: 0, margin: 0 }}>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="footer-link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--bg)", padding: "1.25rem 0" }}>
        <div
          className="container-page"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            fontSize: "0.75rem",
            color: "var(--ink-subtle)",
          }}
        >
          <p>© {new Date().getFullYear()} LyZov Store. All rights reserved.</p>
          <div style={{ display: "flex", gap: "1.25rem" }}>
            <Link to="/shipping" className="nav-link" style={{ fontSize: "0.75rem" }}>Privacy Policy</Link>
            <Link to="/returns" className="nav-link" style={{ fontSize: "0.75rem" }}>Terms of Service</Link>
            <Link to="/#faq" className="nav-link" style={{ fontSize: "0.75rem" }}>Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;