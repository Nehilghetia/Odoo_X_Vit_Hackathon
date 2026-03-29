import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
    userId: string;
    companyId: string;
    role: string;
    email: string;
    name: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
    const expiresIn = JWT_EXPIRES_IN === '7d' ? '7d' : JWT_EXPIRES_IN;
    return new SignJWT(payload as Record<string, unknown>)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload> {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
}

export function setAuthCookie(token: string): void {
    cookies().set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
    });
}

export function clearAuthCookie(): void {
    cookies().set('auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
    });
}

export async function getAuthUser(request: NextRequest): Promise<JWTPayload | null> {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return null;
    try {
        return await verifyToken(token);
    } catch {
        return null;
    }
}

export async function getServerUser(): Promise<JWTPayload | null> {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return null;
    try {
        return await verifyToken(token);
    } catch {
        return null;
    }
}
