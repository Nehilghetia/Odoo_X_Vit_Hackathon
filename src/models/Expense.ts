import mongoose, { Document, Schema, Model } from 'mongoose';

export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'in_review';
export type ExpenseCategory =
    | 'travel'
    | 'meals'
    | 'accommodation'
    | 'equipment'
    | 'software'
    | 'training'
    | 'medical'
    | 'office_supplies'
    | 'utilities'
    | 'entertainment'
    | 'other';

export interface IApprovalStep {
    stepNumber: number;
    role: string;
    label: string;
    approverId?: mongoose.Types.ObjectId;
    status: 'pending' | 'approved' | 'rejected' | 'skipped';
    comment?: string;
    actionAt?: Date;
}

export interface IExpense extends Document {
    _id: mongoose.Types.ObjectId;
    companyId: mongoose.Types.ObjectId;
    submittedBy: mongoose.Types.ObjectId;
    amount: number;
    currency: string;
    currencySymbol: string;
    convertedAmount: number;
    convertedCurrency: string;
    exchangeRate: number;
    category: ExpenseCategory;
    description: string;
    merchant?: string;
    expenseDate: Date;
    receiptUrl?: string;
    receiptPublicId?: string;
    status: ExpenseStatus;
    approvalSteps: IApprovalStep[];
    currentApprovalStep: number;
    timeline: {
        action: string;
        performedBy?: mongoose.Types.ObjectId;
        comment?: string;
        timestamp: Date;
    }[];
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
}

const ApprovalStepSchema = new Schema<IApprovalStep>({
    stepNumber: { type: Number, required: true },
    role: { type: String, required: true },
    label: { type: String, required: true },
    approverId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'skipped'],
        default: 'pending',
    },
    comment: { type: String },
    actionAt: { type: Date },
});

const ExpenseSchema = new Schema<IExpense>(
    {
        companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
        submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        amount: { type: Number, required: true, min: 0 },
        currency: { type: String, required: true, default: 'USD' },
        currencySymbol: { type: String, required: true, default: '$' },
        convertedAmount: { type: Number, required: true },
        convertedCurrency: { type: String, required: true },
        exchangeRate: { type: Number, required: true, default: 1 },
        category: {
            type: String,
            enum: ['travel', 'meals', 'accommodation', 'equipment', 'software', 'training', 'medical', 'office_supplies', 'utilities', 'entertainment', 'other'],
            required: true,
        },
        description: { type: String, required: true, trim: true },
        merchant: { type: String, trim: true },
        expenseDate: { type: Date, required: true },
        receiptUrl: { type: String },
        receiptPublicId: { type: String },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'in_review'],
            default: 'pending',
        },
        approvalSteps: [ApprovalStepSchema],
        currentApprovalStep: { type: Number, default: 0 },
        timeline: [
            {
                action: { type: String, required: true },
                performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
                comment: { type: String },
                timestamp: { type: Date, default: Date.now },
            },
        ],
        tags: [{ type: String }],
    },
    { timestamps: true }
);

// Index for faster queries
ExpenseSchema.index({ companyId: 1, status: 1, createdAt: -1 });
ExpenseSchema.index({ submittedBy: 1, createdAt: -1 });
ExpenseSchema.index({ companyId: 1, 'approvalSteps.role': 1, status: 1 });

const Expense: Model<IExpense> =
    mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

export default Expense;
