/**
 * Seed script — creates demo company, admin, manager, and employee with sample expenses
 * Run: node scripts/seed.mjs
 * Requires: MONGODB_URI in .env.local
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env.local');
    process.exit(1);
}

// Inline schemas for the seed script
const CompanySchema = new mongoose.Schema({
    name: String, country: String, defaultCurrency: String, defaultCurrencySymbol: String,
    approvalWorkflow: [{ step: Number, role: String, label: String }],
    approvalRules: { type: { type: String }, percentage: Number, specificApproverRole: String },
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
    companyId: mongoose.Schema.Types.ObjectId,
    name: String, email: String, passwordHash: String,
    role: String, managerId: mongoose.Schema.Types.ObjectId,
    isActive: { type: Boolean, default: true }, department: String,
}, { timestamps: true });

const ExpenseSchema = new mongoose.Schema({
    companyId: mongoose.Schema.Types.ObjectId,
    submittedBy: mongoose.Schema.Types.ObjectId,
    amount: Number, currency: String, currencySymbol: String,
    convertedAmount: Number, convertedCurrency: String, exchangeRate: Number,
    category: String, description: String, merchant: String,
    expenseDate: Date, status: String,
    approvalSteps: [{ stepNumber: Number, role: String, label: String, status: String }],
    currentApprovalStep: Number, timeline: [{ action: String, timestamp: Date }],
    tags: [String],
}, { timestamps: true });

const Company = mongoose.models.Company || mongoose.model('Company', CompanySchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Expense = mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);

async function seed() {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clean ALL existing demo data to prevent conflicts with old schemas
    await Promise.all([
        Company.deleteMany({}),
        User.deleteMany({}),
        Expense.deleteMany({}),
    ]);

    // Create company
    const company = await Company.create({
        name: 'Demo Corporation',
        country: 'United States',
        defaultCurrency: 'USD',
        defaultCurrencySymbol: '$',
        approvalWorkflow: [
            { step: 1, role: 'manager', label: 'Manager Approval' },
            { step: 2, role: 'admin', label: 'Finance Approval' },
        ],
        approvalRules: { type: 'percentage', percentage: 100 },
    });
    console.log('✅ Company created:', company.name);

    const hashPw = async (pw) => bcrypt.hash(pw, 12);

    // Create users
    const admin = await User.create({
        companyId: company._id, name: 'Alex Johnson', email: 'admin@demo.com',
        passwordHash: await hashPw('demo1234'), role: 'admin', department: 'Finance',
    });
    const manager = await User.create({
        companyId: company._id, name: 'Sarah Manager', email: 'manager@demo.com',
        passwordHash: await hashPw('demo1234'), role: 'manager', department: 'Engineering',
    });
    const employee = await User.create({
        companyId: company._id, name: 'Bob Employee', email: 'employee@demo.com',
        passwordHash: await hashPw('demo1234'), role: 'employee',
        managerId: manager._id, department: 'Engineering',
    });

    console.log('✅ Users created: admin@demo.com, manager@demo.com, employee@demo.com (all: demo1234)');

    // Create sample expenses
    const defaultSteps = [
        { stepNumber: 1, role: 'manager', label: 'Manager Approval', status: 'pending' },
        { stepNumber: 2, role: 'admin', label: 'Finance Approval', status: 'pending' },
    ];

    const expenses = [
        {
            companyId: company._id, submittedBy: employee._id,
            amount: 450, currency: 'USD', currencySymbol: '$',
            convertedAmount: 450, convertedCurrency: 'USD', exchangeRate: 1,
            category: 'travel', description: 'Flight to NYC Conference',
            merchant: 'Delta Airlines', expenseDate: new Date('2024-03-15'),
            status: 'pending', approvalSteps: defaultSteps, currentApprovalStep: 0,
            timeline: [{ action: 'Expense submitted', timestamp: new Date() }],
            tags: ['conference', 'q1'],
        },
        {
            companyId: company._id, submittedBy: employee._id,
            amount: 89.50, currency: 'USD', currencySymbol: '$',
            convertedAmount: 89.50, convertedCurrency: 'USD', exchangeRate: 1,
            category: 'meals', description: 'Team lunch after sprint review',
            merchant: 'The Capital Grille', expenseDate: new Date('2024-03-18'),
            status: 'approved',
            approvalSteps: [
                { stepNumber: 1, role: 'manager', label: 'Manager Approval', status: 'approved' },
                { stepNumber: 2, role: 'admin', label: 'Finance Approval', status: 'approved' },
            ],
            currentApprovalStep: 1,
            timeline: [
                { action: 'Expense submitted', timestamp: new Date('2024-03-18') },
                { action: 'Approved by Manager', timestamp: new Date('2024-03-19') },
                { action: 'Approved by Admin', timestamp: new Date('2024-03-20') },
            ],
        },
        {
            companyId: company._id, submittedBy: employee._id,
            amount: 199.99, currency: 'EUR', currencySymbol: '€',
            convertedAmount: 217.99, convertedCurrency: 'USD', exchangeRate: 1.09,
            category: 'software', description: 'JetBrains IDE License',
            merchant: 'JetBrains', expenseDate: new Date('2024-03-20'),
            status: 'in_review',
            approvalSteps: [
                { stepNumber: 1, role: 'manager', label: 'Manager Approval', status: 'approved' },
                { stepNumber: 2, role: 'admin', label: 'Finance Approval', status: 'pending' },
            ],
            currentApprovalStep: 1,
            timeline: [
                { action: 'Expense submitted', timestamp: new Date('2024-03-20') },
                { action: 'Step 1 approved', timestamp: new Date('2024-03-21') },
            ],
        },
        {
            companyId: company._id, submittedBy: employee._id,
            amount: 1500, currency: 'USD', currencySymbol: '$',
            convertedAmount: 1500, convertedCurrency: 'USD', exchangeRate: 1,
            category: 'equipment', description: 'External monitor for home office',
            merchant: 'Dell Technologies', expenseDate: new Date('2024-02-10'),
            status: 'rejected',
            approvalSteps: [
                { stepNumber: 1, role: 'manager', label: 'Manager Approval', status: 'rejected' },
                { stepNumber: 2, role: 'admin', label: 'Finance Approval', status: 'pending' },
            ],
            currentApprovalStep: 0,
            timeline: [
                { action: 'Expense submitted', timestamp: new Date('2024-02-10') },
                { action: 'Rejected: exceeds limit', timestamp: new Date('2024-02-11') },
            ],
        },
    ];

    await Expense.insertMany(expenses);
    console.log('✅ Sample expenses created');

    console.log('\n🎉 Seed complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Admin:    admin@demo.com    / demo1234');
    console.log('  Manager:  manager@demo.com  / demo1234');
    console.log('  Employee: employee@demo.com / demo1234');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.disconnect();
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
