import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { getAuthUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';

// PATCH /api/users/[id]
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) return apiError('Unauthorized', 401);
        if (authUser.role !== 'admin') return apiError('Admin only', 403);

        await connectDB();

        const body = await request.json();
        const { name, role, managerId, department, isActive } = body;

        const user = await User.findOne({ _id: params.id, companyId: authUser.companyId });
        if (!user) return apiError('User not found', 404);

        // Prevent changing own role
        if (params.id === authUser.userId && role && role !== user.role) {
            return apiError('Cannot change your own role', 400);
        }

        const updates: Record<string, unknown> = {};
        if (name !== undefined) updates.name = name;
        if (role !== undefined) updates.role = role;
        if (managerId !== undefined) updates.managerId = managerId || null;
        if (department !== undefined) updates.department = department;
        if (isActive !== undefined) updates.isActive = isActive;

        const updatedUser = await User.findByIdAndUpdate(params.id, updates, { new: true })
            .populate('managerId', 'name email')
            .lean();

        await AuditLog.create({
            companyId: authUser.companyId,
            userId: authUser.userId,
            action: 'USER_UPDATED',
            resource: 'User',
            resourceId: user._id,
            details: updates,
        });

        return apiSuccess({ user: updatedUser });
    } catch (error) {
        console.error('Update user error:', error);
        return apiError('Failed to update user', 500);
    }
}

// DELETE /api/users/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) return apiError('Unauthorized', 401);
        if (authUser.role !== 'admin') return apiError('Admin only', 403);

        if (params.id === authUser.userId) {
            return apiError('Cannot delete your own account', 400);
        }

        await connectDB();

        const user = await User.findOneAndUpdate(
            { _id: params.id, companyId: authUser.companyId },
            { isActive: false },
            { new: true }
        );

        if (!user) return apiError('User not found', 404);

        await AuditLog.create({
            companyId: authUser.companyId,
            userId: authUser.userId,
            action: 'USER_DEACTIVATED',
            resource: 'User',
            resourceId: user._id,
        });

        return apiSuccess({ message: 'User deactivated' });
    } catch (error) {
        console.error('Delete user error:', error);
        return apiError('Failed to deactivate user', 500);
    }
}
