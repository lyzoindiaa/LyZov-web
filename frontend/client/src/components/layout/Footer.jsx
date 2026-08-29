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
    title: "Help & Support",
    links: [
      { label: "Track Your Order", to: "/dashboard/orders" },
      { label: "Shipping Policy", to: "/shipping" },
      { label: "7-Day Replacement", to: "/returns" },
      { label: "FAQ & Contact", to: "/#faq" },
    ],
  },
  {
    title: "My Account",
    links: [
      { label: "Orders", to: "/dashboard/orders" },
      { label: "Wishlist", to: "/dashboard/wishlist" },
      { label: "Saved Addresses", to: "/dashboard/addresses" },
      { label: "Sign In", to: "/login" },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="border-t border-gray-100 bg-white text-gray-500">
      <div className="container-page grid grid-cols-1 gap-8 py-12 sm:grid-cols-2 lg:grid-cols-5 lg:py-16">
        
        <div className="col-span-1 sm:col-span-2 flex flex-col gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white font-black text-sm">
              L<span className="text-amber-500">Z</span>
            </div>
            <span className="text-lg font-bold text-gray-900">LyZov Store</span>
          </Link>
          <p className="max-w-sm text-xs text-gray-500 leading-relaxed">
            Your destination for workout equipment, sacred handcrafted God idols, and curated lifestyle accessories.
          </p>
          <div className="flex items-center gap-2 pt-2">
            {[Instagram, Twitter, Linkedin, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="btn-icon border border-gray-200 hover:border-gray-900"
                aria-label="Social Link"
              >
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>

        {footerColumns.map((col) => (
          <div key={col.title}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3">{col.title}</h4>
            <ul className="flex flex-col gap-2">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 bg-gray-50 py-5">
        <div className="container-page flex flex-col items-center justify-between gap-2 text-[11px] text-gray-500 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} LyZov Store. All rights reserved.</p>
          <p>Curated with care. Delivered with speed.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;