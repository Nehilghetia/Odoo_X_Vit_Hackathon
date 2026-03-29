import { NextResponse } from 'next/server';
import { JWTPayload } from '@/lib/auth';

export interface ApiError {
    error: string;
    message?: string;
    statusCode: number;
}

export function apiSuccess<T>(data: T, statusCode = 200): NextResponse {
    return NextResponse.json({ success: true, data }, { status: statusCode });
}

export function apiError(message: string, statusCode = 400): NextResponse {
    return NextResponse.json({ success: false, error: message }, { status: statusCode });
}

export function requireAuth(user: JWTPayload | null): NextResponse | null {
    if (!user) {
        return apiError('Unauthorized - please login', 401);
    }
    return null;
}

export function requireRole(
    user: JWTPayload | null,
    roles: string[]
): NextResponse | null {
    const authCheck = requireAuth(user);
    if (authCheck) return authCheck;
    if (!roles.includes(user!.role)) {
        return apiError('Forbidden - insufficient permissions', 403);
    }
    return null;
}

export function formatCurrency(amount: number, currency: string, symbol: string): string {
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
        }).format(amount);
    } catch {
        return `${symbol}${amount.toFixed(2)}`;
    }
}

export function parseAmount(value: string | number): number {
    const parsed = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
    return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
}
