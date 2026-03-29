import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Company from '@/models/Company';
import { signToken, setAuthCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { apiSuccess, apiError } from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json();
        const { companyName, country, currency, currencySymbol, name, email, password } = body;

        // Validate input
        if (!companyName || !country || !currency || !name || !email || !password) {
            return apiError('All fields are required', 400);
        }
        if (password.length < 8) {
            return apiError('Password must be at least 8 characters', 400);
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return apiError('Email already in use', 409);
        }

        // Create company with default approval workflow
        const company = await Company.create({
            name: companyName,
            country,
            defaultCurrency: currency,
            defaultCurrencySymbol: currencySymbol || '$',
            approvalWorkflow: [
                { step: 1, role: 'manager', label: 'Manager Approval' },
                { step: 2, role: 'admin', label: 'Admin Final Approval' },
            ],
            approvalRules: {
                type: 'percentage',
                percentage: 100,
            },
        });


        // Hash password manually before save
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create admin user
        const user = await User.create({
            companyId: company._id,
            name,
            email: email.toLowerCase(),
            passwordHash: hashedPassword,
            role: 'admin',
            isActive: true,
        });

        const token = await signToken({
            userId: user._id.toString(),
            companyId: company._id.toString(),
            role: user.role,
            email: user.email,
            name: user.name,
        });

        setAuthCookie(token);

        return apiSuccess(
            {
                user: { id: user._id, name: user.name, email: user.email, role: user.role },
                company: { id: company._id, name: company.name, currency: company.defaultCurrency },
            },
            201
        );
    } catch (error) {
        console.error('Signup error:', error);
        return apiError('Registration failed. Please try again.', 500);
    }
}
