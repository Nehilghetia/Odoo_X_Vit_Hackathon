import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import AuditLog from '@/models/AuditLog';
import { getAuthUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';

export async function GET(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) return apiError('Unauthorized', 401);
        if (authUser.role !== 'admin') return apiError('Admin only', 403);

        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            AuditLog.find({ companyId: authUser.companyId })
                .populate('userId', 'name email role')
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            AuditLog.countDocuments({ companyId: authUser.companyId }),
        ]);

        return apiSuccess({ logs, total, page, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('Audit logs error:', error);
        return apiError('Failed to fetch audit logs', 500);
    }
}
