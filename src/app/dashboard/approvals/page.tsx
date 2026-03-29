'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
    CheckSquare, Clock, Eye, CheckCircle2, XCircle,
    Loader2, AlertCircle, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Expense {
    _id: string;
    amount: number;
    currency: string;
    currencySymbol: string;
    convertedAmount: number;
    category: string;
    description: string;
    merchant?: string;
    expenseDate: string;
    status: string;
    currentApprovalStep: number;
    approvalSteps: { label: string; role: string; status: string }[];
    submittedBy: { name: string; email: string; department?: string };
    createdAt: string;
}

const CATEGORY_EMOJIS: Record<string, string> = {
    travel: '✈️', meals: '🍽️', accommodation: '🏨', equipment: '🖥️',
    software: '💻', training: '📚', medical: '🏥', office_supplies: '📎',
    utilities: '💡', entertainment: '🎭', other: '📋',
};

export default function ApprovalsPage() {
    const { user, company } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actingId, setActingId] = useState<string | null>(null);

    const fetchPending = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/expenses?status=pending&limit=50');
            const res2 = await fetch('/api/expenses?status=in_review&limit=50');
            const d1 = await res.json();
            const d2 = await res2.json();
            const all = [...(d1.data?.expenses || []), ...(d2.data?.expenses || [])];
            setExpenses(all.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchPending(); }, []);

    const quickAction = async (id: string, action: 'approve' | 'reject', comment?: string) => {
        setActingId(id);
        try {
            const res = await fetch(`/api/expenses/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, comment: comment || (action === 'approve' ? 'Approved' : 'Rejected') }),
            });
            const d = await res.json();
            if (!res.ok) throw new Error(d.error);
            toast.success(action === 'approve' ? '✅ Approved' : '❌ Rejected');
            fetchPending();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Action failed');
        } finally {
            setActingId(null);
        }
    };

    const sym = company?.defaultCurrencySymbol || '$';

    // Filter to only show those requiring current user's role
    const pendingForMe = expenses.filter((e) => {
        if (user?.role === 'admin') return true;
        const currentStep = e.approvalSteps[e.currentApprovalStep];
        return currentStep && currentStep.role === user?.role;
    });

    return (
        <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <CheckSquare className="w-6 h-6 text-primary" />
                        Approval Queue
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {pendingForMe.length} expense{pendingForMe.length !== 1 ? 's' : ''} awaiting your review
                    </p>
                </div>
                <button onClick={fetchPending} className="btn-ghost p-2.5" title="Refresh">
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : pendingForMe.length === 0 ? (
                <div className="glass-card p-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-400" />
                    </div>
                    <p className="text-xl font-semibold mb-2">All caught up!</p>
                    <p className="text-muted-foreground">No expenses pending your review.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {pendingForMe.map((expense) => {
                        const currentStep = expense.approvalSteps[expense.currentApprovalStep];
                        const isActing_ = actingId === expense._id;
                        const daysOld = Math.floor(
                            (Date.now() - new Date(expense.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                        );

                        return (
                            <div
                                key={expense._id}
                                className={`glass-card p-5 hover:border-primary/30 transition-all duration-200 ${daysOld >= 3 ? 'border-amber-500/30' : ''
                                    }`}
                            >
                                <div className="flex flex-col sm:flex-row gap-4">
                                    {/* Left */}
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl flex-shrink-0">
                                            {CATEGORY_EMOJIS[expense.category] || '📋'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold truncate">{expense.description}</p>
                                            <p className="text-sm text-muted-foreground capitalize">
                                                {expense.category.replace(/_/g, ' ')}
                                                {expense.merchant && ` · ${expense.merchant}`}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                                                <span className="font-bold text-lg">
                                                    {expense.currencySymbol}{expense.amount.toLocaleString()}
                                                </span>
                                                {expense.currency !== company?.defaultCurrency && (
                                                    <span className="text-muted-foreground text-xs">
                                                        ≈ {sym}{expense.convertedAmount.toFixed(2)}
                                                    </span>
                                                )}
                                                <span className="text-muted-foreground text-xs">
                                                    {new Date(expense.expenseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <span className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                                        {expense.submittedBy?.name?.charAt(0)}
                                                    </span>
                                                    {expense.submittedBy?.name}
                                                </span>
                                                {daysOld >= 3 && (
                                                    <span className="badge-pending text-xs flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" />
                                                        {daysOld}d waiting
                                                    </span>
                                                )}
                                                {currentStep && (
                                                    <span className="badge-in_review text-xs">
                                                        Step {currentStep.role}: {currentStep.label}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: actions */}
                                    <div className="flex sm:flex-col gap-2 sm:w-36 flex-shrink-0">
                                        <Link
                                            href={`/dashboard/expenses/${expense._id}`}
                                            className="btn-secondary text-xs px-3 py-2 flex-1 sm:w-full"
                                        >
                                            <Eye className="w-3.5 h-3.5" /> Details
                                        </Link>
                                        <button
                                            onClick={() => quickAction(expense._id, 'approve')}
                                            disabled={isActing_}
                                            className="btn-primary text-xs px-3 py-2 flex-1 sm:w-full bg-green-600 hover:bg-green-500"
                                        >
                                            {isActing_ ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                            )}
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => quickAction(expense._id, 'reject', 'Rejected by reviewer')}
                                            disabled={isActing_}
                                            className="btn-destructive text-xs px-3 py-2 flex-1 sm:w-full"
                                        >
                                            {isActing_ ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <XCircle className="w-3.5 h-3.5" />
                                            )}
                                            Reject
                                        </button>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                {expense.approvalSteps.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-border/30">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                            <span className="text-xs text-muted-foreground">
                                                Approval Progress: Step {expense.currentApprovalStep + 1} of {expense.approvalSteps.length}
                                            </span>
                                        </div>
                                        <div className="flex gap-1">
                                            {expense.approvalSteps.map((step, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`h-1.5 flex-1 rounded-full transition-all ${step.status === 'approved' || step.status === 'skipped'
                                                            ? 'bg-green-500'
                                                            : step.status === 'rejected'
                                                                ? 'bg-red-500'
                                                                : idx === expense.currentApprovalStep
                                                                    ? 'bg-amber-500'
                                                                    : 'bg-secondary'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
