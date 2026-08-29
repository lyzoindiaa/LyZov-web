import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Star, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import Hero from "../components/layout/Hero";
import ProductGrid from "../components/product/ProductGrid";
import { productService } from "../services/productService";

const categoryCards = [
  {
    title: "God Idols & Murtis",
    desc: "Hanuman Ji, Krishna Ji Makhan, Car Dashboard Statues",
    image: "https://images.unsplash.com/photo-1567591974584-f1832dfaad58?w=600&auto=format&fit=crop&q=70",
    href: "/shop?category=spiritual",
  },
  {
    title: "Gym & Workout Gear",
    desc: "Rubber Hex Dumbbells, Barbells, Adjustable Benches",
    image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop&q=70",
    href: "/shop?category=equipment",
  },
  {
    title: "Resistance & Training",
    desc: "Pull-up Resistance Bands, Foam Rollers, Grips",
    image: "https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600&auto=format&fit=crop&q=70",
    href: "/shop?category=equipment",
  },
  {
    title: "Lifestyle & Decor",
    desc: "Car Accessories, Spiritual Mandir Decor & Gifting",
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=70",
    href: "/shop?category=accessories",
  },
];

const testimonials = [
  {
    quote: "The Bal Hanuman idol for my car dashboard is stunning. Beautiful paint finish and packed with great care.",
    name: "Siddharth P.",
    role: "Verified Buyer",
  },
  {
    quote: "Top quality 10kg rubber hex dumbbells. Solid knurling grip and zero rubber odor. Perfect for home workouts.",
    name: "Vikram R.",
    role: "Fitness Enthusiast",
  },
  {
    quote: "LyZov Store delivers fast across India and customer support was very helpful with tracking.",
    name: "Pooja S.",
    role: "Verified Buyer",
  },
];

const faqs = [
  {
    q: "What products are available on LyZov Store?",
    a: "LyZov Store offers a diverse collection including heavy-duty gym equipment, handcrafted spiritual God idols (Hanuman Ji, Krishna Ji, Ganesha), and lifestyle accessories.",
  },
  {
    q: "How are fragile items like God Idols packaged?",
    a: "All delicate idols and statues are packaged with multi-layered shockproof bubble wrap and protective cushioning to guarantee damage-free delivery.",
  },
  {
    q: "How fast is shipping across India?",
    a: "Orders are dispatched within 24-48 hours. Metro cities receive delivery in 2-4 business days, and other locations in 4-6 business days with tracking.",
  },
  {
    q: "What is your return or replacement policy?",
    a: "We offer a 7-day hassle-free direct replacement if any product arrives damaged or incomplete.",
  },
];

const SectionHeading = ({ eyebrow, title, ctaLabel, ctaTo }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
        {title}
      </h2>
    </div>
    {ctaLabel && (
      <Link
        to={ctaTo}
        className="group flex items-center gap-1.5 text-xs font-semibold text-gray-900 hover:text-amber-700 transition-colors"
      >
        {ctaLabel}
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
      </Link>
    )}
  </div>
);

const LandingPage = () => {
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(0);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [featuredRes, trendingRes] = await Promise.all([
          productService.getCollection("featured", 8).catch(() => ({ data: [] })),
          productService.getCollection("trending", 8).catch(() => ({ data: [] })),
        ]);
        setFeatured(featuredRes?.data || []);
        setTrending(trendingRes?.data || []);
      } catch (err) {
        // fallback
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success("Welcome to LyZov Store Club!");
    setEmail("");
  };

  return (
    <div>
      <Hero />

      {/* Featured Products */}
      <section className="container-page py-14 lg:py-20">
        <SectionHeading eyebrow="Curated Picks" title="Featured Products" ctaLabel="View All Products" ctaTo="/shop" />
        <ProductGrid products={featured} isLoading={isLoading} emptyMessage="Products loading..." />
      </section>

      {/* Shop by Category */}
      <section className="container-page pb-14 lg:pb-20">
        <SectionHeading eyebrow="Explore Catalog" title="Shop by Category" ctaLabel="Explore All" ctaTo="/shop" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categoryCards.map((cat) => (
            <Link
              key={cat.title}
              to={cat.href}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-gray-100 shadow-soft"
            >
              <img
                src={cat.image}
                alt={cat.title}
                className="h-full w-full object-cover transition-transform duration-700 ease-premium group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <h3 className="text-lg font-bold group-hover:text-amber-300 transition-colors">
                  {cat.title}
                </h3>
                <p className="text-xs text-gray-200 mt-1 line-clamp-2">{cat.desc}</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300 mt-2">
                  Shop Now <ChevronRight size={13} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Bestsellers Strip */}
      <section className="bg-gray-50 border-y border-gray-100 py-14 lg:py-20">
        <div className="container-page">
          <SectionHeading eyebrow="Top Demand" title="Bestsellers This Week" ctaLabel="Shop Bestsellers" ctaTo="/shop?sort=bestseller" />
          <ProductGrid products={trending.length > 0 ? trending : featured} isLoading={isLoading} emptyMessage="Bestsellers loading..." />
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="container-page py-14 lg:py-20">
        <SectionHeading eyebrow="Verified Buyers" title="What Shoppers Say" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {testimonials.map((t, i) => (
            <div key={i} className="card-surface p-6 flex flex-col justify-between gap-4">
              <div>
                <div className="flex gap-1 text-amber-500 mb-2.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} size={15} fill="currentColor" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-gray-600">"{t.quote}"</p>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-bold text-gray-900">{t.name}</p>
                <p className="text-[11px] text-gray-500">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-gray-100 bg-gray-50 py-14 lg:py-20">
        <div className="container-page grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div>
            <span className="eyebrow">Customer Care</span>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-gray-500 mt-2">
              Have questions about shipping, packaging, or orders?
            </p>
          </div>
          <div className="lg:col-span-2 space-y-3">
            {faqs.map((item, i) => (
              <div
                key={item.q}
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                className="rounded-2xl border border-gray-200 bg-white p-5 cursor-pointer hover:border-gray-300 transition-colors shadow-soft"
              >
                <div className="flex items-center justify-between text-sm font-semibold text-gray-900">
                  <span>{item.q}</span>
                  <span className="text-amber-600 font-bold text-base">{openFaq === i ? "âˆ’" : "+"}</span>
                </div>
                {openFaq === i && (
                  <p className="text-xs text-gray-600 mt-3 leading-relaxed border-t border-gray-100 pt-3">
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="border-t border-gray-100 bg-white py-14 lg:py-20">
        <div className="container-page flex flex-col items-center gap-4 text-center">
          <span className="badge badge-accent">LyZov Club</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Get 10% Off Your First Order
          </h2>
          <p className="max-w-md text-xs sm:text-sm text-gray-500">
            Subscribe for exclusive offers, new product launches, and special festival drops.
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex w-full max-w-md gap-2 pt-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="input-field"
            />
            <button type="submit" className="btn-primary shrink-0">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;