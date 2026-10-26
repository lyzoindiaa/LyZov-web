import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Youtube, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import Logo from "../ui/Logo";

const footerColumns = [
  {
    title: "Explore",
    links: [
      { label: "All Products", to: "/shop" },
      { label: "Featured Collection", to: "/shop?sort=popular" },
      { label: "New Arrivals", to: "/shop?sort=newest" },
      { label: "Top Rated", to: "/shop?sort=rating" },
    ],
  },
  {
    title: "Help & Support",
    links: [
      { label: "Track Your Order", to: "/dashboard/orders" },
      { label: "Shipping Policy", to: "/shipping-delivery-policy" },
      { label: "7-Day Replacement", to: "/return-exchange-policy" },
      { label: "Contact & Concierge", to: "/contact" },
    ],
  },
  {
    title: "Policies & Legal",
    links: [
      { label: "Privacy Policy", to: "/privacy-policy" },
      { label: "Terms & Conditions", to: "/terms-and-conditions" },
      { label: "Return & Exchange", to: "/return-exchange-policy" },
      { label: "Refund & Cancellation", to: "/refund-cancellation-policy" },
      { label: "Shipping & Delivery", to: "/shipping-delivery-policy" },
    ],
  },
  {
    title: "My Account",
    links: [
      { label: "My Orders", to: "/dashboard/orders" },
      { label: "Wishlist", to: "/dashboard/wishlist" },
      { label: "Saved Addresses", to: "/dashboard/addresses" },
      { label: "Sell on LyZov", to: "/seller/register" },
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
            <Link to="/shipping-delivery-policy" className="flex items-center gap-3 group text-left hover:opacity-90 transition-opacity">
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
            </Link>

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

            <Link to="/return-exchange-policy" className="flex items-center gap-3 group text-left hover:opacity-90 transition-opacity">
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
            </Link>
          </div>
        </div>
      </div>

      {/* ── Main Links ── */}
      <div className="container-page" style={{ paddingTop: "3.5rem", paddingBottom: "3rem" }}>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-6 lg:gap-10">
          {/* Brand column */}
          <div className="sm:col-span-2 md:col-span-2 lg:col-span-2" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ maxWidth: "24rem", fontSize: "0.875rem", color: "var(--ink-muted)", lineHeight: 1.7 }}>
              Discover a wide selection of curated, quality-checked products on LyZov. Enjoy secure online shopping, direct pricing, and safe Pan-India delivery.
            </p>
            <div style={{ display: "flex", gap: "0.625rem", paddingTop: "0.5rem" }}>
              {[
                { Icon: Facebook, url: "https://www.facebook.com/LyZov/", label: "Facebook" },
                { Icon: Instagram, url: "https://www.instagram.com/lyzovindia/", label: "Instagram" },
                { Icon: Youtube, url: "https://www.youtube.com/@lyzovindia", label: "YouTube" },
                { Icon: Twitter, url: "https://x.com/LyZovIndia", label: "X" },
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
          <p>© {new Date().getFullYear()} LyZov. All rights reserved.</p>
          <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
            <Link to="/privacy-policy" className="nav-link" style={{ fontSize: "0.75rem" }}>Privacy Policy</Link>
            <Link to="/terms-and-conditions" className="nav-link" style={{ fontSize: "0.75rem" }}>Terms & Conditions</Link>
            <Link to="/return-exchange-policy" className="nav-link" style={{ fontSize: "0.75rem" }}>Return & Exchange</Link>
            <Link to="/refund-cancellation-policy" className="nav-link" style={{ fontSize: "0.75rem" }}>Refunds</Link>
            <Link to="/shipping-delivery-policy" className="nav-link" style={{ fontSize: "0.75rem" }}>Shipping</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;