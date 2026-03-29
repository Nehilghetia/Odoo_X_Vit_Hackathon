import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { getAuthUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';

// GET /api/users
export async function GET(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) return apiError('Unauthorized', 401);
        if (!['admin', 'manager'].includes(authUser.role)) return apiError('Forbidden', 403);

        await connectDB();

        const users = await User.find({ companyId: authUser.companyId })
            .populate('managerId', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        return apiSuccess({ users });
    } catch (error) {
        console.error('Get users error:', error);
        return apiError('Failed to fetch users', 500);
    }
}

// POST /api/users - Create new user (admin only)
export async function POST(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) return apiError('Unauthorized', 401);
        if (authUser.role !== 'admin') return apiError('Admin only', 403);

        await connectDB();

        const body = await request.json();
        const { name, email, password, role, managerId, department } = body;

        if (!name || !email || !password || !role) {
            return apiError('Name, email, password, and role are required', 400);
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) return apiError('Email already in use', 409);

        const user = await User.create({
            companyId: authUser.companyId,
            name,
            email: email.toLowerCase(),
            passwordHash: password,
            role,
            managerId: managerId || undefined,
            department,
            isActive: true,
        });

        await AuditLog.create({
            companyId: authUser.companyId,
            userId: authUser.userId,
            action: 'USER_CREATED',
            resource: 'User',
            resourceId: user._id,
            details: { name, email, role },
        });

        return apiSuccess(
            {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    department: user.department,
                },
            },
            201
        );
    } catch (error) {
        console.error('Create user error:', error);
        return apiError('Failed to create user', 500);
    }
}
