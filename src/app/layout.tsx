import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
    title: 'ReimburseFlow — Reimbursement Management System',
    description: 'Modern expense reimbursement management with multi-level approvals, OCR receipt scanning, and multi-currency support.',
    keywords: ['expense management', 'reimbursement', 'approval workflow', 'OCR', 'multi-currency'],
    authors: [{ name: 'ReimburseFlow' }],
    openGraph: {
        title: 'ReimburseFlow — Reimbursement Management System',
        description: 'Modern expense reimbursement management system',
        type: 'website',
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="dark">
            <body className={`${inter.variable} font-sans bg-background text-foreground antialiased`}>
                {children}
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: '#1e293b',
                            color: '#f8fafc',
                            border: '1px solid #334155',
                            borderRadius: '12px',
                            fontSize: '14px',
                        },
                        success: { iconTheme: { primary: '#22c55e', secondary: '#f8fafc' } },
                        error: { iconTheme: { primary: '#ef4444', secondary: '#f8fafc' } },
                    }}
                />
            </body>
        </html>
    );
}
