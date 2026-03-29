'use client';

import { useState, useEffect } from 'react';
import { FileText, Loader2, Search, RefreshCw } from 'lucide-react';

interface AuditLog {
    _id: string;
    action: string;
    resource: string;
    userId: { name: string; email: string; role: string };
    details?: Record<string, unknown>;
    timestamp: string;
}

const ACTION_COLORS: Record<string, string> = {
    EXPENSE_SUBMITTED: 'badge-pending',
    EXPENSE_APPROVED: 'badge-approved',
    EXPENSE_REJECTED: 'badge-rejected',
    USER_CREATED: 'badge-in_review',
    USER_UPDATED: 'badge-in_review',
    USER_DEACTIVATED: 'badge-rejected',
    COMPANY_UPDATED: 'badge-admin',
    EXPENSE_DELETED: 'badge-rejected',
};

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const limit = 50;

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/audit-logs?page=${page}&limit=${limit}`);
            const d = await res.json();
            if (res.ok) { setLogs(d.data.logs); setTotal(d.data.total); }
        } catch { } finally { setIsLoading(false); }
    };

    useEffect(() => { fetchLogs(); }, [page]);

    const filtered = logs.filter((l) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            l.action.toLowerCase().includes(s) ||
            l.resource.toLowerCase().includes(s) ||
            l.userId?.name?.toLowerCase().includes(s)
        );
    });

    return (
        <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="w-6 h-6 text-primary" /> Audit Logs
                    </h1>
                    <p className="text-muted-foreground text-sm">{total} total events</p>
                </div>
                <button onClick={fetchLogs} className="btn-ghost p-2.5" title="Refresh">
                    <RefreshCw className={isLoading ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} />
                </button>
            </div>

            <div className="glass-card p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        className="input-field pl-10 py-2.5"
                        placeholder="Search logs..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/30 bg-secondary/20">
                                    <th className="table-header text-left px-5 py-3.5">Timestamp</th>
                                    <th className="table-header text-left px-4 py-3.5">Action</th>
                                    <th className="table-header text-left px-4 py-3.5">Resource</th>
                                    <th className="table-header text-left px-4 py-3.5">Performed By</th>
                                    <th className="table-header text-left px-4 py-3.5">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((log) => (
                                    <tr key={log._id} className="table-row">
                                        <td className="px-5 py-3 text-muted-foreground text-xs whitespace-nowrap">
                                            {new Date(log.timestamp).toLocaleString('en-US', {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                                            })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={ACTION_COLORS[log.action] || 'badge-employee'}>
                                                {log.action.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground capitalize">{log.resource}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium">{log.userId?.name}</p>
                                            <p className="text-xs text-muted-foreground">{log.userId?.email}</p>
                                        </td>
                                        <td className="px-4 py-3 min-w-[200px] max-w-[320px]">
                                            {log.details && (
                                                <div className="space-y-1.5 p-2 rounded-lg bg-secondary/30 border border-border/20">
                                                    {Object.entries(log.details).map(([k, v]) => (
                                                        <div key={k} className="text-[11px] flex items-baseline gap-1.5 leading-tight">
                                                            <span className="text-muted-foreground capitalize flex-shrink-0">{k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}:</span>
                                                            <span className="font-medium text-blue-100 break-all">{String(v)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {total > limit && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-sm text-muted-foreground">
                        Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
                    </p>
                    <div className="flex gap-2">
                        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-50">← Prev</button>
                        <button onClick={() => setPage((p) => p + 1)} disabled={page * limit >= total} className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-50">Next →</button>
                    </div>
                </div>
            )}
        </div>
    );
}
