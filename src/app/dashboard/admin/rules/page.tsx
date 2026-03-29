'use client';

import { useState, useEffect } from 'react';
import {
    Settings, Save, Plus, Trash2, Loader2, Info,
    GripVertical, ArrowRight, Percent, User, GitMerge,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface WorkflowStep {
    step: number;
    role: string;
    label: string;
}

interface ApprovalRules {
    type: 'percentage' | 'specific_role' | 'hybrid';
    percentage?: number;
    specificApproverRole?: string;
    description?: string;
}

interface Company {
    name: string;
    defaultCurrency: string;
    approvalWorkflow: WorkflowStep[];
    approvalRules: ApprovalRules;
}

const ROLES_OPTIONS = [
    { value: 'manager', label: 'Manager' },
    { value: 'admin', label: 'Admin' },
    { value: 'employee', label: 'Employee (Peer)' },
];

export default function AdminRulesPage() {
    const [company, setCompany] = useState<Company | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [workflow, setWorkflow] = useState<WorkflowStep[]>([]);
    const [rules, setRules] = useState<ApprovalRules>({ type: 'percentage', percentage: 100 });

    useEffect(() => {
        fetch('/api/company')
            .then((r) => r.json())
            .then((d) => {
                if (d.data?.company) {
                    setCompany(d.data.company);
                    setWorkflow(d.data.company.approvalWorkflow || []);
                    setRules(d.data.company.approvalRules || { type: 'percentage', percentage: 100 });
                }
            })
            .catch(() => toast.error('Failed to load company settings'))
            .finally(() => setIsLoading(false));
    }, []);

    const addStep = () => {
        setWorkflow((w) => [
            ...w,
            { step: w.length + 1, role: 'manager', label: `Step ${w.length + 1} Approval` },
        ]);
    };

    const removeStep = (idx: number) => {
        setWorkflow((w) => w.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step: i + 1 })));
    };

    const updateStep = (idx: number, field: string, value: string) => {
        setWorkflow((w) => w.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
    };

    const save = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/company', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ approvalWorkflow: workflow, approvalRules: rules }),
            });
            const d = await res.json();
            if (!res.ok) throw new Error(d.error);
            toast.success('Settings saved!');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                        <Settings className="w-6 h-6 text-primary" /> Approval Rules
                    </h1>
                    <p className="text-muted-foreground text-sm">Configure the multi-level approval workflow</p>
                </div>
                <button
                    id="save-rules-btn"
                    onClick={save}
                    className="btn-primary w-full sm:w-auto"
                    disabled={isSaving}
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </button>
            </div>

            {/* Workflow Builder */}
            <div className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-semibold text-lg">Approval Workflow</h2>
                        <p className="text-muted-foreground text-sm">Define the sequential approval steps</p>
                    </div>
                    <button onClick={addStep} className="btn-secondary text-sm">
                        <Plus className="w-4 h-4" /> Add Step
                    </button>
                </div>

                {workflow.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No approval steps configured.</p>
                        <p className="text-sm mt-1">Add steps below to define your workflow.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {workflow.map((step, idx) => (
                            <div key={idx} className="flex items-center gap-3 group">
                                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1 p-4 bg-secondary/30 rounded-xl border border-border/30 hover:border-border transition-colors min-w-0">
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <GripVertical className="w-4 h-4 text-muted-foreground opacity-30 flex-shrink-0" />
                                        <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
                                            <span className="text-sm font-bold text-primary">{step.step}</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
                                        <div className="space-y-1.5">
                                            <label className="block text-[11px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-0.5">Step Label</label>
                                            <input
                                                type="text"
                                                className="input-field py-2.5 text-sm"
                                                value={step.label}
                                                onChange={(e) => updateStep(idx, 'label', e.target.value)}
                                                placeholder="e.g. Manager Approval"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[11px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-0.5">Required Role</label>
                                            <select
                                                className="input-field py-2.5 text-sm appearance-none"
                                                value={step.role}
                                                onChange={(e) => updateStep(idx, 'role', e.target.value)}
                                            >
                                                {ROLES_OPTIONS.map((r) => (
                                                    <option key={r.value} value={r.value}>{r.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {idx < workflow.length - 1 && (
                                        <ArrowRight className="hidden lg:block w-4 h-4 text-muted-foreground/30 flex-shrink-0" />
                                    )}
                                </div>

                                <button
                                    onClick={() => removeStep(idx)}
                                    className="btn-ghost p-2.5 text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Approval Rules */}
            <div className="glass-card p-6 space-y-5">
                <div>
                    <h2 className="font-semibold text-lg">Conditional Approval Rules</h2>
                    <p className="text-muted-foreground text-sm">Define how approvals are determined</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                        { type: 'percentage', label: 'Percentage Rule', icon: Percent, desc: 'X% of approvers must approve' },
                        { type: 'specific_role', label: 'Specific Approver', icon: User, desc: 'CFO approval = auto-approved' },
                        { type: 'hybrid', label: 'Hybrid Rule', icon: GitMerge, desc: 'Combine both conditions' },
                    ].map((r) => (
                        <button
                            key={r.type}
                            onClick={() => setRules((prev) => ({ ...prev, type: r.type as ApprovalRules['type'] }))}
                            className={`flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all ${rules.type === r.type
                                ? 'bg-primary/15 border-primary/50 text-primary'
                                : 'bg-secondary/30 border-border/30 text-muted-foreground hover:border-border hover:text-foreground'
                                }`}
                        >
                            <r.icon className="w-5 h-5" />
                            <span className="font-medium text-sm">{r.label}</span>
                            <span className="text-xs opacity-70">{r.desc}</span>
                        </button>
                    ))}
                </div>

                {/* Rule configuration */}
                {rules.type === 'percentage' || rules.type === 'hybrid' ? (
                    <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                            <Percent className="w-3.5 h-3.5" />
                            Required Approval Percentage
                        </label>
                        <div className="flex items-center gap-3 sm:gap-4">
                            <input
                                type="range"
                                min={0}
                                max={100}
                                step={10}
                                value={rules.percentage ?? 100}
                                onChange={(e) => setRules((r) => ({ ...r, percentage: parseInt(e.target.value) }))}
                                className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <div className="flex-shrink-0 w-14 sm:w-16 text-right">
                                <span className="text-xl sm:text-2xl font-bold text-primary">{rules.percentage}%</span>
                            </div>
                        </div>
                        <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground mt-2 px-1">
                            <span>Any 1 approver</span>
                            <span>All required</span>
                        </div>
                    </div>
                ) : null}

                {rules.type === 'specific_role' || rules.type === 'hybrid' ? (
                    <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            Auto-approve when this role approves
                        </label>
                        <select
                            className="input-field appearance-none"
                            value={rules.specificApproverRole || ''}
                            onChange={(e) => setRules((r) => ({ ...r, specificApproverRole: e.target.value }))}
                        >
                            <option value="">Select role...</option>
                            {ROLES_OPTIONS.map((r) => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </div>
                ) : null}

                <div>
                    <label className="block text-sm font-medium mb-2">Description (optional)</label>
                    <textarea
                        className="input-field resize-none text-sm"
                        rows={2}
                        placeholder="Describe this rule for your team..."
                        value={rules.description || ''}
                        onChange={(e) => setRules((r) => ({ ...r, description: e.target.value }))}
                    />
                </div>

                <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-300">
                        {rules.type === 'percentage' && `Expenses are automatically approved when ${rules.percentage}% of required approvers have approved.`}
                        {rules.type === 'specific_role' && `If the ${rules.specificApproverRole} approves, all remaining steps are automatically skipped and the expense is approved.`}
                        {rules.type === 'hybrid' && `Either when ${rules.percentage}% of approvers have approved OR when the ${rules.specificApproverRole || 'specific approver'} approves.`}
                    </p>
                </div>
            </div>
        </div>
    );
}
