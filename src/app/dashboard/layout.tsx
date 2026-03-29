'use client';

import { useState } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <AuthProvider>
            <div className="flex h-[100dvh] overflow-hidden bg-background">
                {/* Sidebar */}
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                {/* Main area */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <Header onMenuClick={() => setSidebarOpen(true)} />
                    <main className="flex-1 overflow-y-auto scrollbar-hide">
                        <div className="p-4 sm:p-5 lg:p-6 max-w-[1400px] mx-auto pb-safe">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </AuthProvider>
    );
}
