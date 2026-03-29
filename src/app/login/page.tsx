'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Loader2, DollarSign, LayoutDashboard, Receipt, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return toast.error('Please fill all fields');
        setIsLoading(true);
        try {
            await login(email, password);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-background">
            {/* Left Panel */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-950 via-slate-900 to-purple-950 p-12 flex-col justify-between">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">ReimburseFlow</span>
                    </div>

                    <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
                        Streamline Your <span className="gradient-text">Expense Management</span>
                    </h1>
                    <p className="text-slate-400 text-lg leading-relaxed mb-12">
                        Multi-level approvals, OCR receipt scanning, and real-time currency conversion — all in one powerful platform.
                    </p>

                    <div className="space-y-6">
                        {[
                            { icon: Receipt, title: 'OCR Receipt Scanning', desc: 'Auto-extract amounts, dates & merchants' },
                            { icon: LayoutDashboard, title: 'Smart Approval Workflows', desc: 'Multi-level with custom rules' },
                            { icon: Users, title: 'Role-Based Access', desc: 'Admin, Manager & Employee roles' },
                        ].map((feature) => (
                            <div key={feature.title} className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                                    <feature.icon className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">{feature.title}</p>
                                    <p className="text-slate-400 text-sm">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10">
                    <div className="glass rounded-2xl p-4">
                        <p className="text-slate-400 text-sm italic">
                            "ReimburseFlow reduced our expense approval time from 5 days to just 4 hours."
                        </p>
                        <p className="text-white text-sm font-medium mt-2">— Finance Director, TechCorp</p>
                    </div>
                </div>
            </div>

            {/* Right Panel */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <div className="flex items-center gap-3 mb-8 lg:hidden">
                        <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-bold">ReimburseFlow</span>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-3xl font-bold mb-2">Welcome back</h2>
                        <p className="text-muted-foreground">Sign in to your account to continue</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium mb-2" htmlFor="email">
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                className="input-field"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" htmlFor="password">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="input-field pr-12"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            id="login-submit"
                            type="submit"
                            className="btn-primary w-full py-3.5 text-base"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign in'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 p-4 rounded-xl bg-secondary/50 border border-border/50">
                        <p className="text-xs text-muted-foreground font-medium mb-2">Demo Credentials</p>
                        <div className="text-xs text-muted-foreground space-y-1">
                            <p>Admin: admin@demo.com / demo1234</p>
                            <p>Manager: manager@demo.com / demo1234</p>
                            <p>Employee: employee@demo.com / demo1234</p>
                        </div>
                    </div>

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Don&apos;t have an account?{' '}
                        <Link href="/signup" className="text-primary hover:underline font-medium">
                            Create one for free
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
