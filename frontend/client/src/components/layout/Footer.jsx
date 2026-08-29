import { Link } from "react-router-dom";
import { Instagram, Twitter, Linkedin, Youtube } from "lucide-react";

const footerColumns = [
  {
    title: "Categories",
    links: [
      { label: "Gym & Workout Gear", to: "/shop?category=equipment" },
      { label: "God Idols & Murtis", to: "/shop?category=spiritual" },
      { label: "Accessories & Decor", to: "/shop?category=accessories" },
      { label: "All Products Catalog", to: "/shop" },
    ],
  },
  {
    title: "Customer Help",
    links: [
      { label: "Track Your Order", to: "/dashboard/orders" },
      { label: "Shipping Policy", to: "/shipping" },
      { label: "7-Day Replacement", to: "/returns" },
      { label: "FAQ & Contact", to: "/#faq" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "My Orders", to: "/dashboard/orders" },
      { label: "Wishlist", to: "/dashboard/wishlist" },
      { label: "Saved Addresses", to: "/dashboard/addresses" },
      { label: "Login / Register", to: "/login" },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="border-t border-border bg-surface text-stone">
      <div className="container-page grid grid-cols-1 gap-8 py-12 sm:grid-cols-2 lg:grid-cols-5 lg:py-16">
        
        <div className="col-span-1 sm:col-span-2 flex flex-col gap-3">
          <Link to="/" className="flex items-center gap-1.5">
            <span className="text-xl font-black text-white">
              Ly<span className="text-accent">Zov</span>
            </span>
            <span className="text-[10px] font-bold text-stone uppercase">Store</span>
          </Link>
          <p className="max-w-sm text-xs text-stone leading-relaxed">
            Your destination for workout equipment, sacred handcrafted God idols, and curated lifestyle accessories.
          </p>
          <div className="flex items-center gap-2 pt-2">
            {[Instagram, Twitter, Linkedin, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="btn-icon hover:text-accent hover:border-accent"
                aria-label="Social Link"
              >
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>

        {footerColumns.map((col) => (
          <div key={col.title}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">{col.title}</h4>
            <ul className="flex flex-col gap-2">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-xs text-stone hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border bg-primary py-5">
        <div className="container-page flex flex-col items-center justify-between gap-2 text-[11px] text-stone sm:flex-row">
          <p>&copy; {new Date().getFullYear()} LyZov Store. All rights reserved.</p>
          <p>Curated with quality. Delivered with speed.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;