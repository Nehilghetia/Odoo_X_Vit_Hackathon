import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IApprovalRule {
    type: 'amount' | 'percentage' | 'specific_role' | 'hybrid';
    amountThreshold?: number;
    percentage?: number;
    specificApproverRole?: string;
}

export interface IApprovalWorkflowStep {
    step: number;
    role: string;
    label: string;
}

export interface ICompany extends Document {
    name: string;
    country: string;
    logoUrl?: string;
    defaultCurrency: string;
    defaultCurrencySymbol: string;
    approvalRules: IApprovalRule;
    approvalWorkflow: IApprovalWorkflowStep[];
    createdAt: Date;
    updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>({
    name: { type: String, required: true },
    country: { type: String, required: true },
    logoUrl: { type: String },
    defaultCurrency: { type: String, required: true, default: 'USD' },
    defaultCurrencySymbol: { type: String, required: true, default: '$' },
    approvalRules: {
        type: {
            type: String,
            enum: ['amount', 'percentage', 'specific_role', 'hybrid'],
            default: 'amount',
        },
        amountThreshold: { type: Number },
        percentage: { type: Number },
        specificApproverRole: { type: String },
    },
    approvalWorkflow: [
        {
            step: { type: Number, required: true },
            role: { type: String, required: true },
            label: { type: String, required: true },
        },
    ],
}, { timestamps: true });

const Company: Model<ICompany> = mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);

export default Company;
