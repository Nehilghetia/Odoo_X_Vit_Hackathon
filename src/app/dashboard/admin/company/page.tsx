'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Save, Loader2, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CompanySettingsPage() {
    const { company, refreshUser } = useAuth();
    const [name, setName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (company) setName(company.name);
    }, [company]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch('/api/company', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            const d = await res.json();
            if (!res.ok) throw new Error(d.error);
            await refreshUser();
            toast.success('Company settings saved!');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-primary" /> Company Settings
                </h1>
                <p className="text-muted-foreground text-sm">Manage your company profile and configuration</p>
            </div>

            <div className="glass-card p-6 space-y-5">
                <div className="flex items-center gap-4 pb-4 border-b border-border/30">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Building2 className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <p className="font-bold text-lg">{company?.name}</p>
                        <p className="text-muted-foreground text-sm">Default: {company?.defaultCurrency} ({company?.defaultCurrencySymbol})</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2" htmlFor="company-name-input">Company Name</label>
                        <input
                            id="company-name-input"
                            type="text"
                            className="input-field"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Country</label>
                            <input
                                type="text"
                                className="input-field opacity-60"
                                value={company?.country || ''}
                                readOnly
                            />
                            <p className="text-xs text-muted-foreground mt-1">Contact support to change</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Default Currency</label>
                            <input
                                type="text"
                                className="input-field opacity-60"
                                value={`${company?.defaultCurrency} (${company?.defaultCurrencySymbol})`}
                                readOnly
                            />
                            <p className="text-xs text-muted-foreground mt-1">Contact support to change</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                        <Globe className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-300">
                            All expenses are converted to {company?.defaultCurrency} for reporting. Exchange rates are updated hourly.
                        </p>
                    </div>

                    <button
                        id="save-company-btn"
                        type="submit"
                        className="btn-primary"
                        disabled={isSaving}
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                </form>
            </div>
        </div>
    );
}
