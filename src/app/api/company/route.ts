import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Company from '@/models/Company';
import AuditLog from '@/models/AuditLog';
import { getAuthUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';

// GET /api/company
export async function GET(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) return apiError('Unauthorized', 401);

        await connectDB();
        const company = await Company.findById(authUser.companyId);
        if (!company) return apiError('Company not found', 404);

        return apiSuccess({ company });
    } catch (error) {
        console.error('Get company error:', error);
        return apiError('Failed to fetch company', 500);
    }
}

// PATCH /api/company - Update company settings (admin only)
export async function PATCH(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) return apiError('Unauthorized', 401);
        if (authUser.role !== 'admin') return apiError('Admin only', 403);

        await connectDB();

        const body = await request.json();
        const { name, approvalWorkflow, approvalRules } = body;

        const updates: Record<string, unknown> = {};
        if (name) updates.name = name;
        if (approvalWorkflow) updates.approvalWorkflow = approvalWorkflow;
        if (approvalRules) updates.approvalRules = approvalRules;

        const company = await Company.findByIdAndUpdate(authUser.companyId, updates, { new: true, runValidators: true });
        if (!company) return apiError('Company not found', 404);

        await AuditLog.create({
            companyId: authUser.companyId,
            userId: authUser.userId,
            action: 'COMPANY_UPDATED',
            resource: 'Company',
            resourceId: company._id,
            details: updates,
        });

        return apiSuccess({ company });
    } catch (error) {
        console.error('Update company error:', error);
        return apiError('Failed to update company', 500);
    }
}
