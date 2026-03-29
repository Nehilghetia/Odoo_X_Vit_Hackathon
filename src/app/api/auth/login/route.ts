import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { signToken, setAuthCookie } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return apiError('Email and password are required', 400);
        }

        // Find user with passwordHash (select: false by default)
        const user = await User.findOne({ email: email.toLowerCase(), isActive: true }).select('+passwordHash');
        if (!user) {
            return apiError('Invalid email or password', 401);
        }

        let isValid = false;

        // Ensure we handle previously unhashed plain-text passwords gracefully
        if (!user.passwordHash.startsWith('$2')) {
            isValid = (user.passwordHash === password);
        } else {
            isValid = await user.comparePassword(password);
        }

        if (!isValid) {
            return apiError('Invalid email or password', 401);
        }

        const token = await signToken({
            userId: user._id.toString(),
            companyId: user.companyId.toString(),
            role: user.role,
            email: user.email,
            name: user.name,
        });

        setAuthCookie(token);

        return apiSuccess({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                companyId: user.companyId,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return apiError('Login failed. Please try again.', 500);
    }
}
