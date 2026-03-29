import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Expense from '@/models/Expense';
import Company from '@/models/Company';
import Notification from '@/models/Notification';
import AuditLog from '@/models/AuditLog';
import { getAuthUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { convertCurrency } from '@/lib/currency';

// GET /api/expenses - List expenses (filtered by role)
export async function GET(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) return apiError('Unauthorized', 401);

        await connectDB();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const scope = searchParams.get('scope'); // 'personal', 'team', 'all'
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        // Build query based on role and requested scope
        const query: Record<string, unknown> = { companyId: authUser.companyId };

        if (scope === 'personal' || authUser.role === 'employee') {
            // Strictly limit to logged-in user's own created expenses
            query.submittedBy = authUser.userId;
        } else if (authUser.role === 'manager' && scope !== 'all') {
            // Manager sees expenses assigned to their approval role OR their own
            query['$or'] = [
                { submittedBy: authUser.userId },
                { 'approvalSteps': { $elemMatch: { role: 'manager' } } }
            ];
        }

        if (status) query.status = status;

        const queryBuilder = Expense.find(query);

        const [expenses, total] = await Promise.all([
            queryBuilder
                .populate('submittedBy', 'name email avatar department')
                .populate('approvalSteps.approverId', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Expense.countDocuments(query),
        ]);

        return apiSuccess({ expenses, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('Get expenses error:', error);
        return apiError('Failed to fetch expenses', 500);
    }
}

// POST /api/expenses - Submit new expense
export async function POST(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) return apiError('Unauthorized', 401);

        await connectDB();

        const body = await request.json();
        const { amount, currency, currencySymbol, category, description, merchant, expenseDate, receiptUrl, tags } = body;

        if (!amount || !currency || !category || !description || !expenseDate) {
            return apiError('Missing required fields', 400);
        }

        // Get company for default currency and approval workflow
        const company = await Company.findById(authUser.companyId);
        if (!company) return apiError('Company not found', 404);

        // Convert to company currency
        const { convertedAmount, exchangeRate } = await convertCurrency(
            parseFloat(amount),
            currency,
            company.defaultCurrency
        );

        // Build approval steps from company workflow
        const approvalSteps = company.approvalWorkflow.map((step) => ({
            stepNumber: step.step,
            role: step.role,
            label: step.label,
            status: 'pending' as const,
        }));

        const expense = await Expense.create({
            companyId: authUser.companyId,
            submittedBy: authUser.userId,
            amount: parseFloat(amount),
            currency,
            currencySymbol: currencySymbol || currency,
            convertedAmount,
            convertedCurrency: company.defaultCurrency,
            exchangeRate,
            category,
            description,
            merchant,
            expenseDate: new Date(expenseDate),
            receiptUrl,
            status: 'pending',
            approvalSteps,
            currentApprovalStep: 0,
            timeline: [
                {
                    action: 'Expense submitted',
                    performedBy: authUser.userId,
                    timestamp: new Date(),
                },
            ],
            tags: tags || [],
        });

        // Create notifications for approvers (step 1 - managers)
        const firstStep = approvalSteps[0];
        if (firstStep) {
            const approvers = await (await import('@/models/User')).default.find({
                companyId: authUser.companyId,
                role: firstStep.role,
                isActive: true,
            });

            for (const approver of approvers) {
                await Notification.create({
                    userId: approver._id,
                    companyId: authUser.companyId,
                    title: 'New Expense Pending Approval',
                    message: `${authUser.name} submitted an expense of ${currencySymbol}${amount} for ${category}`,
                    type: 'approval_required',
                    resourceId: expense._id,
                });
            }
        }

        // Audit log
        await AuditLog.create({
            companyId: authUser.companyId,
            userId: authUser.userId,
            action: 'EXPENSE_SUBMITTED',
            resource: 'Expense',
            resourceId: expense._id,
            details: { amount, currency, category },
        });

        return apiSuccess({ expense }, 201);
    } catch (error) {
        console.error('Create expense error:', error);
        return apiError('Failed to create expense', 500);
    }
}
