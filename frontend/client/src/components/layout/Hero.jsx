import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Dumbbell, ShieldCheck, Truck, RotateCcw } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-surface via-primary to-primary border-b border-border">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-accent/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="container-page grid grid-cols-1 items-center gap-10 pb-14 pt-10 lg:grid-cols-2 lg:gap-14 lg:pb-20 lg:pt-14 relative">
        
        {/* Left Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-5"
        >
          <div className="inline-flex items-center gap-2">
            <span className="badge badge-accent">
              <Sparkles size={11} /> LyZov Store Official
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            Curated Quality for Your <span className="text-accent">Life & Space.</span>
          </h1>

          <p className="max-w-lg text-sm sm:text-base leading-relaxed text-stone">
            From heavy-duty workout gear to divine handcrafted God idols and everyday essentials â€” discover premium products built for performance, peace, and style.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link to="/shop" className="btn-primary">
              Shop All Products <ArrowRight size={15} />
            </Link>
            <Link to="/shop?sort=bestseller" className="btn-secondary">
              Bestsellers
            </Link>
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
            <div>
              <p className="text-lg font-bold text-white">100%</p>
              <p className="text-[11px] text-stone">Inspected Quality</p>
            </div>
            <div>
              <p className="text-lg font-bold text-accent">5000+</p>
              <p className="text-[11px] text-stone">Orders Delivered</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">Fast</p>
              <p className="text-[11px] text-stone">Pan-India Dispatch</p>
            </div>
          </div>
        </motion.div>

        {/* Right Multi-Category Visual Cards */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="grid grid-cols-2 gap-4"
        >
          {/* Card 1: Gym Gear */}
          <Link
            to="/shop?category=equipment"
            className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-card shadow-card flex flex-col justify-end p-4"
          >
            <img
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=70"
              alt="Gym & Workout Gear"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-premium group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/50 to-transparent" />
            <div className="relative z-10">
              <span className="badge badge-accent text-[9px] mb-1.5 inline-flex items-center gap-1">
                <Dumbbell size={10} /> Fitness Gear
              </span>
              <h3 className="text-base font-bold text-white group-hover:text-accent transition-colors">
                Gym Equipment
              </h3>
              <p className="text-[10px] text-stone mt-0.5">Dumbbells, Benches, Bands</p>
            </div>
          </Link>

          {/* Card 2: God Idols */}
          <Link
            to="/shop?category=spiritual"
            className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-card shadow-card flex flex-col justify-end p-4"
          >
            <img
              src="https://images.unsplash.com/photo-1567591974584-f1832dfaad58?w=600&auto=format&fit=crop&q=70"
              alt="God Idols & Murtis"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-premium group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/50 to-transparent" />
            <div className="relative z-10">
              <span className="badge badge-warning text-[9px] mb-1.5 inline-flex items-center gap-1">
                <Sparkles size={10} /> Sacred
              </span>
              <h3 className="text-base font-bold text-white group-hover:text-accent transition-colors">
                God Idols & Murtis
              </h3>
              <p className="text-[10px] text-stone mt-0.5">Hanuman, Krishna, Ganesha</p>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Trust Strip */}
      <div className="border-t border-border bg-surface py-3.5">
        <div className="container-page grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs font-medium text-stone">
          <div className="flex items-center gap-2">
            <Truck size={16} className="text-accent flex-shrink-0" />
            <span className="text-white">Free Doorstep Shipping</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-accent flex-shrink-0" />
            <span className="text-white">100% Quality Inspected</span>
          </div>
          <div className="flex items-center gap-2">
            <RotateCcw size={16} className="text-accent flex-shrink-0" />
            <span className="text-white">7-Day Replacement</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-accent flex-shrink-0" />
            <span className="text-white">Direct Store Pricing</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;