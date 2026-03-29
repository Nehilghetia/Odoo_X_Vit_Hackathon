'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    ArrowLeft, CheckCircle2, XCircle, Clock, Loader2,
    User, Calendar, Tag, FileText, DollarSign, MessageSquare,
    AlertCircle, Receipt,
} from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORY_EMOJIS: Record<string, string> = {
    travel: '✈️', meals: '🍽️', accommodation: '🏨', equipment: '🖥️',
    software: '💻', training: '📚', medical: '🏥', office_supplies: '📎',
    utilities: '💡', entertainment: '🎭', other: '📋',
};

interface ApprovalStep {
    stepNumber: number;
    role: string;
    label: string;
    status: 'pending' | 'approved' | 'rejected' | 'skipped';
    comment?: string;
    actionAt?: string;
    approverId?: { name: string; email: string };
}

interface TimelineItem {
    action: string;
    comment?: string;
    timestamp: string;
    performedBy?: { name: string; email: string };
}

interface ExpenseDetail {
    _id: string;
    amount: number;
    currency: string;
    currencySymbol: string;
    convertedAmount: number;
    convertedCurrency: string;
    exchangeRate: number;
    category: string;
    description: string;
    merchant?: string;
    expenseDate: string;
    status: string;
    receiptUrl?: string;
    approvalSteps: ApprovalStep[];
    currentApprovalStep: number;
    timeline: TimelineItem[];
    tags?: string[];
    submittedBy: { name: string; email: string; role: string };
    createdAt: string;
}

export default function ExpenseDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, company } = useAuth();
    const [expense, setExpense] = useState<ExpenseDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActing, setIsActing] = useState(false);
    const [comment, setComment] = useState('');
    const [showApprovalForm, setShowApprovalForm] = useState(false);
    const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);

    useEffect(() => {
        fetch(`/api/expenses/${id}`)
            .then((r) => r.json())
            .then((d) => {
                if (d.data?.expense) setExpense(d.data.expense);
            })
            .catch(() => toast.error('Failed to load expense'))
            .finally(() => setIsLoading(false));
    }, [id]);

    const handleAction = async (action: 'approve' | 'reject') => {
        if (action === 'reject' && !comment.trim()) {
            return toast.error('Please provide a reason for rejection');
        }

        setIsActing(true);
        try {
            const res = await fetch(`/api/expenses/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, comment }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setExpense(data.data.expense);
            setShowApprovalForm(false);
            setComment('');
            toast.success(action === 'approve' ? '✅ Expense approved!' : '❌ Expense rejected');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Action failed');
        } finally {
            setIsActing(false);
        }
    };

    const sym = company?.defaultCurrencySymbol || '$';
    const canApprove =
        user &&
        ['admin', 'manager'].includes(user.role) &&
        expense &&
        ['pending', 'in_review'].includes(expense.status);

    const getStepIcon = (status: string) => {
        switch (status) {
            case 'approved': return <CheckCircle2 className="w-5 h-5 text-green-400" />;
            case 'rejected': return <XCircle className="w-5 h-5 text-red-400" />;
            case 'skipped': return <CheckCircle2 className="w-5 h-5 text-blue-400" />;
            default: return <Clock className="w-5 h-5 text-amber-400" />;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!expense) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Expense not found</p>
                <button onClick={() => router.back()} className="btn-secondary mt-4">Go back</button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
            {/* Back */}
            <button onClick={() => router.back()} className="btn-ghost -ml-2 text-sm">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {/* Header card */}
            <div className="glass-card p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-3xl flex-shrink-0">
                            {CATEGORY_EMOJIS[expense.category] || '📋'}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">{expense.description}</h1>
                            <p className="text-muted-foreground text-sm capitalize mt-1">
                                {expense.category.replace(/_/g, ' ')}
                                {expense.merchant && ` · ${expense.merchant}`}
                            </p>
                            <div className="mt-2">
                                <span className={`badge-${expense.status}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                    {expense.status.replace(/_/g, ' ')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-3xl font-bold">
                            {expense.currencySymbol}{expense.amount.toLocaleString()}
                        </p>
                        {expense.currency !== company?.defaultCurrency && (
                            <p className="text-sm text-muted-foreground mt-1">
                                ≈ {sym}{expense.convertedAmount.toFixed(2)} {expense.convertedCurrency}
                                <br />
                                <span className="text-xs">Rate: {expense.exchangeRate.toFixed(4)}</span>
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Details */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="glass-card p-5 space-y-4">
                        <h2 className="font-semibold">Details</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { icon: User, label: 'Submitted By', value: expense.submittedBy?.name },
                                { icon: Calendar, label: 'Expense Date', value: new Date(expense.expenseDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
                                { icon: Tag, label: 'Category', value: expense.category.replace(/_/g, ' '), className: 'capitalize' },
                                { icon: DollarSign, label: 'Currency', value: `${expense.currency} (${expense.currencySymbol})` },
                            ].map((item) => (
                                <div key={item.label} className="flex items-start gap-3">
                                    <item.icon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">{item.label}</p>
                                        <p className={`text-sm font-medium ${item.className || ''}`}>{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {expense.tags && expense.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/30">
                                {expense.tags.map((tag) => (
                                    <span key={tag} className="px-2 py-0.5 rounded-md bg-secondary text-xs text-muted-foreground">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Approval Steps */}
                    <div className="glass-card p-5">
                        <h2 className="font-semibold mb-4 flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-muted-foreground" />
                            Approval Workflow
                        </h2>
                        <div className="space-y-3">
                            {expense.approvalSteps.map((step, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${idx === expense.currentApprovalStep && expense.status === 'pending'
                                            ? 'bg-amber-500/5 border-amber-500/30'
                                            : step.status === 'approved'
                                                ? 'bg-green-500/5 border-green-500/20'
                                                : step.status === 'rejected'
                                                    ? 'bg-red-500/5 border-red-500/20'
                                                    : 'bg-secondary/30 border-border/30'
                                        }`}
                                >
                                    {getStepIcon(step.status)}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium text-sm">
                                                Step {step.stepNumber}: {step.label}
                                            </p>
                                            <span className={`badge-${step.status === 'skipped' ? 'approved' : step.status} text-xs`}>
                                                {step.status}
                                            </span>
                                        </div>
                                        {step.approverId && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                By {step.approverId.name}
                                                {step.actionAt && ` · ${new Date(step.actionAt).toLocaleString()}`}
                                            </p>
                                        )}
                                        {step.comment && (
                                            <div className="mt-2 p-2 bg-black/20 rounded-lg">
                                                <p className="text-xs text-muted-foreground italic">"{step.comment}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Approve / Reject Actions */}
                    {canApprove && !showApprovalForm && (
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setPendingAction('approve'); setShowApprovalForm(true); }}
                                className="btn-primary flex-1"
                            >
                                <CheckCircle2 className="w-4 h-4" /> Approve
                            </button>
                            <button
                                onClick={() => { setPendingAction('reject'); setShowApprovalForm(true); }}
                                className="btn-destructive flex-1"
                            >
                                <XCircle className="w-4 h-4" /> Reject
                            </button>
                        </div>
                    )}

                    {showApprovalForm && (
                        <div className="glass-card p-5 space-y-4 border-2 border-primary/20 animate-fade-in">
                            <h2 className="font-semibold flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-primary" />
                                {pendingAction === 'approve' ? '✅ Approve Expense' : '❌ Reject Expense'}
                            </h2>
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Comment {pendingAction === 'reject' ? '*' : '(optional)'}
                                </label>
                                <textarea
                                    className="input-field resize-none"
                                    rows={3}
                                    placeholder={pendingAction === 'reject' ? 'Please provide a reason for rejection...' : 'Add a note (optional)...'}
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    required={pendingAction === 'reject'}
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setShowApprovalForm(false); setComment(''); }}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => pendingAction && handleAction(pendingAction)}
                                    className={pendingAction === 'approve' ? 'btn-primary flex-1' : 'btn-destructive flex-1'}
                                    disabled={isActing}
                                >
                                    {isActing ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                                    ) : (
                                        `Confirm ${pendingAction === 'approve' ? 'Approval' : 'Rejection'}`
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Timeline */}
                <div className="glass-card p-5">
                    <h2 className="font-semibold mb-4">Activity Timeline</h2>
                    <div className="space-y-0">
                        {expense.timeline.map((item, idx) => (
                            <div key={idx} className="timeline-item">
                                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 z-10">
                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium">{item.action}</p>
                                    {item.performedBy && (
                                        <p className="text-xs text-muted-foreground">{item.performedBy.name}</p>
                                    )}
                                    {item.comment && (
                                        <p className="text-xs text-muted-foreground italic mt-1">"{item.comment}"</p>
                                    )}
                                    <p className="text-xs text-muted-foreground/60 mt-1">
                                        {new Date(item.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
