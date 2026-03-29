'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    Users, Plus, Search, Edit2, Trash2, Loader2,
    Check, X, ChevronDown, UserCheck, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
    _id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'employee';
    department?: string;
    isActive: boolean;
    createdAt: string;
    managerId?: { _id: string; name: string; email: string };
}

const ROLES: { value: string; label: string }[] = [
    { value: 'admin', label: 'Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'employee', label: 'Employee' },
];

function CreateUserModal({
    isOpen, onClose, onCreated, managers,
}: {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
    managers: User[];
}) {
    const [form, setForm] = useState({
        name: '', email: '', password: '', role: 'employee', department: '', managerId: '',
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const d = await res.json();
            if (!res.ok) throw new Error(d.error);
            toast.success('User created successfully!');
            onCreated();
            onClose();
            setForm({ name: '', email: '', password: '', role: 'employee', department: '', managerId: '' });
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to create user');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-md p-6 animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold">Create New User</h2>
                    <button onClick={onClose} className="btn-ghost p-2">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {[
                        { id: 'new-name', label: 'Full Name *', field: 'name', type: 'text', placeholder: 'John Smith' },
                        { id: 'new-email', label: 'Email *', field: 'email', type: 'email', placeholder: 'john@company.com' },
                        { id: 'new-password', label: 'Password *', field: 'password', type: 'password', placeholder: 'min. 8 characters' },
                        { id: 'new-department', label: 'Department', field: 'department', type: 'text', placeholder: 'Engineering, Finance...' },
                    ].map((field) => (
                        <div key={field.id}>
                            <label className="block text-sm font-medium mb-2" htmlFor={field.id}>{field.label}</label>
                            <input
                                id={field.id}
                                type={field.type}
                                className="input-field"
                                placeholder={field.placeholder}
                                value={form[field.field as keyof typeof form]}
                                onChange={(e) => setForm((f) => ({ ...f, [field.field]: e.target.value }))}
                                required={field.label.includes('*')}
                                minLength={field.field === 'password' ? 8 : undefined}
                            />
                        </div>
                    ))}

                    <div>
                        <label className="block text-sm font-medium mb-2" htmlFor="new-role">Role *</label>
                        <div className="relative">
                            <select
                                id="new-role"
                                className="input-field appearance-none pr-8"
                                value={form.role}
                                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                            >
                                {ROLES.map((r) => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>

                    {form.role === 'employee' && managers.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium mb-2" htmlFor="new-manager">Manager</label>
                            <div className="relative">
                                <select
                                    id="new-manager"
                                    className="input-field appearance-none pr-8"
                                    value={form.managerId}
                                    onChange={(e) => setForm((f) => ({ ...f, managerId: e.target.value }))}
                                >
                                    <option value="">No manager assigned</option>
                                    {managers.map((m) => (
                                        <option key={m._id} value={m._id}>{m.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" className="btn-primary flex-1" disabled={isLoading}>
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                            Create User
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AdminUsersPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [editingRole, setEditingRole] = useState<string | null>(null);
    const [editRole, setEditRole] = useState('');

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/users');
            const d = await res.json();
            if (res.ok) setUsers(d.data.users);
        } catch { } finally { setIsLoading(false); }
    };

    useEffect(() => { fetchUsers(); }, []);

    const updateRole = async (userId: string, role: string) => {
        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role }),
            });
            const d = await res.json();
            if (!res.ok) throw new Error(d.error);
            toast.success('Role updated!');
            setEditingRole(null);
            fetchUsers();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to update role');
        }
    };

    const deactivate = async (userId: string) => {
        if (!confirm('Deactivate this user?')) return;
        try {
            const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
            const d = await res.json();
            if (!res.ok) throw new Error(d.error);
            toast.success('User deactivated');
            fetchUsers();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed');
        }
    };

    const managers = users.filter((u) => u.role === 'manager' && u.isActive);
    const filtered = users.filter((u) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
    });

    return (
        <>
            <div className="space-y-5 animate-fade-in">
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Users className="w-6 h-6 text-primary" /> User Management
                        </h1>
                        <p className="text-muted-foreground text-sm">{users.length} total users</p>
                    </div>
                    <button
                        id="create-user-btn"
                        onClick={() => setShowCreate(true)}
                        className="btn-primary"
                    >
                        <Plus className="w-4 h-4" /> Add User
                    </button>
                </div>

                <div className="glass-card p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            className="input-field pl-10 py-2.5"
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="glass-card overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-48">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/30 bg-secondary/20">
                                        <th className="table-header text-left px-5 py-3.5">User</th>
                                        <th className="table-header text-left px-4 py-3.5">Role</th>
                                        <th className="table-header text-left px-4 py-3.5">Department</th>
                                        <th className="table-header text-left px-4 py-3.5">Manager</th>
                                        <th className="table-header text-left px-4 py-3.5">Status</th>
                                        <th className="table-header text-left px-4 py-3.5">Joined</th>
                                        <th className="table-header text-left px-4 py-3.5">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((u) => (
                                        <tr key={u._id} className={`table-row ${!u.isActive ? 'opacity-50' : ''}`}>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-sm font-bold text-white">
                                                            {u.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{u.name}</p>
                                                        <p className="text-xs text-muted-foreground">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                {editingRole === u._id ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <select
                                                            value={editRole}
                                                            onChange={(e) => setEditRole(e.target.value)}
                                                            className="input-field py-1.5 px-2 text-xs"
                                                        >
                                                            {ROLES.map((r) => (
                                                                <option key={r.value} value={r.value}>{r.label}</option>
                                                            ))}
                                                        </select>
                                                        <button onClick={() => updateRole(u._id, editRole)} className="p-1.5 text-green-400 hover:text-green-300">
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => setEditingRole(null)} className="p-1.5 text-muted-foreground hover:text-foreground">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className={`badge-${u.role}`}>{u.role}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-muted-foreground">{u.department || '—'}</td>
                                            <td className="px-4 py-4 text-muted-foreground text-sm">
                                                {(u.managerId as unknown as { name?: string })?.name || '—'}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={u.isActive ? 'badge-approved' : 'badge-rejected'}>
                                                    {u.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-muted-foreground">
                                                {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    {u._id !== currentUser?.id && (
                                                        <>
                                                            <button
                                                                onClick={() => { setEditingRole(u._id); setEditRole(u.role); }}
                                                                className="btn-ghost p-2 text-muted-foreground"
                                                                title="Edit role"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            {u.isActive && (
                                                                <button
                                                                    onClick={() => deactivate(u._id)}
                                                                    className="btn-ghost p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                                    title="Deactivate"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                    {u._id === currentUser?.id && (
                                                        <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                                                            <AlertCircle className="w-3 h-3" /> You
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <CreateUserModal
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
                onCreated={fetchUsers}
                managers={managers}
            />
        </>
    );
}
