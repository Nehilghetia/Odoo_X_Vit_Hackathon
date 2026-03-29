import { NextRequest } from 'next/server';
import { getExchangeRates, convertCurrency } from '@/lib/currency';
import { apiSuccess, apiError } from '@/lib/utils';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const base = searchParams.get('base') || 'USD';
        const to = searchParams.get('to');
        const amount = searchParams.get('amount');

        if (to && amount) {
            const result = await convertCurrency(parseFloat(amount), base, to);
            return apiSuccess({ ...result, from: base, to, amount: parseFloat(amount) });
        }

        const rates = await getExchangeRates(base);
        return apiSuccess({ rates });
    } catch (error) {
        console.error('Exchange error:', error);
        return apiError('Failed to fetch exchange rates', 500);
    }
}
