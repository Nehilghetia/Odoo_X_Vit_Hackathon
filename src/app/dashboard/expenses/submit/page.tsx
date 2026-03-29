'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import OCRScanner from '@/components/expenses/OCRScanner';
import toast from 'react-hot-toast';
import {
    Receipt, Loader2, ChevronDown, Info, ArrowRight,
    Calendar, Tag, FileText, Hash, RotateCcw,
} from 'lucide-react';

const CATEGORIES = [
    { value: 'travel', label: 'Travel', emoji: '✈️' },
    { value: 'meals', label: 'Meals & Food', emoji: '🍽️' },
    { value: 'accommodation', label: 'Accommodation', emoji: '🏨' },
    { value: 'equipment', label: 'Equipment', emoji: '🖥️' },
    { value: 'software', label: 'Software & Tools', emoji: '💻' },
    { value: 'training', label: 'Training & Education', emoji: '📚' },
    { value: 'medical', label: 'Medical', emoji: '🏥' },
    { value: 'office_supplies', label: 'Office Supplies', emoji: '📎' },
    { value: 'utilities', label: 'Utilities', emoji: '💡' },
    { value: 'entertainment', label: 'Entertainment', emoji: '🎭' },
    { value: 'other', label: 'Other', emoji: '📋' },
];

interface Currency {
    code: string;
    name: string;
    symbol: string;
    country: string;
    flag: string;
}

export default function SubmitExpensePage() {
    const { user, company } = useAuth();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
    const [isConverting, setIsConverting] = useState(false);

    const [form, setForm] = useState({
        amount: '',
        currency: company?.defaultCurrency || 'USD',
        category: '',
        description: '',
        merchant: '',
        expenseDate: new Date().toISOString().split('T')[0],
        tags: '',
    });

    const [receiptFile, setReceiptFile] = useState<File | null>(null);

    useEffect(() => {
        if (company) {
            setForm((f) => ({ ...f, currency: company.defaultCurrency }));
        }
    }, [company]);

    useEffect(() => {
        fetch('/api/currencies')
            .then((r) => r.json())
            .then((d) => {
                if (d.data?.currencies) setCurrencies(d.data.currencies);
            })
            .catch(() => { });
    }, []);

    // Auto-convert when amount or currency changes
    useEffect(() => {
        if (!form.amount || !company) return;
        if (form.currency === company.defaultCurrency) {
            setConvertedAmount(parseFloat(form.amount));
            return;
        }

        const timeout = setTimeout(async () => {
            setIsConverting(true);
            try {
                const res = await fetch(
                    `/api/exchange?base=${form.currency}&to=${company.defaultCurrency}&amount=${form.amount}`
                );
                const d = await res.json();
                if (d.data?.convertedAmount) setConvertedAmount(d.data.convertedAmount);
            } catch { }
            setIsConverting(false);
        }, 600);

        return () => clearTimeout(timeout);
    }, [form.amount, form.currency, company]);

    const handleOCRResult = (result: { amount?: string; date?: string; merchant?: string; category?: string; description?: string; tags?: string; }) => {
        setForm((f) => ({
            ...f,
            ...(result.amount ? { amount: result.amount } : {}),
            ...(result.date ? { expenseDate: result.date } : {}),
            ...(result.merchant ? { merchant: result.merchant } : {}),
            ...(result.category ? { category: result.category } : {}),
            ...(result.description ? { description: result.description } : {}),
            ...(result.tags ? { tags: result.tags } : {}),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.amount || !form.category || !form.description) {
            return toast.error('Please fill required fields');
        }

        setIsSubmitting(true);
        try {
            const selectedCurrency = currencies.find((c) => c.code === form.currency);
            const symbol = selectedCurrency?.symbol || form.currency;

            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    currencySymbol: symbol,
                    tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Submission failed');

            toast.success('Expense submitted successfully!');
            router.push('/dashboard/expenses');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to submit expense');
        } finally {
            setIsSubmitting(false);
        }
    };

    const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

    const selectedCurrency = currencies.find((c) => c.code === form.currency);
    const sym = company?.defaultCurrencySymbol || '$';

    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Submit Expense</h1>
                    <p className="text-muted-foreground text-sm">Upload receipt for OCR auto-fill or enter details manually</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* OCR Scanner */}
                <div className="glass-card p-5">
                    <h2 className="font-semibold mb-1 flex items-center gap-2">
                        <span className="text-blue-400">📷</span> Receipt Upload (OCR)
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">Auto-extract details from your receipt</p>
                    <OCRScanner
                        onResult={handleOCRResult}
                        onFileSelect={setReceiptFile}
                    />
                </div>

                {/* Amount & Currency */}
                <div className="glass-card p-5 space-y-4">
                    <h2 className="font-semibold flex items-center gap-2">
                        <span className="text-green-400">💰</span> Amount & Currency
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium mb-2">Amount *</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                                    {selectedCurrency?.symbol || form.currency}
                                </span>
                                <input
                                    id="expense-amount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="input-field pl-10"
                                    placeholder="0.00"
                                    value={form.amount}
                                    onChange={(e) => update('amount', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Currency *</label>
                            <div className="relative">
                                <select
                                    id="expense-currency"
                                    className="input-field appearance-none pr-8"
                                    value={form.currency}
                                    onChange={(e) => update('currency', e.target.value)}
                                >
                                    {currencies.length > 0
                                        ? currencies.map((c) => (
                                            <option key={c.code} value={c.code}>
                                                {c.flag} {c.code}
                                            </option>
                                        ))
                                        : <option value={form.currency}>{form.currency}</option>
                                    }
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Conversion preview */}
                    {form.amount && company && form.currency !== company.defaultCurrency && (
                        <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-xl text-sm border border-blue-500/20">
                            <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            {isConverting ? (
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <RotateCcw className="w-3.5 h-3.5 animate-spin" /> Converting...
                                </span>
                            ) : convertedAmount !== null ? (
                                <span className="text-blue-300">
                                    <span className="font-semibold">{selectedCurrency?.symbol || form.currency}{form.amount}</span>
                                    <ArrowRight className="w-4 h-4 inline mx-1" />
                                    <span className="font-semibold">{sym}{convertedAmount.toFixed(2)} {company.defaultCurrency}</span>
                                </span>
                            ) : null}
                        </div>
                    )}
                </div>

                {/* Details */}
                <div className="glass-card p-5 space-y-4">
                    <h2 className="font-semibold flex items-center gap-2">
                        <span className="text-purple-400"><FileText className="w-4 h-4 inline" /></span> Expense Details
                    </h2>

                    <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5" /> Category *
                        </label>
                        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2">
                            {CATEGORIES.map((c) => (
                                <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => update('category', c.value)}
                                    className={`flex items-center gap-1.5 px-2 py-2.5 rounded-xl transition-all border text-left group ${form.category === c.value
                                        ? 'bg-primary/15 border-primary/50 text-primary'
                                        : 'bg-secondary/40 border-border/20 text-muted-foreground hover:border-border/50 hover:bg-secondary/60'
                                        }`}
                                >
                                    <span className="text-base flex-shrink-0 opacity-90 group-hover:scale-110 transition-transform">{c.emoji}</span>
                                    <span className="font-medium text-[10px] sm:text-xs truncate">{c.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2" htmlFor="description">
                            Description *
                        </label>
                        <textarea
                            id="description"
                            className="input-field resize-none"
                            rows={3}
                            placeholder="What was this expense for?"
                            value={form.description}
                            onChange={(e) => update('description', e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2" htmlFor="merchant">
                                Merchant / Vendor
                            </label>
                            <input
                                id="merchant"
                                type="text"
                                className="input-field"
                                placeholder="e.g. Uber, Amazon"
                                value={form.merchant}
                                onChange={(e) => update('merchant', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 flex items-center gap-1" htmlFor="expense-date">
                                <Calendar className="w-3.5 h-3.5" /> Expense Date *
                            </label>
                            <input
                                id="expense-date"
                                type="date"
                                className="input-field"
                                value={form.expenseDate}
                                onChange={(e) => update('expenseDate', e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-1" htmlFor="tags">
                            <Hash className="w-3.5 h-3.5" /> Tags <span className="text-muted-foreground font-normal">(optional, comma-separated)</span>
                        </label>
                        <input
                            id="tags"
                            type="text"
                            className="input-field"
                            placeholder="e.g. client-visit, q1, marketing"
                            value={form.tags}
                            onChange={(e) => update('tags', e.target.value)}
                        />
                    </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        className="btn-secondary flex-1"
                        onClick={() => router.back()}
                    >
                        Cancel
                    </button>
                    <button
                        id="submit-expense-btn"
                        type="submit"
                        className="btn-primary flex-1 py-3.5 text-base"
                        disabled={isSubmitting || !form.amount || !form.category || !form.description}
                    >
                        {isSubmitting ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
                        ) : (
                            <><Receipt className="w-5 h-5" /> Submit for Approval</>
                        )}
                    </button>
                </div>

                {receiptFile && (
                    <p className="text-xs text-center text-muted-foreground">
                        📎 Receipt: {receiptFile.name} ({(receiptFile.size / 1024).toFixed(1)} KB)
                    </p>
                )}
            </form>
        </div>
    );
}
