'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
    Receipt, Plus, Search, Eye, Loader2, RefreshCw,
    Filter, ChevronDown,
} from 'lucide-react';

interface Expense {
    _id: string; amount: number; currency: string; currencySymbol: string;
    convertedAmount: number; category: string; description: string;
    merchant?: string; expenseDate: string; status: string;
    submittedBy: { name: string; email: string; department?: string };
}

const STATUS_FILTERS = ['', 'pending', 'in_review', 'approved', 'rejected'];
const CATEGORY_EMOJIS: Record<string, string> = {
    travel: '✈️', meals: '🍽️', accommodation: '🏨', equipment: '🖥️',
    software: '💻', training: '📚', medical: '🏥', office_supplies: '📎',
    utilities: '💡', entertainment: '🎭', other: '📋',
};

export default function ExpensesPage() {
    const { user, company } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const limit = 20;

    const fetch_ = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(limit), scope: 'personal' });
            if (status) params.set('status', status);
            const res = await fetch(`/api/expenses?${params}`);
            const d = await res.json();
            if (res.ok) {
                setExpenses(d.data.expenses);
                setTotal(d.data.total);
            }
        } catch { } finally { setIsLoading(false); }
    }, [page, status]);

    useEffect(() => { fetch_(); }, [fetch_]);

    const sym = company?.defaultCurrencySymbol || '$';
    const filtered = expenses.filter(e => {
        if (!search) return true;
        const s = search.toLowerCase();
        return e.description.toLowerCase().includes(s) || e.category.includes(s) || (e.merchant || '').toLowerCase().includes(s);
    });

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold">My Expenses</h1>
                    <p className="text-muted-foreground text-xs sm:text-sm">{total} total</p>
                </div>
                <div className="flex gap-2 items-center">
                    <button onClick={fetch_} className="btn-ghost p-2.5" title="Refresh">
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    {user?.role !== 'manager' && (
                        <Link href="/dashboard/expenses/submit" className="btn-primary">
                            <Plus className="w-4 h-4" />
                            <span className="hidden xs:inline">New Expense</span>
                            <span className="xs:hidden">New</span>
                        </Link>
                    )}
                </div>
            </div>

            {/* Search + Filters */}
            <div className="glass-card p-4 space-y-3">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="text" className="input-field pl-9 py-2.5" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <button onClick={() => setShowFilters(!showFilters)} className={`btn-ghost px-3 gap-1.5 sm:hidden ${showFilters ? 'bg-secondary' : ''}`}>
                        <Filter className="w-4 h-4" />
                        <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* Status filters - always on sm+, toggle on mobile */}
                <div className={`flex gap-1.5 flex-wrap sm:flex ${showFilters ? 'flex' : 'hidden sm:flex'}`}>
                    {STATUS_FILTERS.map(f => (
                        <button key={f} onClick={() => { setStatus(f); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all touch-target min-h-[36px] ${status === f ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary border border-border/30'}`}>
                            {f ? f.replace(/_/g, ' ') : 'All'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="glass-card overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center p-16">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center p-12">
                        <Receipt className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">No expenses found</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile cards */}
                        <div className="sm:hidden divide-y divide-border/20">
                            {filtered.map(e => (
                                <div key={e._id} className="p-4">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="text-xl flex-shrink-0">{CATEGORY_EMOJIS[e.category] || '📋'}</span>
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm truncate">{e.description}</p>
                                                <p className="text-xs text-muted-foreground capitalize">{e.category.replace(/_/g, ' ')}{e.merchant ? ` · ${e.merchant}` : ''}</p>
                                            </div>
                                        </div>
                                        <span className={`badge-${e.status} flex-shrink-0`}>{e.status.replace(/_/g, ' ')}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="font-bold">{e.currencySymbol}{e.amount.toLocaleString()}</span>
                                            {e.currency !== company?.defaultCurrency && (
                                                <span className="text-xs text-muted-foreground ml-1.5">≈ {sym}{e.convertedAmount.toFixed(2)}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">{new Date(e.expenseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                            <Link href={`/dashboard/expenses/${e._id}`} className="btn-ghost px-2.5 py-1.5 text-xs">
                                                <Eye className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop table */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/30 bg-secondary/20">
                                        <th className="table-header text-left px-5 py-3.5">Expense</th>
                                        <th className="table-header text-left px-4 py-3.5">Amount</th>
                                        <th className="table-header text-left px-4 py-3.5">Date</th>
                                        <th className="table-header text-left px-4 py-3.5">Status</th>
                                        {['admin', 'manager'].includes(user?.role || '') && <th className="table-header text-left px-4 py-3.5">Employee</th>}
                                        <th className="table-header text-left px-4 py-3.5">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(e => (
                                        <tr key={e._id} className="table-row">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">{CATEGORY_EMOJIS[e.category] || '📋'}</span>
                                                    <div>
                                                        <p className="font-medium truncate max-w-[180px] lg:max-w-[280px]">{e.description}</p>
                                                        <p className="text-xs text-muted-foreground capitalize">{e.category.replace(/_/g, ' ')}{e.merchant ? ` · ${e.merchant}` : ''}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <p className="font-semibold">{e.currencySymbol}{e.amount.toLocaleString()}</p>
                                                {e.currency !== company?.defaultCurrency && <p className="text-xs text-muted-foreground">≈ {sym}{e.convertedAmount.toFixed(2)}</p>}
                                            </td>
                                            <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                                                {new Date(e.expenseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="px-4 py-3.5"><span className={`badge-${e.status}`}>{e.status.replace(/_/g, ' ')}</span></td>
                                            {['admin', 'manager'].includes(user?.role || '') && (
                                                <td className="px-4 py-3.5">
                                                    <p className="text-sm">{e.submittedBy?.name}</p>
                                                    <p className="text-xs text-muted-foreground">{e.submittedBy?.email}</p>
                                                </td>
                                            )}
                                            <td className="px-4 py-3.5">
                                                <Link href={`/dashboard/expenses/${e._id}`} className="btn-ghost px-3 py-2 text-xs">
                                                    <Eye className="w-3.5 h-3.5" /> View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {total > limit && (
                            <div className="flex flex-col xs:flex-row items-center justify-between gap-2 px-4 sm:px-5 py-3 border-t border-border/30">
                                <p className="text-xs sm:text-sm text-muted-foreground">Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</p>
                                <div className="flex gap-2">
                                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-50">← Prev</button>
                                    <button onClick={() => setPage(p => p + 1)} disabled={page * limit >= total} className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-50">Next →</button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
