import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ShieldCheck,
  FileText,
  RotateCcw,
  Banknote,
  Truck,
  ArrowLeft,
  Search,
  Printer,
  Clock,
  CheckCircle2,
  HelpCircle,
  ChevronRight,
  Share2,
  Mail,
  ExternalLink,
} from "lucide-react";
import { policiesData, getPolicyBySlug } from "../data/policiesData";
import { toast } from "react-toastify";
import SEO from "../components/common/SEO";

// Icon mapping
const iconMap = {
  ShieldCheck: ShieldCheck,
  FileText: FileText,
  RotateCcw: RotateCcw,
  Banknote: Banknote,
  Truck: Truck,
};

const PolicyPage = () => {
  const { policySlug } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("");

  // Determine active policy based on route param or fallback
  const activePolicy = useMemo(() => {
    return getPolicyBySlug(policySlug);
  }, [policySlug]);

  // Scroll to top when policy changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setSearchQuery("");
  }, [activePolicy.id]);

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return activePolicy.sections;
    const query = searchQuery.toLowerCase();
    return activePolicy.sections.filter((sec) => {
      const headingMatch = sec.heading.toLowerCase().includes(query);
      const paraMatch = sec.paragraphs?.some((p) => p.toLowerCase().includes(query));
      const listMatch = sec.listItems?.some((item) => item.toLowerCase().includes(query));
      return headingMatch || paraMatch || listMatch;
    });
  }, [activePolicy, searchQuery]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Policy link copied to clipboard!");
    } else {
      toast.info("Link: " + window.location.href);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const PolicyIcon = iconMap[activePolicy.icon] || FileText;

  return (
    <div style={{ backgroundColor: "var(--bg)", minHeight: "100vh", paddingBottom: "5rem" }}>
      <SEO
        title={`${activePolicy.title} — Official Policy | LyZov`}
        description={`Read the official ${activePolicy.title} for LyZov. Learn about terms, conditions, timelines, and customer rights.`}
        canonicalUrl={`${window.location.origin}/policies/${activePolicy.slug}`}
      />
      {/* ── Policy Header Hero ── */}
      <section
        style={{
          borderBottom: "1px solid var(--border)",
          backgroundColor: "var(--surface)",
          position: "relative",
          overflow: "hidden",
        }}
        className="py-10 lg:py-14"
      >
        <div className="container-page">
          {/* Breadcrumb & Top Actions */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--ink-muted)" }}>
              <Link to="/" className="hover:underline" style={{ color: "var(--ink-muted)" }}>
                Home
              </Link>
              <ChevronRight size={14} />
              <Link to="/policies/privacy-policy" className="hover:underline" style={{ color: "var(--ink-muted)" }}>
                Legal & Policies
              </Link>
              <ChevronRight size={14} />
              <span style={{ color: "var(--accent)", fontWeight: 700 }}>{activePolicy.title}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <button
                type="button"
                onClick={handleShare}
                className="btn-secondary"
                style={{
                  padding: "0.45rem 0.85rem",
                  fontSize: "0.75rem",
                  borderRadius: "9999px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
                title="Share this policy"
              >
                <Share2 size={13} />
                <span>Share</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="btn-secondary"
                style={{
                  padding: "0.45rem 0.85rem",
                  fontSize: "0.75rem",
                  borderRadius: "9999px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
                title="Print or Save PDF"
              >
                <Printer size={13} />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* Title and Metadata */}
          <div style={{ maxWidth: "52rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <div
                style={{
                  width: "2.75rem",
                  height: "2.75rem",
                  borderRadius: "0.875rem",
                  backgroundColor: "var(--accent-bg)",
                  color: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <PolicyIcon size={22} />
              </div>
              <span className="badge badge-accent" style={{ fontSize: "0.75rem" }}>
                Official Platform Policy · v{activePolicy.version}
              </span>
            </div>

            <h1
              style={{
                fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
                fontWeight: 900,
                color: "var(--ink)",
                lineHeight: 1.15,
                letterSpacing: "-0.03em",
                marginBottom: "0.75rem",
              }}
            >
              {activePolicy.title}
            </h1>

            <p style={{ fontSize: "1rem", color: "var(--ink-light)", lineHeight: 1.65, maxWidth: "46rem", marginBottom: "1.25rem" }}>
              {activePolicy.summary}
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.75rem", color: "var(--ink-muted)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <Clock size={14} style={{ color: "var(--accent)" }} /> Last updated: {activePolicy.lastUpdated}
              </span>
              <span>Effective Date: {activePolicy.effectiveDate}</span>
              <span>Applicable Region: Pan-India</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Policy Hub Navigation Pills (Mobile / Quick switcher) ── */}
      <div
        style={{
          borderBottom: "1px solid var(--border)",
          backgroundColor: "var(--bg-subtle)",
          position: "sticky",
          top: "4rem",
          zIndex: 20,
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="container-page py-3">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              overflowX: "auto",
              paddingBottom: "0.25rem",
            }}
            className="category-scroll"
          >
            {policiesData.map((p) => {
              const PIcon = iconMap[p.icon] || FileText;
              const isActive = p.id === activePolicy.id;
              return (
                <Link
                  key={p.id}
                  to={`/policies/${p.slug}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    padding: "0.5rem 1rem",
                    borderRadius: "9999px",
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    textDecoration: "none",
                    border: `1.5px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                    backgroundColor: isActive ? "var(--accent)" : "var(--surface)",
                    color: isActive ? "#FFFFFF" : "var(--ink)",
                    transition: "all 0.18s ease",
                  }}
                >
                  <PIcon size={14} />
                  <span>{p.shortTitle}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main Content Area with Sidebar ── */}
      <div className="container-page py-10 lg:py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Left Sidebar: Policy Directory & Table of Contents */}
          <aside className="lg:col-span-4" style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
            {/* Policy Switcher Card */}
            <div className="card-surface p-5" style={{ borderRadius: "1.25rem" }}>
              <h3
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--ink-muted)",
                  marginBottom: "1rem",
                }}
              >
                All Platform Policies
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                {policiesData.map((pol) => {
                  const Icon = iconMap[pol.icon] || FileText;
                  const isCurrent = pol.id === activePolicy.id;
                  return (
                    <Link
                      key={pol.id}
                      to={`/policies/${pol.slug}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.75rem",
                        textAlign: "left",
                        width: "100%",
                        textDecoration: "none",
                        backgroundColor: isCurrent ? "var(--accent-bg)" : "transparent",
                        color: isCurrent ? "var(--accent)" : "var(--ink)",
                        fontWeight: isCurrent ? 700 : 500,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      className="hover:bg-amber-500/10"
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "0.625rem", fontSize: "0.875rem" }}>
                        <Icon size={16} style={{ color: isCurrent ? "var(--accent)" : "var(--ink-muted)" }} />
                        {pol.shortTitle}
                      </span>
                      {isCurrent && <ChevronRight size={14} style={{ color: "var(--accent)" }} />}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Quick In-Page Table of Contents */}
            <div className="card-surface p-5 hidden lg:block" style={{ borderRadius: "1.25rem", position: "sticky", top: "8.5rem" }}>
              <h3
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--ink-muted)",
                  marginBottom: "1rem",
                }}
              >
                On This Page
              </h3>
              <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {activePolicy.sections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    onClick={() => setActiveSection(sec.id)}
                    style={{
                      fontSize: "0.8125rem",
                      color: activeSection === sec.id ? "var(--accent)" : "var(--ink-light)",
                      fontWeight: activeSection === sec.id ? 700 : 500,
                      textDecoration: "none",
                      lineHeight: 1.4,
                      paddingLeft: "0.5rem",
                      borderLeft: `2px solid ${activeSection === sec.id ? "var(--accent)" : "transparent"}`,
                      transition: "all 0.15s ease",
                    }}
                    className="hover:text-accent"
                  >
                    {sec.heading}
                  </a>
                ))}
              </nav>

              {/* Need Help Concierge Box */}
              <div
                style={{
                  marginTop: "1.75rem",
                  padding: "1rem",
                  borderRadius: "0.875rem",
                  backgroundColor: "var(--bg-subtle)",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                  <HelpCircle size={16} style={{ color: "var(--accent)" }} />
                  <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--ink)" }}>Have a Question?</span>
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", lineHeight: 1.5, marginBottom: "0.75rem" }}>
                  Our concierge team is available 6 days a week to clarify policies or assist with orders.
                </p>
                <Link
                  to="/contact"
                  className="btn-accent w-full"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                    padding: "0.45rem",
                    fontSize: "0.75rem",
                    borderRadius: "0.625rem",
                    textDecoration: "none",
                  }}
                >
                  <Mail size={13} /> Contact Support
                </Link>
              </div>
            </div>
          </aside>

          {/* Right Main Content: Highlights, Search & Policy Sections */}
          <main className="lg:col-span-8" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Highlights Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {activePolicy.highlights?.map((hl, idx) => (
                <div
                  key={idx}
                  className="card-surface p-4"
                  style={{
                    borderRadius: "1rem",
                    borderLeft: "3px solid var(--accent)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                    <CheckCircle2 size={15} style={{ color: "var(--accent)", flexShrink: 0 }} />
                    <h4 style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--ink)" }}>{hl.title}</h4>
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", lineHeight: 1.5 }}>{hl.desc}</p>
                </div>
              ))}
            </div>

            {/* In-Policy Clause Search */}
            <div style={{ position: "relative" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--ink-subtle)",
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search clauses in ${activePolicy.shortTitle}...`}
                className="input-field"
                style={{
                  paddingLeft: "2.75rem",
                  paddingRight: "1rem",
                  paddingTop: "0.7rem",
                  paddingBottom: "0.7rem",
                  fontSize: "0.875rem",
                  borderRadius: "0.875rem",
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "0.75rem",
                    color: "var(--ink-muted)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Rendered Policy Sections */}
            {filteredSections.length === 0 ? (
              <div className="card-surface p-8 text-center" style={{ borderRadius: "1.25rem" }}>
                <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--ink)" }}>No clauses matched "{searchQuery}"</p>
                <p style={{ fontSize: "0.8125rem", color: "var(--ink-muted)", marginTop: "0.35rem" }}>
                  Try a different search term or clear the filter to view the entire policy.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="btn-secondary mt-4"
                  style={{ padding: "0.45rem 1rem", fontSize: "0.8125rem" }}
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
                {filteredSections.map((section) => (
                  <article
                    key={section.id}
                    id={section.id}
                    className="card-surface p-6 sm:p-8 scroll-mt-28"
                    style={{ borderRadius: "1.25rem" }}
                  >
                    <h2
                      style={{
                        fontSize: "1.2rem",
                        fontWeight: 800,
                        color: "var(--ink)",
                        lineHeight: 1.3,
                        marginBottom: "1rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      {section.heading}
                    </h2>

                    {section.paragraphs?.map((para, pIdx) => (
                      <p
                        key={pIdx}
                        style={{
                          fontSize: "0.9rem",
                          color: "var(--ink-light)",
                          lineHeight: 1.75,
                          marginBottom: pIdx === section.paragraphs.length - 1 && !section.listItems ? 0 : "0.875rem",
                        }}
                      >
                        {para}
                      </p>
                    ))}

                    {section.listItems && (
                      <ul
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.625rem",
                          marginTop: "0.75rem",
                          paddingLeft: "1.25rem",
                          listStyleType: "disc",
                        }}
                      >
                        {section.listItems.map((item, lIdx) => (
                          <li
                            key={lIdx}
                            style={{
                              fontSize: "0.875rem",
                              color: "var(--ink-light)",
                              lineHeight: 1.65,
                            }}
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}

                    {section.callout && (
                      <div
                        style={{
                          marginTop: "1.25rem",
                          padding: "1.25rem",
                          borderRadius: "0.875rem",
                          backgroundColor: "var(--accent-bg)",
                          border: "1px solid var(--accent)",
                        }}
                      >
                        <h4 style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--accent)", marginBottom: "0.35rem" }}>
                          {section.callout.title}
                        </h4>
                        {section.callout.email && (
                          <p style={{ fontSize: "0.8125rem", color: "var(--ink)", marginBottom: "0.2rem" }}>
                            <strong>Official Email:</strong>{" "}
                            <a href={`mailto:${section.callout.email}`} style={{ color: "var(--accent)", textDecoration: "underline" }}>
                              {section.callout.email}
                            </a>
                          </p>
                        )}
                        {section.callout.address && (
                          <p style={{ fontSize: "0.8125rem", color: "var(--ink)", marginBottom: "0.2rem" }}>
                            <strong>Office Location:</strong> {section.callout.address}
                          </p>
                        )}
                        {section.callout.sla && (
                          <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "0.35rem" }}>
                            {section.callout.sla}
                          </p>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}

            {/* Bottom Navigation between adjacent policies */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
                paddingTop: "1.5rem",
                borderTop: "1px solid var(--border)",
              }}
            >
              <Link
                to="/policies/privacy-policy"
                className="btn-secondary"
                style={{
                  padding: "0.6rem 1.1rem",
                  fontSize: "0.8125rem",
                  borderRadius: "9999px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  textDecoration: "none",
                }}
              >
                <ArrowLeft size={14} /> Back to Policies Directory
              </Link>

              <Link
                to="/contact"
                className="btn-accent"
                style={{
                  padding: "0.6rem 1.25rem",
                  fontSize: "0.8125rem",
                  borderRadius: "9999px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  textDecoration: "none",
                }}
              >
                <span>Have a Policy Inquiry?</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default PolicyPage;
