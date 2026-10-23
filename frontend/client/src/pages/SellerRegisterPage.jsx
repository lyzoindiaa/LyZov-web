import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Store, ShieldCheck, TrendingUp, Sparkles, ArrowRight, Eye, EyeOff } from "lucide-react";
import { authService } from "../services/authService";
import { setAuthSession } from "../features/auth/authSlice";
import { setAccessToken } from "../services/api";
import { toast } from "react-toastify";
import SEO from "../components/common/SEO";

const SellerRegisterPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    email: "",
    phone: "",
    password: "",
    storeBio: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await authService.registerSeller(formData);
      if (res.success && res.data) {
        toast.success("Seller account created! Please complete your verification profile.");
        if (res.data.accessToken) {
          setAccessToken(res.data.accessToken);
        }
        if (res.data.user) {
          dispatch(setAuthSession(res.data.user));
        }
        navigate(res.data.redirectTo || "/seller/profile");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to register seller account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: "var(--bg)", minHeight: "100vh" }} className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <SEO
        title="Sell on LyZov - Join Our Merchant Marketplace"
        description="Become a verified seller on LyZov. Reach targeted audiences with premium Indian craftsmanship, transparent commission, and rapid payouts."
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link to="/" className="inline-block text-2xl font-black tracking-widest text-amber-500 uppercase">
          LyZov
        </Link>
        <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: "var(--ink)" }}>
          Grow Your Business on LyZov
        </h1>
        <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
          Join India's leading modern menswear and lifestyle destination as a verified merchant.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div
          style={{
            backgroundColor: "var(--surface)",
            borderRadius: "1.25rem",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
            padding: "2rem",
          }}
        >
          {/* Marketplace Highlights */}
          <div className="grid grid-cols-3 gap-2 mb-6 pb-6 border-b border-gray-200 dark:border-gray-800 text-center">
            <div className="p-2">
              <ShieldCheck size={20} className="mx-auto text-amber-500 mb-1" />
              <span className="block text-xs font-bold text-gray-800 dark:text-gray-200">Verified Badge</span>
              <span className="text-[10px] text-gray-400">Authentic trust</span>
            </div>
            <div className="p-2">
              <TrendingUp size={20} className="mx-auto text-amber-500 mb-1" />
              <span className="block text-xs font-bold text-gray-800 dark:text-gray-200">Weekly Payouts</span>
              <span className="text-[10px] text-gray-400">Direct to bank</span>
            </div>
            <div className="p-2">
              <Sparkles size={20} className="mx-auto text-amber-500 mb-1" />
              <span className="block text-xs font-bold text-gray-800 dark:text-gray-200">Zero Upfront Fee</span>
              <span className="text-[10px] text-gray-400">Low commission</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Business / Store Name
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="e.g. Royal Heritage Tailors"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Work Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@company.com"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Password (min 8 characters) *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Store Bio / Specialization
              </label>
              <textarea
                name="storeBio"
                rows={2}
                value={formData.storeBio}
                onChange={handleChange}
                placeholder="Tell us what makes your products and craftsmanship unique..."
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 btn-accent py-3 rounded-lg font-bold flex items-center justify-center gap-2 tracking-wide text-sm shadow-md transition-all hover:opacity-95"
            >
              {isSubmitting ? (
                "Creating Seller Account..."
              ) : (
                <>
                  Register as Merchant Partner <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500 border-t border-gray-200 dark:border-gray-800 pt-4">
            Already have a seller account?{" "}
            <Link to="/login" className="font-bold text-amber-500 hover:underline">
              Log in to Seller Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerRegisterPage;
