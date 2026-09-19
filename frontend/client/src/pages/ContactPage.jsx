import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Mail, Phone, Clock, Send, CheckCircle2, ShieldAlert, Sparkles, MessageSquare, Lock, User, FileText } from "lucide-react";
import { supportService } from "../services/supportService";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import SEO from "../components/common/SEO";
import { WHATSAPP_SUPPORT_NUMBER, buildWhatsAppSupportLink } from "../utils/constants";

const categories = [
  { value: "Order Tracking & Delivery", label: "Order Tracking & Delivery" },
  { value: "Product Sizing & Consultation", label: "Product Sizing & Consultation" },
  { value: "Returns & Exchanges", label: "Returns & 7-Day Replacement" },
  { value: "Sacred Art & Material Care", label: "Sacred Art & Material Care" },
  { value: "Wholesale & Custom Inquiries", label: "Wholesale & Custom Orders" },
  { value: "General Question", label: "General Feedback or Question" },
];

const ContactPage = ({ isDashboard = false }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketResult, setTicketResult] = useState(null);
  const [activeTab, setActiveTab] = useState("contact"); // "contact" | "message"
  const { user } = useSelector((state) => state.auth);
  const [searchParams] = useSearchParams();

  const defaultCategory = searchParams.get("category") || "Order Tracking & Delivery";
  const defaultSubject = searchParams.get("subject") || "";

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    mode: "onTouched",
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      category: defaultCategory,
      subject: defaultSubject,
      message: "",
    },
  });

  // Watch form values for step completion
  const formValues = watch();

  // Step completion calculations
  const isStep1Complete = Boolean(
    formValues?.name?.trim() &&
    formValues?.email?.trim() &&
    formValues?.subject?.trim()
  );

  const isStep2Complete = Boolean(
    isStep1Complete &&
    formValues?.message?.trim()
  );

  useEffect(() => {
    if (user || defaultSubject || defaultCategory) {
      reset((prev) => ({
        ...prev,
        name: user?.name || prev.name,
        email: user?.email || prev.email,
        phone: user?.phone || prev.phone,
        category: defaultCategory || prev.category,
        subject: defaultSubject || prev.subject,
      }));
    }
  }, [user, defaultSubject, defaultCategory, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const res = await supportService.submitInquiry(data);
      setTicketResult(res.data?.ticketId || "CONFIRMED");
      toast.success("Message transmitted. We have emailed you a ticket confirmation.");
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to transmit message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onFormError = (formErrors) => {
    if (!formErrors) return;
    const errorKeys = Object.keys(formErrors);
    if (errorKeys.length === 0) return;
    if (errorKeys.some((k) => ["name", "email", "phone", "subject", "category"].includes(k))) {
      setActiveTab("contact");
    }
    const firstError = Object.values(formErrors)[0]?.message || "Please fill in all required fields.";
    toast.error(firstError);
  };

  const handleTabClick = (tabKey) => {
    if (tabKey === "message" && !isStep1Complete) {
      toast.warning("🔒 Step 1 (Contact Information) must be completed before accessing Message.");
      return;
    }
    setActiveTab(tabKey);
  };

  return (
    <div style={isDashboard ? { width: "100%", paddingBottom: "2rem" } : { backgroundColor: "var(--bg)", minHeight: "80vh", padding: "3.5rem 0 5rem" }}>
      {!isDashboard && (
        <SEO
          title="Contact Us — LyZov Customer Support"
          description="Get in touch with the LyZov Store team for order inquiries, support, or partnership opportunities. Fast response guaranteed."
          canonicalUrl={`${window.location.origin}/contact`}
        />
      )}
      <div className={isDashboard ? "w-full" : "container-page"}>
        {/* ── Page Header ── */}
        {isDashboard ? (
          <div style={{ marginBottom: "2rem" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.25rem 0.75rem",
                borderRadius: "9999px",
                backgroundColor: "var(--accent-bg)",
                color: "var(--accent)",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "0.5rem",
              }}
            >
              <Sparkles size={13} />
              <span>Concierge Desk</span>
            </div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              Customer Support & Email Desk
            </h1>
            <p style={{ marginTop: "0.25rem", fontSize: "0.875rem", color: "var(--ink-muted)" }}>
              Have a question about an order, tracking, or delivery? Send a direct message to our support team.
            </p>
          </div>
        ) : (
          <div style={{ textAlign: "center", maxWidth: "42rem", margin: "0 auto 3.5rem" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.35rem 0.85rem",
                borderRadius: "9999px",
                backgroundColor: "var(--accent-bg)",
                color: "var(--accent)",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "1rem",
              }}
            >
              <Sparkles size={13} />
              <span>LyZov Concierge Desk</span>
            </div>
            <h1
              style={{
                fontSize: "clamp(2rem, 4vw, 2.75rem)",
                fontWeight: 800,
                color: "var(--ink)",
                letterSpacing: "-0.025em",
                lineHeight: 1.2,
              }}
            >
              We Are Here to Assist You
            </h1>
            <p style={{ marginTop: "1rem", fontSize: "1rem", color: "var(--ink-muted)", lineHeight: 1.7 }}>
              Have a question about an order, custom idol inquiry, or gym gear specifications? Reach out to our dedicated concierge specialists.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── Left Column: Contact Cards ── */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <div
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "1.25rem",
                padding: "1.75rem",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--ink)", marginBottom: "1.25rem" }}>
                Direct Channels
              </h3>

              <div className="flex flex-col gap-6">
                <div className="flex items-start gap-3.5">
                  <div
                    style={{
                      width: "2.5rem",
                      height: "2.5rem",
                      borderRadius: "0.75rem",
                      backgroundColor: "var(--accent-bg)",
                      color: "var(--accent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Mail size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--ink-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>
                      Email Inquiries
                    </span>
                    <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--ink)", marginTop: "2px" }}>
                      lyzovindia@gmail.com
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "2px" }}>
                      Average response time: &lt; 4 hours
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div
                    style={{
                      width: "2.5rem",
                      height: "2.5rem",
                      borderRadius: "0.75rem",
                      backgroundColor: "var(--green-bg)",
                      color: "var(--green)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Phone size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--ink-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>
                      Direct Phone & WhatsApp
                    </span>
                    <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--ink)", marginTop: "2px" }}>
                      +{WHATSAPP_SUPPORT_NUMBER}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "2px" }}>
                      Mon - Sat: 9:30 AM – 7:00 PM IST
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div
                    style={{
                      width: "2.5rem",
                      height: "2.5rem",
                      borderRadius: "0.75rem",
                      backgroundColor: "var(--blue-bg)",
                      color: "var(--blue)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Clock size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--ink-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>
                      Support Hours
                    </span>
                    <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--ink)", marginTop: "2px" }}>
                      Monday – Saturday
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "2px" }}>
                      Emails monitored 24/7 for urgent delivery issues
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Guarantee Badge */}
            <div
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "1.25rem",
                padding: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <ShieldAlert size={28} style={{ color: "var(--accent)", flexShrink: 0 }} />
              <div>
                <h4 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--ink)" }}>
                  Pan-India Safe Delivery
                </h4>
                <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "2px", lineHeight: 1.5 }}>
                  All orders are insured with transit tracking and 7-day replacement guarantee.
                </p>
              </div>
            </div>
          </div>

          {/* ── Right Column: Inquiry Form ── */}
          <div className="lg:col-span-8">
            <div
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "1.25rem",
                padding: "2.5rem",
                boxShadow: "var(--shadow-md)",
              }}
            >
              {ticketResult ? (
                <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
                  <div
                    style={{
                      width: "4rem",
                      height: "4rem",
                      borderRadius: "9999px",
                      backgroundColor: "var(--green-bg)",
                      color: "var(--green)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 1.5rem",
                    }}
                  >
                    <CheckCircle2 size={36} />
                  </div>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--ink)" }}>
                    Message Received
                  </h2>
                  <p style={{ fontSize: "0.9375rem", color: "var(--ink-muted)", marginTop: "0.5rem", maxWidth: "26rem", margin: "0.5rem auto 1.5rem" }}>
                    Your ticket <strong>#{ticketResult}</strong> has been logged. An email acknowledgment has been dispatched to your address.
                  </p>
                  <Button
                    onClick={() => setTicketResult(null)}
                    variant="outline"
                    className="flex items-center gap-2 mx-auto"
                  >
                    <MessageSquare size={15} />
                    <span>Submit Another Inquiry</span>
                  </Button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: "1.75rem" }}>
                    <h2 style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--ink)" }}>
                      Send Us a Message
                    </h2>
                    <p style={{ fontSize: "0.875rem", color: "var(--ink-muted)", marginTop: "0.25rem" }}>
                      Fill in your details below and our concierge team will respond promptly.
                    </p>
                  </div>

                  {/* Progressive Step Tabs Bar */}
                  <div className="flex flex-wrap gap-2 border-b border-hairline pb-2 dark:border-hairline-dark mb-6">
                    {/* Step 1 Tab */}
                    <button
                      type="button"
                      onClick={() => handleTabClick("contact")}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "contact"
                          ? "bg-[var(--accent)] text-white shadow-sm"
                          : isStep1Complete
                            ? "text-stone hover:text-[var(--ink)] hover:bg-[var(--bg-raised)]"
                            : "text-[var(--accent)] bg-[var(--accent-bg)]"
                        }`}
                    >
                      <User size={16} />
                      <span>1. Contact Info</span>
                      {isStep1Complete ? (
                        <CheckCircle2 size={15} className="text-emerald-500 ml-1" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-amber-500 ml-1" title="Incomplete" />
                      )}
                    </button>

                    {/* Step 2 Tab */}
                    <button
                      type="button"
                      onClick={() => handleTabClick("message")}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "message"
                          ? "bg-[var(--accent)] text-white shadow-sm"
                          : isStep1Complete
                            ? isStep2Complete
                              ? "text-stone hover:text-[var(--ink)] hover:bg-[var(--bg-raised)]"
                              : "text-[var(--accent)] bg-[var(--accent-bg)]"
                            : "opacity-50 cursor-not-allowed text-stone bg-[var(--bg-subtle)]"
                        }`}
                    >
                      <FileText size={16} />
                      <span>2. Message</span>
                      {!isStep1Complete ? (
                        <Lock size={14} className="text-stone ml-1" title="Locked: Complete Step 1 first" />
                      ) : isStep2Complete ? (
                        <CheckCircle2 size={15} className="text-emerald-500 ml-1" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-amber-500 ml-1" title="Incomplete" />
                      )}
                    </button>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit, onFormError)} className="flex flex-col gap-5">
                    {/* Tab 1: Contact Information */}
                    {activeTab === "contact" && (
                      <div className="card-surface p-6 sm:p-8">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-hairline dark:border-hairline-dark">
                          <div>
                            <h3 className="font-display text-lg font-bold">Step 1: Contact Information</h3>
                            <p className="text-xs text-stone mt-0.5">
                              All fields marked with <span className="text-rose-500 font-bold">*</span> are mandatory to unlock Step 2.
                            </p>
                          </div>
                          {isStep1Complete && (
                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                              <CheckCircle2 size={14} /> Step 1 Completed
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Input
                            label="Your Full Name *"
                            placeholder="e.g. Vikram Sharma"
                            required
                            {...register("name", {
                              required: "Please provide your name",
                              minLength: { value: 2, message: "At least 2 characters" },
                            })}
                            error={errors.name?.message}
                          />

                          <Input
                            label="Email Address *"
                            type="email"
                            placeholder="vikram@example.com"
                            leftIcon={Mail}
                            required
                            {...register("email", {
                              required: "Email is required",
                              pattern: {
                                value: /^\S+@\S+\.\S+$/,
                                message: "Please enter a valid email",
                              },
                            })}
                            error={errors.email?.message}
                          />

                          <Input
                            label="Phone Number (Optional)"
                            placeholder="+91 xxxxxxxxxx"
                            leftIcon={Phone}
                            {...register("phone")}
                          />

                          <div className="flex flex-col gap-1.5">
                            <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ink)" }}>
                              Inquiry Category
                            </label>
                            <select
                              className="input-field"
                              style={{
                                height: "2.75rem",
                                borderRadius: "0.75rem",
                                backgroundColor: "var(--bg)",
                                border: "1px solid var(--border)",
                                padding: "0 0.85rem",
                                fontSize: "0.875rem",
                                color: "var(--ink)",
                              }}
                              {...register("category")}
                            >
                              {categories.map((c) => (
                                <option key={c.value} value={c.value}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <Input
                            label="Subject *"
                            placeholder="Brief topic of your inquiry (e.g., Delivery date for Order #NC-123)"
                            required
                            className="sm:col-span-2"
                            {...register("subject", {
                              required: "Subject is required",
                              minLength: { value: 4, message: "Subject must be at least 4 characters" },
                            })}
                            error={errors.subject?.message}
                          />
                        </div>

                        <div className="flex items-center justify-between pt-4">
                          <span className="text-xs text-stone">Saving will automatically unlock Step 2 (Message)</span>
                          <Button
                            type="button"
                            onClick={() => handleTabClick("message")}
                            className="flex items-center gap-2"
                          >
                            <span>Continue to Step 2</span>
                            <Send size={16} />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Message */}
                    {activeTab === "message" && (
                      <div className="card-surface p-6 sm:p-8">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-hairline dark:border-hairline-dark">
                          <div>
                            <h3 className="font-display text-lg font-bold">Step 2: Your Message</h3>
                            <p className="text-xs text-stone mt-0.5">
                              Describe your question or issue in detail <span className="text-rose-500 font-bold">*</span>.
                            </p>
                          </div>
                          {isStep2Complete && (
                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                              <CheckCircle2 size={14} /> Step 2 Completed
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ink)" }}>
                            Message <span style={{ color: "var(--accent)" }}>*</span>
                          </label>
                          <textarea
                            rows={5}
                            placeholder="Please describe your question or issue in detail..."
                            className="input-field"
                            style={{
                              borderRadius: "0.75rem",
                              backgroundColor: "var(--bg)",
                              border: "1px solid var(--border)",
                              padding: "0.85rem",
                              fontSize: "0.875rem",
                              color: "var(--ink)",
                              resize: "vertical",
                            }}
                            {...register("message", {
                              required: "Message is required",
                              minLength: { value: 10, message: "Message must be at least 10 characters" },
                            })}
                          />
                          {errors.message && (
                            <span style={{ fontSize: "0.75rem", color: "#EF4444" }}>
                              {errors.message.message}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-4">
                          <button
                            type="button"
                            onClick={() => setActiveTab("contact")}
                            className="text-xs text-stone hover:text-[var(--ink)] underline font-medium"
                          >
                            ← Back to Step 1
                          </button>
                          <Button
                            type="submit"
                            isLoading={isSubmitting}
                            className="btn-ripple flex items-center justify-center gap-2"
                            style={{ height: "3rem" }}
                          >
                            <Send size={16} />
                            <span>Transmit Message</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
