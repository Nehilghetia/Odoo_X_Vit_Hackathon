import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Company from '@/models/Company';
import { getAuthUser, clearAuthCookie } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';

export async function GET(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) return apiError('Unauthorized', 401);

        await connectDB();
        const user = await User.findById(authUser.userId).populate('managerId', 'name email');
        const company = await Company.findById(authUser.companyId);

        if (!user || !company) return apiError('User not found', 404);

        return apiSuccess({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                avatar: user.avatar,
                managerId: user.managerId,
                companyId: user.companyId,
            },
            company: {
                id: company._id,
                name: company.name,
                country: company.country,
                defaultCurrency: company.defaultCurrency,
                defaultCurrencySymbol: company.defaultCurrencySymbol,
                approvalWorkflow: company.approvalWorkflow,
            },
        });
    } catch (error) {
        console.error('Me error:', error);
        return apiError('Failed to get user', 500);
    }
}

export async function POST(_request: NextRequest) {
    clearAuthCookie();
    return apiSuccess({ message: 'Logged out successfully' });
}
