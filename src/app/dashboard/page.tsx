'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
    Receipt, CheckSquare, XCircle, Clock, ArrowUpRight,
    BarChart3, Plus, DollarSign, TrendingUp,
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';

const CATEGORY_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function StatCard({ title, value, subtitle, icon: Icon, color, link }: {
    title: string; value: string | number; subtitle?: string;
    icon: React.ElementType; color: string; link?: string;
}) {
    const inner = (
        <div className="stats-card group cursor-pointer">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">{title}</p>
                    <p className="text-2xl sm:text-3xl font-bold mt-1 truncate">{value}</p>
                    {subtitle && <p className="text-xs text-muted-foreground mt-1 truncate">{subtitle}</p>}
                </div>
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
            </div>
            {link && (
                <div className="flex items-center gap-1 text-xs text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    View details <ArrowUpRight className="w-3 h-3" />
                </div>
            )}
        </div>
    );
    if (link) return <Link href={link}>{inner}</Link>;
    return inner;
}

export default function DashboardPage() {
    const { user, company } = useAuth();
    const [stats, setStats] = useState<Record<string, unknown> | null>(null);
    const [recent, setRecent] = useState<Record<string, unknown>[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/stats').then(r => r.json()),
            fetch('/api/expenses?limit=5').then(r => r.json())
        ])
            .then(([s, e]) => {
                if (s.success) setStats(s.data);
                if (e.success) setRecent(e.data.expenses);
            })
            .catch(() => { })
            .finally(() => setIsLoading(false));
    }, []);

    const sym = company?.defaultCurrencySymbol || '$';
    const summary = stats?.summary as Record<string, number> || {};
    const monthly = ((stats?.monthlyTrend as { _id: { month: number }; total: number }[]) || []).map(m => ({
        name: MONTH_NAMES[m._id.month - 1], total: Math.round(m.total),
    }));
    const pie = ((stats?.categoryStats as { _id: string; total: number }[]) || []).slice(0, 6).map(c => ({
        name: c._id.replace(/_/g, ' '), value: Math.round(c.total),
    }));

    if (isLoading) return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="responsive-grid-4">
                {[...Array(4)].map((_, i) => <div key={i} className="glass-card h-28 shimmer" />)}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="glass-card h-60 xl:col-span-2 shimmer" />
                <div className="glass-card h-60 shimmer" />
            </div>
        </div>
    );

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold">
                        Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name?.split(' ')[0]} 👋
                    </h1>
                    <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>
                {user?.role !== 'manager' && (
                    <Link href="/dashboard/expenses/submit" className="btn-primary mobile-full justify-center">
                        <Plus className="w-4 h-4" /> New Expense
                    </Link>
                )}
            </div>

            {/* Stats */}
            <div className="responsive-grid-4">
                <StatCard title="Total" value={summary.total || 0} subtitle="All time" icon={Receipt} color="bg-blue-500/15 text-blue-400" link="/dashboard/expenses" />
                <StatCard title="Pending" value={summary.pending || 0} subtitle={`${sym}${(summary.totalPendingAmount || 0).toFixed(0)}`} icon={Clock} color="bg-amber-500/15 text-amber-400" link="/dashboard/approvals" />
                <StatCard title="Approved" value={summary.approved || 0} subtitle={`${sym}${(summary.totalApprovedAmount || 0).toFixed(0)}`} icon={CheckSquare} color="bg-green-500/15 text-green-400" />
                <StatCard title="Rejected" value={summary.rejected || 0} subtitle="Needs review" icon={XCircle} color="bg-red-500/15 text-red-400" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="glass-card p-4 sm:p-6 xl:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="font-semibold">Monthly Overview</h2>
                            <p className="text-muted-foreground text-xs sm:text-sm">Last 6 months</p>
                        </div>
                        <BarChart3 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    {monthly.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={monthly} barSize={20}>
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `${sym}${v}`} width={55} />
                                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} formatter={(v: unknown) => [`${sym}${Number(v).toLocaleString()}`, 'Amount']} />
                                <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
                    )}
                </div>

                <div className="glass-card p-4 sm:p-6">
                    <h2 className="font-semibold mb-1">By Category</h2>
                    <p className="text-muted-foreground text-xs sm:text-sm mb-4">Top spending</p>
                    {pie.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={pie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                                    {pie.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 11 }} formatter={(v: unknown) => [`${sym}${Number(v).toLocaleString()}`, '']} />
                                <Legend iconType="circle" iconSize={7} formatter={v => <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'capitalize' }}>{String(v)}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
                    )}
                </div>
            </div>

            {/* Recent Expenses */}
            <div className="glass-card p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold">Recent Expenses</h2>
                    <Link href="/dashboard/expenses" className="text-sm text-primary hover:underline flex items-center gap-1">
                        View all <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                {recent.length === 0 ? (
                    <div className="text-center py-10">
                        <DollarSign className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-muted-foreground text-sm">No expenses yet</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile card view */}
                        <div className="sm:hidden space-y-3">
                            {recent.map((e) => (
                                <div key={e._id as string} className="expense-mobile-card">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm truncate">{e.description as string}</p>
                                            <p className="text-xs text-muted-foreground capitalize mt-0.5">
                                                {(e.category as string).replace(/_/g, ' ')}
                                                {e.merchant ? ` · ${e.merchant}` : ''}
                                            </p>
                                            {user?.role !== 'employee' && !!e.submittedBy && (
                                                <p className="text-xs text-primary mt-1 font-medium">
                                                    👤 {String((e.submittedBy as Record<string, any>).name || 'Unknown')}
                                                </p>
                                            )}
                                        </div>
                                        <span className={`badge-${e.status} flex-shrink-0 text-xs`}>
                                            {(e.status as string).replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-bold">{e.currencySymbol as string}{(e.amount as number).toLocaleString()}</span>
                                        <span className="text-muted-foreground text-xs">
                                            {new Date(e.expenseDate as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Desktop table */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/30">
                                        <th className="table-header text-left py-3 pr-4">Description</th>
                                        <th className="table-header text-left py-3 pr-4">Amount</th>
                                        <th className="table-header text-left py-3 pr-4">Date</th>
                                        <th className="table-header text-left py-3">Status</th>
                                        {user?.role !== 'employee' && (
                                            <th className="table-header text-left py-3">Employee</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {recent.map((e) => (
                                        <tr key={e._id as string} className="table-row">
                                            <td className="py-3 pr-4">
                                                <p className="font-medium truncate max-w-[200px]">{e.description as string}</p>
                                                <p className="text-xs text-muted-foreground capitalize">{(e.category as string).replace(/_/g, ' ')}</p>
                                            </td>
                                            <td className="py-3 pr-4 font-semibold">
                                                {e.currencySymbol as string}{(e.amount as number).toLocaleString()}
                                            </td>
                                            <td className="py-3 pr-4 text-muted-foreground">
                                                {new Date(e.expenseDate as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="py-3">
                                                <span className={`badge-${e.status}`}>{(e.status as string).replace(/_/g, ' ')}</span>
                                            </td>
                                            {user?.role !== 'employee' && (
                                                <td className="py-3">
                                                    <p className="font-medium text-xs">{(e.submittedBy as { name: string })?.name || 'Unknown'}</p>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
