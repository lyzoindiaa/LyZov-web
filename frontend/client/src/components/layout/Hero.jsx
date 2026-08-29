import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Truck, RotateCcw, Award } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
      <div className="container-page grid grid-cols-1 items-center gap-12 py-12 lg:grid-cols-2 lg:gap-16 lg:py-20">
        
        {/* Left Headline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-6"
        >
          <span className="eyebrow">Curated Marketplace</span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-[1.1]">
            Everything crafted for your <span className="text-amber-600">lifestyle & space.</span>
          </h1>

          <p className="max-w-md text-base leading-relaxed text-gray-600">
            Discover precision workout equipment, sacred handcrafted God idols, and everyday lifestyle essentials â€” curated with care and delivered safely to your door.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link to="/shop" className="btn-primary">
              Explore All Products <ArrowRight size={16} />
            </Link>
            <Link to="/shop?sort=bestseller" className="btn-secondary">
              Bestsellers
            </Link>
          </div>
        </motion.div>

        {/* Right Product Grid Showcase */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="grid grid-cols-2 gap-4"
        >
          {/* Card 1: Gym Equipment */}
          <Link
            to="/shop?category=equipment"
            className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-gray-100 shadow-soft"
          >
            <img
              src="https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop&q=70"
              alt="Gym & Workout Equipment"
              className="h-full w-full object-cover transition-transform duration-700 ease-premium group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="badge badge-accent text-[9px] mb-1">Fitness</span>
              <p className="text-sm font-bold">Workout Gear</p>
            </div>
          </Link>

          {/* Card 2: God Idols */}
          <Link
            to="/shop?category=spiritual"
            className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-gray-100 shadow-soft"
          >
            <img
              src="https://images.unsplash.com/photo-1567591974584-f1832dfaad58?w=600&auto=format&fit=crop&q=70"
              alt="God Idols & Murtis"
              className="h-full w-full object-cover transition-transform duration-700 ease-premium group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="badge badge-accent text-[9px] mb-1">Handcrafted</span>
              <p className="text-sm font-bold">God Idols & Decor</p>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Trust Strip */}
      <div className="border-t border-gray-100 bg-white py-6">
        <div className="container-page grid grid-cols-2 gap-6 sm:grid-cols-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
              <Truck size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Free Shipping</p>
              <p className="text-[11px] text-gray-500">Orders above â‚¹999</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">100% Quality Checked</p>
              <p className="text-[11px] text-gray-500">Hand-inspected products</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
              <RotateCcw size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">7-Day Replacement</p>
              <p className="text-[11px] text-gray-500">Transit damage guarantee</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
              <Award size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Direct Store Pricing</p>
              <p className="text-[11px] text-gray-500">No middlemen markups</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;