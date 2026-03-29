import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Expense from '@/models/Expense';
import { getAuthUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';

export async function GET(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) return apiError('Unauthorized', 401);

        await connectDB();

        const query: Record<string, unknown> = { companyId: new mongoose.Types.ObjectId(authUser.companyId as string) };
        if (authUser.role === 'employee') query.submittedBy = new mongoose.Types.ObjectId(authUser.userId as string);

        const [total, pending, inReview, approved, rejected] = await Promise.all([
            Expense.countDocuments(query),
            Expense.countDocuments({ ...query, status: 'pending' }),
            Expense.countDocuments({ ...query, status: 'in_review' }),
            Expense.countDocuments({ ...query, status: 'approved' }),
            Expense.countDocuments({ ...query, status: 'rejected' }),
        ]);

        // Total amount by category
        const categoryStats = await Expense.aggregate([
            { $match: { ...query } },
            { $group: { _id: '$category', total: { $sum: '$convertedAmount' }, count: { $sum: 1 } } },
            { $sort: { total: -1 } },
        ]);

        // Monthly trend (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyTrend = await Expense.aggregate([
            { $match: { ...query, createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                    total: { $sum: '$convertedAmount' },
                    count: { $sum: 1 },
                    approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
                    rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        // Total approved amount
        const totalApprovedAmount = await Expense.aggregate([
            { $match: { ...query, status: 'approved' } },
            { $group: { _id: null, total: { $sum: '$convertedAmount' } } },
        ]);

        const totalPendingAmount = await Expense.aggregate([
            { $match: { ...query, status: { $in: ['pending', 'in_review'] } } },
            { $group: { _id: null, total: { $sum: '$convertedAmount' } } },
        ]);

        return apiSuccess({
            summary: {
                total,
                pending: pending + inReview,
                approved,
                rejected,
                inReview,
                totalApprovedAmount: totalApprovedAmount[0]?.total || 0,
                totalPendingAmount: totalPendingAmount[0]?.total || 0,
            },
            categoryStats,
            monthlyTrend,
        });
    } catch (error) {
        console.error('Stats error:', error);
        return apiError('Failed to fetch stats', 500);
    }
}
