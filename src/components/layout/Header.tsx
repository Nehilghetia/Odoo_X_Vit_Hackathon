'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Menu, Search, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
    _id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
}

const NOTIF_ICONS: Record<string, string> = {
    expense_approved: '✅', expense_rejected: '❌',
    approval_required: '⏳', expense_submitted: '📝', system: '🔔',
};

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifs, setShowNotifs] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    const fetchNotifs = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications');
            const d = await res.json();
            if (res.ok) {
                setNotifications(d.data.notifications);
                setUnreadCount(d.data.unreadCount);
            }
        } catch { }
    }, []);

    useEffect(() => {
        fetchNotifs();
        const t = setInterval(fetchNotifs, 30_000);
        return () => clearInterval(t);
    }, [fetchNotifs]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node))
                setShowNotifs(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const markAllRead = async () => {
        await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
        setNotifications(n => n.map(x => ({ ...x, isRead: true })));
        setUnreadCount(0);
    };

    return (
        <header
            className="
        sticky top-0 z-30 h-16
        flex items-center gap-3 px-4 sm:px-6
        bg-card/80 backdrop-blur-xl
        border-b border-border/30
      "
            style={{ paddingLeft: 'max(16px, env(safe-area-inset-left))', paddingRight: 'max(16px, env(safe-area-inset-right))' }}
        >
            {/* Mobile hamburger */}
            <button
                id="sidebar-toggle"
                onClick={onMenuClick}
                className="lg:hidden btn-ghost p-2.5 -ml-1 touch-target"
                aria-label="Open sidebar"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Search — hidden on xs, shown sm+ */}
            <div className="flex-1 hidden sm:block max-w-md">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search expenses..."
                        className="
              w-full pl-9 pr-4 py-2
              bg-secondary/50 border border-border/30 rounded-xl
              text-sm placeholder:text-muted-foreground/60
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30
              transition-all duration-200
            "
                        style={{ fontSize: '14px' }} /* No zoom on iOS */
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                    <button
                        id="notifications-btn"
                        onClick={() => setShowNotifs(!showNotifs)}
                        className="relative btn-ghost p-2.5 touch-target"
                        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} new)` : ''}`}
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none animate-pulse">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notification Panel */}
                    {showNotifs && (
                        <div className="
              absolute right-[-40px] xs:right-0 top-14
              w-[calc(100vw-20px)] xs:w-80
              max-h-[85vh]
              glass-card shadow-2xl animate-scale-in
              overflow-hidden flex flex-col z-50
              border border-white/10
            ">
                            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/30 bg-secondary/20 flex-shrink-0">
                                <span className="font-bold text-sm tracking-tight text-foreground/90">Notifications</span>
                                <div className="flex items-center gap-3">
                                    {unreadCount > 0 && (
                                        <button onClick={markAllRead} className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors">
                                            Mark all read
                                        </button>
                                    )}
                                    <button onClick={() => setShowNotifs(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-secondary/50">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-y-auto flex-1 scrollbar-hide py-1">
                                {notifications.length === 0 ? (
                                    <div className="py-12 px-8 text-center text-muted-foreground text-sm">
                                        <div className="w-12 h-12 rounded-full bg-secondary/30 flex items-center justify-center mx-auto mb-3">
                                            <Bell className="w-6 h-6 opacity-40 text-primary" />
                                        </div>
                                        <p className="font-medium opacity-60">No notifications yet</p>
                                    </div>
                                ) : (
                                    notifications.map((n) => (
                                        <div
                                            key={n._id}
                                            className={`mx-1.5 my-1 p-3.5 rounded-xl border border-transparent transition-all hover:bg-white/5 cursor-default ${!n.isRead ? 'bg-primary/5 border-primary/10' : ''}`}
                                        >
                                            <div className="flex gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-sm border border-white/5 ${n.type.includes('approved') ? 'bg-emerald-500/10 text-emerald-400' :
                                                        n.type.includes('rejected') ? 'bg-rose-500/10 text-rose-400' :
                                                            n.type.includes('required') ? 'bg-amber-500/10 text-amber-400' :
                                                                'bg-blue-500/10 text-blue-400'
                                                    }`}>
                                                    {NOTIF_ICONS[n.type] || '🔔'}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="text-sm font-semibold text-foreground/90 leading-snug">
                                                            {n.title}
                                                        </p>
                                                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50 flex-shrink-0 mt-1" />}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground/90 mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
                                                    <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground/50 font-medium">
                                                        <span className="w-1 h-1 rounded-full bg-border/50" />
                                                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* User Avatar */}
                <div className="flex items-center gap-2 pl-2 border-l border-border/30">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-white">
                            {user?.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                    </div>
                    <div className="hidden md:block">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">{user?.role}</p>
                    </div>
                </div>
            </div>
        </header>
    );
}
