import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const PUBLIC_PATHS = [
    '/login',
    '/signup',
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/logout',
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public paths
    if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // Allow static files and Next.js internals
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.startsWith('/public') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        const payload = await verifyToken(token);
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', payload.userId);
        requestHeaders.set('x-company-id', payload.companyId);
        requestHeaders.set('x-user-role', payload.role);
        requestHeaders.set('x-user-email', payload.email);
        requestHeaders.set('x-user-name', payload.name);

        return NextResponse.next({ request: { headers: requestHeaders } });
    } catch {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
        }
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('auth-token');
        return response;
    }
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
