'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    LayoutDashboard, Receipt, CheckSquare, Users, Settings,
    Shield, FileText, Building2, LogOut, X, ChevronRight,
} from 'lucide-react';

interface NavItem {
    href: string;
    label: string;
    icon: React.ElementType;
    roles?: string[];
    badge?: string;
}

const NAV_ITEMS: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/expenses', label: 'My Expenses', icon: Receipt },
    { href: '/dashboard/expenses/submit', label: 'Submit Expense', icon: Receipt, roles: ['employee', 'admin', 'manager', 'finance'] },
    { href: '/dashboard/approvals', label: 'Approvals', icon: CheckSquare, roles: ['admin', 'manager', 'finance'] },
    { href: '/dashboard/team', label: 'Team Expenses', icon: FileText, roles: ['admin', 'manager', 'finance'] },
];

const ADMIN_ITEMS: NavItem[] = [
    { href: '/dashboard/admin/users', label: 'User Management', icon: Users },
    { href: '/dashboard/admin/rules', label: 'Approval Rules', icon: Shield },
    { href: '/dashboard/admin/audit', label: 'Audit Logs', icon: FileText },
    { href: '/dashboard/admin/company', label: 'Company Settings', icon: Building2 },
];

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === '/dashboard';
        if (href === '/dashboard/expenses') return pathname === '/dashboard/expenses' || (pathname.startsWith('/dashboard/expenses/') && !pathname.includes('/submit'));
        return pathname.startsWith(href);
    };

    const visibleItems = NAV_ITEMS.filter((item) =>
        !item.roles || item.roles.includes(user?.role || '')
    );

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          w-[var(--sidebar-width)] bg-card/95 border-r border-border/50
          backdrop-blur-xl shadow-2xl
          transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:shadow-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-border/30 flex-shrink-0">
                    <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                            <Receipt className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-sm leading-none">ReimburseFlow</p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[140px]">
                                {user?.role?.charAt(0).toUpperCase()}{user?.role?.slice(1)}
                            </p>
                        </div>
                    </Link>
                    {/* Mobile close */}
                    <button
                        onClick={onClose}
                        className="lg:hidden btn-ghost p-2 -mr-1"
                        aria-label="Close sidebar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-hide">
                    {/* Main Nav */}
                    <div className="mb-4">
                        {visibleItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={`sidebar-item ${isActive(item.href) ? 'active' : ''}`}
                            >
                                <item.icon className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{item.label}</span>
                                {isActive(item.href) && (
                                    <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />
                                )}
                            </Link>
                        ))}
                    </div>

                    {/* Admin Section */}
                    {user?.role === 'admin' && (
                        <div>
                            <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                Administration
                            </p>
                            {ADMIN_ITEMS.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={onClose}
                                    className={`sidebar-item ${isActive(item.href) ? 'active' : ''}`}
                                >
                                    <item.icon className="w-4 h-4 flex-shrink-0" />
                                    <span className="truncate">{item.label}</span>
                                    {isActive(item.href) && (
                                        <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />
                                    )}
                                </Link>
                            ))}
                        </div>
                    )}
                </nav>

                {/* Footer */}
                <div className="px-3 pb-4 pt-2 border-t border-border/30 flex-shrink-0">
                    <div className="flex items-center gap-2.5 px-3 py-2.5 mb-2 rounded-xl bg-secondary/30">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-white">
                                {user?.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium leading-none truncate">{user?.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{user?.email}</p>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className="sidebar-item w-full text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    >
                        <LogOut className="w-4 h-4 flex-shrink-0" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
