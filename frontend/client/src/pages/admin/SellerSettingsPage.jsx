import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  Palmtree,
  Sun,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Store,
  Clock,
  Sparkles,
  Info,
  Calendar,
} from "lucide-react";
import { userService } from "../../services/cartService";
import { setUser } from "../../features/auth/authSlice";
import Button from "../../components/ui/Button";

const SellerSettingsPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const sp = user?.sellerProfile || {};
  const [isVacationMode, setIsVacationMode] = useState(Boolean(sp.isVacationMode));
  const [vacationMessage, setVacationMessage] = useState(
    sp.vacationMessage || "Our store is currently taking a short holiday break. We will resume taking orders soon!"
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.sellerProfile) {
      setIsVacationMode(Boolean(user.sellerProfile.isVacationMode));
      if (user.sellerProfile.vacationMessage) {
        setVacationMessage(user.sellerProfile.vacationMessage);
      }
    }
  }, [user]);

  const handleToggleVacation = async (newVal) => {
    setIsVacationMode(newVal);
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    try {
      setIsSaving(true);
      const res = await userService.updateSellerProfile({
        isVacationMode,
        vacationMessage: vacationMessage.trim(),
      });

      if (res.success && res.data?.user) {
        dispatch(setUser(res.data.user));
        toast.success(
          isVacationMode
            ? "Vacation Mode is now ENABLED. Your products are hidden from the marketplace."
            : "Vacation Mode is now DISABLED. Your products are live in the marketplace! ✓"
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update vacation settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Palmtree size={24} className="text-[var(--accent)]" />
          <h1 className="font-display text-2xl lg:text-3xl tracking-tightest">Store Settings & Vacation Mode</h1>
        </div>
        <p className="text-sm text-stone mt-1">
          Manage your seller store operational status. Control vacation mode when taking a break from order fulfillment.
        </p>
      </div>

      {/* Vacation Mode Primary Card */}
      <div className="card-surface p-6 sm:p-8 rounded-2xl border border-hairline dark:border-hairline-dark">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-hairline dark:border-hairline-dark">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                isVacationMode
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {isVacationMode ? <Palmtree size={26} /> : <Sun size={26} />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--ink)]">Store Vacation Mode</h2>
              <p className="text-xs text-stone">
                Temporarily pause orders and hide your products while you are away or on holiday.
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
              isVacationMode
                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300/60 dark:border-amber-500/30"
                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-500/30"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isVacationMode ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
              }`}
            />
            {isVacationMode ? "Vacation Active" : "Store Open (Accepting Orders)"}
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-6 pt-6">
          {/* Toggle Banner */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
              isVacationMode
                ? "bg-amber-50/60 border-amber-300/60 dark:bg-amber-950/20 dark:border-amber-500/30"
                : "bg-[var(--bg-subtle)] border-hairline dark:border-hairline-dark"
            }`}
          >
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">Enable Store Vacation Mode</p>
              <p className="text-xs text-stone mt-0.5">
                {isVacationMode
                  ? "When enabled, your products will NOT be shown in the marketplace shop, collections, or store page."
                  : "Currently disabled. Your products are live, searchable, and purchasable by all customers."}
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={isVacationMode}
                onChange={(e) => handleToggleVacation(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Vacation Announcement Message */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone mb-1.5">
              Vacation Announcement Message (Shown to customers)
            </label>
            <textarea
              rows={3}
              value={vacationMessage}
              onChange={(e) => setVacationMessage(e.target.value)}
              placeholder="e.g. Our workshop is taking a seasonal break! We will resume shipping all orders on [Date]."
              className="w-full rounded-xl border border-hairline bg-[var(--surface)] p-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] dark:border-hairline-dark dark:bg-[var(--bg-raised)]"
            />
            <span className="text-[11px] text-stone mt-1 block">
              This notice will be displayed to any customer attempting to view your store page or product link.
            </span>
          </div>

          {/* Customer Preview Notice */}
          {isVacationMode && (
            <div className="p-4 rounded-xl border border-amber-300/80 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-600/40">
              <div className="flex items-start gap-2.5">
                <Palmtree size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                    Customer Notice Preview:
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 italic">
                    &ldquo;{vacationMessage || "This store is currently on vacation."}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-stone flex items-center gap-1.5">
              <Info size={13} /> Changes apply immediately across the entire marketplace.
            </span>
            <Button type="submit" isLoading={isSaving} className="flex items-center gap-2">
              <Sparkles size={15} />
              <span>Save Vacation Settings</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Governance Notice Regarding Maintenance Mode */}
      <div className="card-surface p-6 rounded-2xl border border-hairline dark:border-hairline-dark bg-[var(--bg-subtle)]">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ink)]">Platform Maintenance Mode Governance</h3>
            <p className="text-xs text-stone mt-1 leading-relaxed">
              Global marketplace maintenance and development banners are governed exclusively by LyZov SuperAdmin.
              As a merchant, you have complete control over your individual store&apos;s vacation mode and product availability.
            </p>
            {/* [SINGLE-SELLER MODE] Public multi-vendor storefront link disabled
            {sp.storeSlug && (
              <a
                href={`/store/${sp.storeSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:underline mt-2"
              >
                <Store size={13} /> View Public Storefront <ExternalLink size={11} />
              </a>
            )}
            */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerSettingsPage;
