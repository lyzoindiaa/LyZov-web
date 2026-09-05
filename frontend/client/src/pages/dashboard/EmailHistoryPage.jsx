import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, Eye, Mail, RefreshCw, X, XCircle } from "lucide-react";
import emailService from "../../services/emailService";

const statusConfig = {
    sent: { label: "Sent", color: "var(--green)", icon: CheckCircle2 },
    simulated: { label: "Recorded", color: "var(--blue)", icon: Clock3 },
    failed: { label: "Failed", color: "var(--red)", icon: XCircle },
};

const EmailHistoryPage = () => {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedLog, setSelectedLog] = useState(null);

    const loadLogs = async () => {
        setIsLoading(true);
        setError("");
        try {
            const response = await emailService.fetchMyEmailLogs({ limit: 50 });
            setLogs(response.data || []);
        } catch (err) {
            setError(err.response?.data?.message || "We could not load your email history.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, []);

    return (
        <div>
            <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                    <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--ink)" }}>Email History</h2>
                    <p style={{ marginTop: "0.25rem", fontSize: "0.8125rem", color: "var(--ink-muted)" }}>
                        Messages you sent to LyZov support.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={loadLogs}
                    aria-label="Refresh email history"
                    title="Refresh email history"
                    disabled={isLoading}
                    className="btn btn-ghost btn-sm"
                >
                    <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
                </button>
            </div>

            {error ? (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <AlertCircle size={17} />
                    <span>{error}</span>
                </div>
            ) : isLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm" style={{ color: "var(--ink-muted)" }}>
                    <RefreshCw size={17} className="animate-spin" />
                    Loading your email history...
                </div>
            ) : logs.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <Mail size={36} strokeWidth={1.25} style={{ color: "var(--ink-muted)" }} />
                    <h3 style={{ fontWeight: 700, color: "var(--ink)" }}>No emails yet</h3>
                    <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
                        Your messages to LyZov support will appear here.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {logs.map((log) => {
                        const status = statusConfig[log.status] || statusConfig.failed;
                        const StatusIcon = status.icon;

                        return (
                            <article
                                key={log._id}
                                className="rounded-xl border p-5 transition-shadow hover:shadow-md"
                                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
                            >
                                <div className="mb-4 flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--ink-muted)" }}>
                                            To
                                        </p>
                                        <p className="truncate text-sm font-semibold" style={{ color: "var(--ink)" }}>
                                            {log.recipient}
                                        </p>
                                    </div>
                                    <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold" style={{ color: status.color }}>
                                        <StatusIcon size={14} />
                                        {status.label}
                                    </span>
                                </div>

                                <p className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--ink-muted)" }}>
                                    Subject
                                </p>
                                <h3 className="line-clamp-2 text-base font-bold" style={{ color: "var(--ink)" }}>
                                    {log.subject}
                                </h3>
                                <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm" style={{ color: "var(--ink-muted)" }}>
                                    {log.bodyText || "Message content unavailable"}
                                </p>

                                <div className="mt-5 flex items-center justify-between gap-3 border-t pt-4" style={{ borderColor: "var(--border)" }}>
                                    <span className="text-xs" style={{ color: "var(--ink-muted)" }}>
                                        {new Date(log.sentAt || log.createdAt).toLocaleString("en-IN", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedLog(log)}
                                        className="btn btn-secondary btn-sm"
                                        title="View sent email"
                                    >
                                        <Eye size={14} />
                                        View email
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {selectedLog && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                    role="presentation"
                    onClick={() => setSelectedLog(null)}
                >
                    <div
                        className="w-full max-w-2xl rounded-2xl border p-6 shadow-2xl"
                        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="sent-email-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mb-5 flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--border)" }}>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--ink-muted)" }}>
                                    Sent email
                                </p>
                                <h3 id="sent-email-title" className="mt-1 text-lg font-bold" style={{ color: "var(--ink)" }}>
                                    {selectedLog.subject}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedLog(null)}
                                className="btn btn-ghost btn-sm"
                                aria-label="Close sent email"
                                title="Close"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        <div className="space-y-4 text-sm" style={{ color: "var(--ink)" }}>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--ink-muted)" }}>To</p>
                                <p className="mt-1 font-semibold">{selectedLog.recipient}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--ink-muted)" }}>Message</p>
                                <p className="mt-2 whitespace-pre-line rounded-lg border p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
                                    {selectedLog.bodyText || "Message content unavailable"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmailHistoryPage;