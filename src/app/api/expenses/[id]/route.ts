import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Expense from '@/models/Expense';
import User from '@/models/User';
import Company from '@/models/Company';
import Notification from '@/models/Notification';
import AuditLog from '@/models/AuditLog';
import { getAuthUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import mongoose from 'mongoose';

// GET /api/expenses/[id]
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) return apiError('Unauthorized', 401);

        await connectDB();

        const expense = await Expense.findOne({
            _id: params.id,
            companyId: authUser.companyId,
        })
            .populate('submittedBy', 'name email avatar department role')
            .populate('approvalSteps.approverId', 'name email role')
            .populate('timeline.performedBy', 'name email');

        if (!expense) return apiError('Expense not found', 404);

        // Check access: employee can only see own
        if (authUser.role === 'employee' && expense.submittedBy._id.toString() !== authUser.userId) {
            return apiError('Forbidden', 403);
        }

        return apiSuccess({ expense });
    } catch (error) {
        console.error('Get expense error:', error);
        return apiError('Failed to fetch expense', 500);
    }
}

// PATCH /api/expenses/[id] - Approve/Reject
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) return apiError('Unauthorized', 401);
        if (!['admin', 'manager'].includes(authUser.role)) {
            return apiError('Only managers and admins can approve expenses', 403);
        }

        await connectDB();

        const body = await request.json();
        const { action, comment } = body; // action: 'approve' | 'reject'

        if (!['approve', 'reject'].includes(action)) {
            return apiError('Invalid action', 400);
        }

        const expense = await Expense.findOne({
            _id: params.id,
            companyId: authUser.companyId,
        });

        if (!expense) return apiError('Expense not found', 404);
        if (expense.status !== 'pending' && expense.status !== 'in_review') {
            return apiError('Expense is not pending approval', 400);
        }

        const company = await Company.findById(authUser.companyId);
        if (!company) return apiError('Company not found', 404);

        const currentStepIndex = expense.currentApprovalStep;
        const currentStep = expense.approvalSteps[currentStepIndex];

        if (!currentStep) return apiError('No approval step found', 400);

        // Verify this user can approve this step
        const canApprove =
            authUser.role === 'admin' ||
            currentStep.role === authUser.role ||
            currentStep.role === 'manager';

        if (!canApprove) {
            return apiError('You are not authorized to approve this step', 403);
        }

        // Update the current step
        expense.approvalSteps[currentStepIndex].status = action === 'approve' ? 'approved' : 'rejected';
        expense.approvalSteps[currentStepIndex].approverId = new mongoose.Types.ObjectId(authUser.userId);
        expense.approvalSteps[currentStepIndex].comment = comment;
        expense.approvalSteps[currentStepIndex].actionAt = new Date();

        // Add to timeline
        expense.timeline.push({
            action: action === 'approve' ? `Step ${currentStepIndex + 1} approved` : `Rejected at step ${currentStepIndex + 1}`,
            performedBy: new mongoose.Types.ObjectId(authUser.userId),
            comment,
            timestamp: new Date(),
        });

        if (action === 'reject') {
            expense.status = 'rejected';
        } else {
            // Check approval rules
            const nextStepIndex = currentStepIndex + 1;
            const { approvalRules } = company;

            // Check if all remaining steps should be auto-approved (specific approver rule)
            if (approvalRules.type === 'specific_role' || approvalRules.type === 'hybrid') {
                if (approvalRules.specificApproverRole === authUser.role) {
                    // Auto-approve remaining steps
                    for (let i = nextStepIndex; i < expense.approvalSteps.length; i++) {
                        expense.approvalSteps[i].status = 'skipped';
                        expense.approvalSteps[i].comment = 'Auto-approved by specific approver rule';
                    }
                    expense.status = 'approved';
                    expense.timeline.push({
                        action: 'Auto-approved by specific approver rule',
                        performedBy: new mongoose.Types.ObjectId(authUser.userId),
                        timestamp: new Date(),
                    });
                }
            }

            if (expense.status !== 'approved') {
                if (nextStepIndex >= expense.approvalSteps.length) {
                    // All steps complete
                    expense.status = 'approved';
                    expense.timeline.push({
                        action: 'Expense fully approved',
                        performedBy: new mongoose.Types.ObjectId(authUser.userId),
                        timestamp: new Date(),
                    });
                } else {
                    // Check percentage rule
                    if (approvalRules.type === 'percentage') {
                        const approved = expense.approvalSteps.filter((s) => s.status === 'approved').length;
                        const total = expense.approvalSteps.length;
                        const percentage = (approved / total) * 100;
                        if (percentage >= (approvalRules.percentage || 100)) {
                            expense.status = 'approved';
                        } else {
                            expense.currentApprovalStep = nextStepIndex;
                            expense.status = 'in_review';
                        }
                    } else {
                        expense.currentApprovalStep = nextStepIndex;
                        expense.status = 'in_review';
                    }
                }
            }
        }

        await expense.save();

        // Notify submitter
        const submitter = await User.findById(expense.submittedBy);
        if (submitter) {
            await Notification.create({
                userId: submitter._id,
                companyId: authUser.companyId,
                title: action === 'approve' ? 'Expense Approved' : 'Expense Rejected',
                message:
                    action === 'approve'
                        ? expense.status === 'approved'
                            ? 'Your expense has been fully approved!'
                            : `Your expense has been approved at step ${currentStepIndex + 1}`
                        : `Your expense was rejected: ${comment || 'No reason provided'}`,
                type: action === 'approve' ? 'expense_approved' : 'expense_rejected',
                resourceId: expense._id,
            });
        }

        // Notify next approvers if in_review
        if (expense.status === 'in_review') {
            const nextStep = expense.approvalSteps[expense.currentApprovalStep];
            const nextApprovers = await User.find({
                companyId: authUser.companyId,
                role: nextStep.role,
                isActive: true,
            });
            for (const approver of nextApprovers) {
                await Notification.create({
                    userId: approver._id,
                    companyId: authUser.companyId,
                    title: 'Expense Awaiting Your Approval',
                    message: `An expense requires your approval (Step ${nextStep.stepNumber}: ${nextStep.label})`,
                    type: 'approval_required',
                    resourceId: expense._id,
                });
            }
        }

        // Audit log
        await AuditLog.create({
            companyId: authUser.companyId,
            userId: authUser.userId,
            action: action === 'approve' ? 'EXPENSE_APPROVED' : 'EXPENSE_REJECTED',
            resource: 'Expense',
            resourceId: expense._id,
            details: { comment, step: currentStepIndex + 1, newStatus: expense.status },
        });

        return apiSuccess({ expense });
    } catch (error) {
        console.error('Approve expense error:', error);
        return apiError('Failed to process approval', 500);
    }
}

// DELETE /api/expenses/[id] - Admin only
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) return apiError('Unauthorized', 401);
        if (authUser.role !== 'admin') return apiError('Admin only', 403);

        await connectDB();

        const expense = await Expense.findOneAndDelete({
            _id: params.id,
            companyId: authUser.companyId,
        });

        if (!expense) return apiError('Expense not found', 404);

        await AuditLog.create({
            companyId: authUser.companyId,
            userId: authUser.userId,
            action: 'EXPENSE_DELETED',
            resource: 'Expense',
            resourceId: new mongoose.Types.ObjectId(params.id),
        });

        return apiSuccess({ message: 'Expense deleted' });
    } catch (error) {
        console.error('Delete expense error:', error);
        return apiError('Failed to delete expense', 500);
    }
}
