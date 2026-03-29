import { NextRequest } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';
import { apiSuccess } from '@/lib/utils';

export async function POST(_request: NextRequest) {
    clearAuthCookie();
    return apiSuccess({ message: 'Logged out successfully' });
}
