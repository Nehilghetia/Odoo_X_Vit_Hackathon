'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'employee';
    department?: string;
    avatar?: string;
    companyId: string;
    managerId?: { _id: string; name: string; email: string };
}

export interface Company {
    id: string;
    name: string;
    country: string;
    defaultCurrency: string;
    defaultCurrencySymbol: string;
    approvalWorkflow: { step: number; role: string; label: string }[];
}

interface AuthContextType {
    user: User | null;
    company: Company | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (data: SignupData) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

interface SignupData {
    companyName: string;
    country: string;
    currency: string;
    currencySymbol: string;
    name: string;
    email: string;
    password: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [company, setCompany] = useState<Company | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const refreshUser = useCallback(async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const { data } = await res.json();
                setUser({ ...data.user, id: data.user.id || data.user._id });
                setCompany({ ...data.company, id: data.company.id || data.company._id });
            } else {
                setUser(null);
                setCompany(null);
            }
        } catch {
            setUser(null);
            setCompany(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const login = async (email: string, password: string) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');

        await refreshUser();
        toast.success('Welcome back!');
        router.push('/dashboard');
    };

    const signup = async (formData: SignupData) => {
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');

        await refreshUser();
        toast.success('Company created successfully!');
        router.push('/dashboard');
    };

    const logout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        setCompany(null);
        toast.success('Logged out');
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, company, isLoading, login, signup, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
