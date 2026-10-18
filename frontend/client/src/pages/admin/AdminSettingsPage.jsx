import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Settings, ShieldAlert, Sparkles, RefreshCw, CheckCircle, Eye, Power, MessageSquare } from "lucide-react";
import { settingsService } from "../../services/settingsService";
import Button from "../../components/ui/Button";

const MESSAGE_PRESETS = [
  { label: "Default Development", text: "LyZov is currently in development" },
  { label: "Maintenance Break", text: "Store under maintenance. We'll be back online shortly!" },
  { label: "New Collection Drop", text: "New Collection Dropping Soon! Stay Tuned for updates." },
  { label: "System Upgrade", text: "System upgrade in progress. Order processing will resume in 30 mins." },
];

const AdminSettingsPage = () => {
  const [isDevMode, setIsDevMode] = useState(true);
  const [messageInput, setMessageInput] = useState("LyZov is currently in development");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const res = await settingsService.getSettings();
      if (res?.data) {
        setIsDevMode(res.data.isDevelopmentMode ?? true);
        setMessageInput(res.data.developmentMessage || "LyZov is currently in development");
        setLastUpdated(res.data.updatedAt);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load store settings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (overrideDevMode = isDevMode) => {
    const cleanMsg = messageInput.trim();
    if (!cleanMsg) {
      toast.error("Announcement banner message cannot be empty");
      return;
    }

    try {
      setIsSaving(true);
      const res = await settingsService.updateSettings({
        isDevelopmentMode: overrideDevMode,
        developmentMessage: cleanMsg,
      });

      setIsDevMode(res.data.isDevelopmentMode);
      setMessageInput(res.data.developmentMessage);
      setLastUpdated(res.data.updatedAt);

      toast.success(
        `Settings updated! Storefront Development Mode is now ${res.data.isDevelopmentMode ? "ENABLED (Banner Active)" : "DISABLED (Hidden)"}. ✓`
      );
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = () => {
    const nextState = !isDevMode;
    setIsDevMode(nextState);
    handleSave(nextState);
  };

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-stone">Loading store settings...</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <Settings size={22} className="text-[var(--accent)]" />
          <h1 className="font-display text-2xl font-bold tracking-tight">Store Settings &amp; Maintenance Mode</h1>
        </div>
        <p className="mt-1 text-xs text-stone">
          Control storefront visibility, maintenance status, and public announcement banners.
        </p>
      </div>

      {/* Main Settings Card */}
      <div className="card-surface p-6 flex flex-col gap-6">
        {/* Development Mode Toggle Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-hairline bg-[var(--bg-subtle)] dark:border-hairline-dark">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl ${isDevMode ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"}`}>
              {isDevMode ? <ShieldAlert size={22} /> : <CheckCircle size={22} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--ink)]">Development &amp; Maintenance Mode</h2>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                  isDevMode
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                }`}>
                  {isDevMode ? "Active / Maintenance Banner ON" : "Disabled / Storefront Live"}
                </span>
              </div>
              <p className="mt-1 text-xs text-stone">
                When enabled, an animated announcement banner is displayed at the top of every storefront page informing customers of development mode.
              </p>
            </div>
          </div>

          {/* Toggle Switch Button */}
          <button
            type="button"
            onClick={handleToggle}
            disabled={isSaving}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition-all shadow-sm ${
              isDevMode
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            <Power size={15} />
            {isDevMode ? "Turn Off Maintenance Banner" : "Enable Maintenance Mode"}
          </button>
        </div>

        {/* Banner Message Configuration */}
        <div className="flex flex-col gap-4">
          <label className="text-xs font-bold uppercase tracking-wider text-stone flex items-center gap-1.5">
            <MessageSquare size={15} className="text-[var(--accent)]" /> Announcement Banner Text
          </label>

          <textarea
            rows={3}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="e.g. LyZov is currently under maintenance..."
            className="w-full rounded-xl border border-border bg-[var(--bg-subtle)] p-3.5 text-sm font-medium text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none resize-none"
          />

          {/* Preset Buttons */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone block mb-2">
              Quick Preset Messages
            </span>
            <div className="flex flex-wrap gap-2">
              {MESSAGE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMessageInput(preset.text)}
                  className="rounded-lg border border-border bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-semibold text-stone hover:border-[var(--accent)] hover:text-[var(--ink)] transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Banner Preview */}
        <div className="flex flex-col gap-2 pt-2 border-t border-hairline dark:border-hairline-dark">
          <span className="text-xs font-bold uppercase tracking-wider text-stone flex items-center gap-1.5">
            <Eye size={15} className="text-[var(--accent)]" /> Live Customer Banner Preview
          </span>

          {isDevMode ? (
            <div className="overflow-hidden rounded-xl border border-amber-300 bg-[#C5A059] py-2 px-4 text-white text-xs font-bold tracking-wide uppercase shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="truncate">🚧 {messageInput || "LyZov is currently in development"}</span>
                <span className="shrink-0 text-[10px] opacity-80 uppercase tracking-widest">[Marquee Active]</span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-stone-300 p-4 text-center text-xs text-stone dark:border-stone-700">
              Banner is currently <strong>HIDDEN</strong> because Development Mode is Disabled.
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-stone">
            {lastUpdated ? `Last updated: ${new Date(lastUpdated).toLocaleString()}` : ""}
          </span>
          <Button
            variant="primary"
            isLoading={isSaving}
            onClick={() => handleSave(isDevMode)}
          >
            <Sparkles size={14} className="mr-1" /> Save Settings &amp; Update Banner
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
