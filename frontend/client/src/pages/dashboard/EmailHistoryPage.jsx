import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, Mail, RefreshCw, XCircle } from "lucide-react";
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
                <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
                    <table className="w-full min-w-[620px] text-left text-sm">
                        <thead style={{ backgroundColor: "var(--bg)" }}>
                            <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                {['To', 'Subject', 'Message', 'Status', 'Sent'].map((heading) => (
                                    <th key={heading} className="px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--ink-muted)" }}>
                                        {heading}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => {
                                const status = statusConfig[log.status] || statusConfig.failed;
                                const StatusIcon = status.icon;
                                return (
                                    <tr key={log._id} style={{ borderBottom: "1px solid var(--border)" }}>
                                        <td className="px-4 py-4" style={{ color: "var(--ink-muted)" }}>
                                            {log.recipient}
                                        </td>
                                        <td className="max-w-[22rem] px-4 py-4 font-semibold" style={{ color: "var(--ink)" }}>
                                            <span className="line-clamp-2">{log.subject}</span>
                                        </td>
                                        <td className="px-4 py-4" style={{ color: "var(--ink-muted)" }}>
                                            <span className="line-clamp-3 whitespace-pre-line">{log.bodyText || "Message content unavailable"}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: status.color }}>
                                                <StatusIcon size={14} />
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4" style={{ color: "var(--ink-muted)" }}>
                                            {new Date(log.sentAt || log.createdAt).toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default EmailHistoryPage;