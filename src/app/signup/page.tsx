'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Loader2, DollarSign, ChevronDown, Building2, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

interface CountryCurrency {
    code: string;
    name: string;
    symbol: string;
    country: string;
    flag: string;
}

const POPULAR_COUNTRIES = [
    { name: 'United States', currency: 'USD', symbol: '$', flag: '🇺🇸' },
    { name: 'United Kingdom', currency: 'GBP', symbol: '£', flag: '🇬🇧' },
    { name: 'European Union', currency: 'EUR', symbol: '€', flag: '🇪🇺' },
    { name: 'India', currency: 'INR', symbol: '₹', flag: '🇮🇳' },
    { name: 'Canada', currency: 'CAD', symbol: 'CA$', flag: '🇨🇦' },
    { name: 'Australia', currency: 'AUD', symbol: 'A$', flag: '🇦🇺' },
    { name: 'Japan', currency: 'JPY', symbol: '¥', flag: '🇯🇵' },
    { name: 'Singapore', currency: 'SGD', symbol: 'S$', flag: '🇸🇬' },
    { name: 'UAE', currency: 'AED', symbol: 'د.إ', flag: '🇦🇪' },
];

export default function SignupPage() {
    const { signup } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [currencies, setCurrencies] = useState<CountryCurrency[]>([]);
    const [step, setStep] = useState(1); // 1: Company, 2: Admin

    const [form, setForm] = useState({
        companyName: '',
        country: 'United States',
        currency: 'USD',
        currencySymbol: '$',
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    useEffect(() => {
        fetch('/api/currencies')
            .then((r) => r.json())
            .then((d) => {
                if (d.data?.currencies) setCurrencies(d.data.currencies);
            })
            .catch(() => { });
    }, []);

    const handleCountrySelect = (country: (typeof POPULAR_COUNTRIES)[0]) => {
        setForm((f) => ({
            ...f,
            country: country.name,
            currency: country.currency,
            currencySymbol: country.symbol,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
        if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
        setIsLoading(true);
        try {
            await signup({
                companyName: form.companyName,
                country: form.country,
                currency: form.currency,
                currencySymbol: form.currencySymbol,
                name: form.name,
                email: form.email,
                password: form.password,
            });
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    const update = (field: string, value: string) =>
        setForm((f) => ({ ...f, [field]: value }));

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-2xl relative z-10">
                <div className="text-center mb-8">
                    <div className="flex items-center gap-3 justify-center mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                            <DollarSign className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-2xl font-bold">ReimburseFlow</span>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Create your workspace</h1>
                    <p className="text-muted-foreground">Set up your company and admin account</p>
                </div>

                {/* Step indicators */}
                <div className="flex items-center gap-4 justify-center mb-8">
                    {[
                        { num: 1, label: 'Company Setup', icon: Building2 },
                        { num: 2, label: 'Admin Account', icon: Globe },
                    ].map((s) => (
                        <div key={s.num} className="flex items-center gap-2">
                            <div
                                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all ${step === s.num
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                    : step > s.num
                                        ? 'bg-green-500 text-white'
                                        : 'bg-secondary text-muted-foreground'
                                    }`}
                            >
                                {step > s.num ? '✓' : s.num}
                            </div>
                            <span className={`text-sm font-medium ${step === s.num ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {s.label}
                            </span>
                            {s.num < 2 && <div className="w-12 h-px bg-border ml-2" />}
                        </div>
                    ))}
                </div>

                <div className="glass-card p-8">
                    <form onSubmit={handleSubmit}>
                        {step === 1 && (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Company Name *</label>
                                    <input
                                        id="company-name"
                                        type="text"
                                        className="input-field"
                                        placeholder="Acme Corporation"
                                        value={form.companyName}
                                        onChange={(e) => update('companyName', e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-3">Country & Default Currency *</label>
                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        {POPULAR_COUNTRIES.map((c) => (
                                            <button
                                                key={c.currency}
                                                type="button"
                                                onClick={() => handleCountrySelect(c)}
                                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all border ${form.currency === c.currency
                                                    ? 'bg-primary/15 border-primary/50 text-primary'
                                                    : 'bg-secondary/50 border-border/30 text-muted-foreground hover:border-border'
                                                    }`}
                                            >
                                                <span className="text-base">{c.flag}</span>
                                                <div className="text-left">
                                                    <div className="font-medium text-xs">{c.currency}</div>
                                                    <div className="text-xs opacity-70">{c.symbol}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    {currencies.length > 0 && (
                                        <div className="relative">
                                            <select
                                                className="input-field appearance-none pr-10"
                                                value={form.currency}
                                                onChange={(e) => {
                                                    const selected = currencies.find((c) => c.code === e.target.value);
                                                    if (selected) {
                                                        setForm((f) => ({
                                                            ...f,
                                                            currency: selected.code,
                                                            currencySymbol: selected.symbol,
                                                            country: selected.country,
                                                        }));
                                                    }
                                                }}
                                            >
                                                {currencies.map((c) => (
                                                    <option key={c.code} value={c.code}>
                                                        {c.code} — {c.name} ({c.symbol})
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                        </div>
                                    )}

                                    {form.currency && (
                                        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                                            <span className="text-blue-400">✓</span>
                                            Selected: <span className="text-foreground font-medium">{form.currency} ({form.currencySymbol}) — {form.country}</span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    className="btn-primary w-full py-3.5"
                                    onClick={() => {
                                        if (!form.companyName || !form.currency) return toast.error('Please fill all fields');
                                        setStep(2);
                                    }}
                                >
                                    Continue to Admin Setup →
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-5 animate-fade-in">
                                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300 flex items-start gap-3 overflow-hidden">
                                    <Building2 className="w-4 h-4 mt-0.5 flex-shrink-0 opacity-70" />
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1.5 min-w-0">
                                        <div className="flex items-baseline gap-1.5 min-w-0">
                                            <span className="text-[11px] uppercase tracking-wider opacity-60 flex-shrink-0">Company</span>
                                            <span className="font-medium text-blue-100 break-all">{form.companyName}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[11px] uppercase tracking-wider opacity-60 flex-shrink-0">Currency</span>
                                            <span className="font-medium text-blue-100">{form.currency}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Full Name *</label>
                                        <input
                                            id="admin-name"
                                            type="text"
                                            className="input-field"
                                            placeholder="John Smith"
                                            value={form.name}
                                            onChange={(e) => update('name', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Email Address *</label>
                                        <input
                                            id="admin-email"
                                            type="email"
                                            className="input-field"
                                            placeholder="admin@company.com"
                                            value={form.email}
                                            onChange={(e) => update('email', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Password *</label>
                                        <div className="relative">
                                            <input
                                                id="admin-password"
                                                type={showPassword ? 'text' : 'password'}
                                                className="input-field pr-12"
                                                placeholder="Min. 8 characters"
                                                value={form.password}
                                                onChange={(e) => update('password', e.target.value)}
                                                required
                                                minLength={8}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Confirm Password *</label>
                                        <input
                                            id="confirm-password"
                                            type="password"
                                            className="input-field"
                                            placeholder="Repeat password"
                                            value={form.confirmPassword}
                                            onChange={(e) => update('confirmPassword', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-2">
                                    <button type="button" className="btn-secondary flex-1" onClick={() => setStep(1)}>
                                        ← Back
                                    </button>
                                    <button
                                        id="signup-submit"
                                        type="submit"
                                        className="btn-primary flex-1 py-3.5"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <><Loader2 className="w-5 h-5 animate-spin" /> Creating workspace...</>
                                        ) : (
                                            'Create Workspace 🚀'
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/login" className="text-primary hover:underline font-medium">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
