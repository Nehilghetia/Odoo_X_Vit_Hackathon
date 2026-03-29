import { AuthProvider } from '@/contexts/AuthContext';

export default function SignupLayout({ children }: { children: React.ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
}
