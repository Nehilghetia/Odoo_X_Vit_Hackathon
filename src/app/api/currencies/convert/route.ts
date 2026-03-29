import { NextRequest } from 'next/server';
import { convertCurrency } from '@/lib/currency';
import { apiSuccess, apiError } from '@/lib/utils';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) return apiError('Unauthorized', 401);

        const searchParams = request.nextUrl.searchParams;
        const amount = parseFloat(searchParams.get('amount') || '0');
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        if (!from || !to) {
            return apiError('Missing from or to currency', 400);
        }

        if (isNaN(amount) || amount <= 0) {
            return apiSuccess({ convertedAmount: 0, exchangeRate: 1 });
        }

        const result = await convertCurrency(amount, from, to);
        return apiSuccess(result);
    } catch (error) {
        console.error('Currency conversion error:', error);
        return apiError('Failed to convert currency', 500);
    }
}
