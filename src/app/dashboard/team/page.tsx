'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Search, Eye, Loader2, RefreshCw } from 'lucide-react';

interface Expense {
    _id: string;
    amount: number;
    currency: string;
    currencySymbol: string;
    convertedAmount: number;
    category: string;
    description: string;
    expenseDate: string;
    status: string;
    submittedBy: { name: string; email: string; department?: string };
    createdAt: string;
}

const CATEGORY_EMOJIS: Record<string, string> = {
    travel: '✈️', meals: '🍽️', accommodation: '🏨', equipment: '🖥️',
    software: '💻', training: '📚', medical: '🏥', office_supplies: '📎',
    utilities: '💡', entertainment: '🎭', other: '📋',
};

export default function TeamExpensesPage() {
    const { company } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');

    const fetchExpenses = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ limit: '50' });
            if (status) params.set('status', status);
            const res = await fetch(`/api/expenses?${params}`);
            const d = await res.json();
            if (res.ok) { setExpenses(d.data.expenses); setTotal(d.data.total); }
        } catch { } finally { setIsLoading(false); }
    };

    useEffect(() => { fetchExpenses(); }, [status]);

    const sym = company?.defaultCurrencySymbol || '$';
    const filtered = expenses.filter((e) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            e.description.toLowerCase().includes(s) ||
            e.submittedBy?.name?.toLowerCase().includes(s) ||
            e.category.toLowerCase().includes(s)
        );
    });

    return (
        <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="w-6 h-6 text-primary" /> Team Expenses
                    </h1>
                    <p className="text-muted-foreground text-sm">{total} total expenses</p>
                </div>
                <button onClick={fetchExpenses} className="btn-ghost p-2.5">
                    <RefreshCw className={isLoading ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} />
                </button>
            </div>

            <div className="glass-card p-4 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        className="input-field pl-10 py-2.5"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide flex-nowrap -mx-1 px-1">
                    {['', 'pending', 'in_review', 'approved', 'rejected'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatus(s)}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap border ${status === s ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-secondary/30 text-muted-foreground hover:bg-secondary/50 border-border/30'}`}
                        >
                            {s ? s.replace(/_/g, ' ') : 'All Status'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : (
                    <div className="overflow-x-auto scrollbar-thin">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/30 bg-secondary/20">
                                    <th className="table-header text-left px-5 py-3.5">Employee</th>
                                    <th className="table-header text-left px-10 py-3.5">Expense</th>
                                    <th className="table-header text-left px-4 py-3.5">Amount</th>
                                    <th className="table-header text-left px-4 py-3.5">Date</th>
                                    <th className="table-header text-left px-4 py-3.5">Status</th>
                                    <th className="table-header text-left px-4 py-3.5 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((e) => (
                                    <tr key={e._id} className="table-row group">
                                        <td className="px-5 py-4 whitespace-nowrap pr-12">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-primary/20 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-xs font-bold text-primary">{e.submittedBy?.name?.charAt(0)}</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-sm leading-tight">{e.submittedBy?.name}</p>
                                                    <p className="text-[11px] text-muted-foreground mt-0.5">{e.submittedBy?.department || e.submittedBy?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-4 min-w-[220px]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center text-xl flex-shrink-0 border border-border/10 group-hover:scale-110 transition-transform">
                                                    {CATEGORY_EMOJIS[e.category] || '📋'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-sm truncate max-w-[140px] sm:max-w-none">{e.description}</p>
                                                    <p className="text-[11px] text-muted-foreground capitalize mt-0.5">{e.category.replace(/_/g, ' ')}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <p className="font-semibold">{e.currencySymbol}{e.amount.toLocaleString()}</p>
                                            {e.currency !== company?.defaultCurrency && (
                                                <p className="text-xs text-muted-foreground">≈ {sym}{e.convertedAmount.toFixed(2)}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                                            {new Date(e.expenseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <span className={`badge-${e.status}`}>{e.status.replace(/_/g, ' ')}</span>
                                        </td>
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
                )}
            </div>
        </div>
    );
}
