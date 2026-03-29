import { NextRequest } from 'next/server';
import { fetchCountriesWithCurrencies } from '@/lib/currency';
import { apiSuccess, apiError } from '@/lib/utils';

export async function GET(_request: NextRequest) {
    try {
        const currencies = await fetchCountriesWithCurrencies();
        return apiSuccess({ currencies });
    } catch (error) {
        console.error('Currencies error:', error);
        return apiError('Failed to fetch currencies', 500);
    }
}
