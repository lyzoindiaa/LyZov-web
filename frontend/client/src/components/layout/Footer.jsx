import { Link } from "react-router-dom";
import { Instagram, Twitter, Linkedin, Youtube } from "lucide-react";

const footerColumns = [
  {
    title: "Categories",
    links: [
      { label: "Gym & Workout Gear", to: "/?category=equipment" },
      { label: "God Idols & Murtis", to: "/?category=spiritual" },
      { label: "Accessories & Decor", to: "/?category=accessories" },
      { label: "All Products", to: "/" },
    ],
  },
  {
    title: "Help & Support",
    links: [
      { label: "Track Your Order", to: "/dashboard/orders" },
      { label: "Shipping Policy", to: "/shipping" },
      { label: "7-Day Replacement", to: "/returns" },
      { label: "Contact & FAQ", to: "/#faq" },
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
    <footer style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--bg-subtle)" }}>
      <div className="container-page" style={{ paddingTop: "3rem", paddingBottom: "3rem" }}>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          
          {/* Brand column */}
          <div className="sm:col-span-2" style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none" }}>
              <div style={{ width: "2rem", height: "2rem", borderRadius: "9999px", backgroundColor: "var(--ink)", color: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "0.875rem" }}>
                L<span style={{ color: "#F59E0B" }}>Z</span>
              </div>
              <span style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--ink)" }}>LyZov Store</span>
            </Link>
            <p style={{ maxWidth: "20rem", fontSize: "0.75rem", color: "var(--ink-muted)", lineHeight: "1.6" }}>
              Your destination for workout equipment, handcrafted God idols, and curated lifestyle accessories. Delivered safely across India.
            </p>
            <div style={{ display: "flex", gap: "0.5rem", paddingTop: "0.25rem" }}>
              {[Instagram, Twitter, Linkedin, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="btn-icon" style={{ border: "1px solid var(--border)", width: "2rem", height: "2rem" }} aria-label="Social">
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink)", marginBottom: "0.75rem" }}>{col.title}</h4>
              <ul style={{ display: "flex", flexDirection: "column", gap: "0.5rem", listStyle: "none", padding: 0, margin: 0 }}>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} style={{ fontSize: "0.75rem", color: "var(--ink-muted)", textDecoration: "none", transition: "color 0.15s" }}
                      onMouseEnter={(e) => e.target.style.color = "var(--ink)"}
                      onMouseLeave={(e) => e.target.style.color = "var(--ink-muted)"}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--bg)", padding: "1rem 0" }}>
        <div className="container-page" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", fontSize: "11px", color: "var(--ink-subtle)" }}>
          <p>&copy; {new Date().getFullYear()} LyZov Store. All rights reserved.</p>
          <p>Pan-India Delivery Â· Quality Guaranteed</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;