export interface CountryCurrency {
    code: string;
    name: string;
    symbol: string;
    country: string;
    flag: string;
}

export interface ExchangeRates {
    base: string;
    rates: Record<string, number>;
    date: string;
}

// Cache exchange rates for 1 hour
const rateCache = new Map<string, { rates: ExchangeRates; expiresAt: number }>();

export async function fetchCountriesWithCurrencies(): Promise<CountryCurrency[]> {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies,flag,cca2', {
            next: { revalidate: 86400 }, // Cache for 24 hours
        });
        if (!response.ok) throw new Error('Failed to fetch countries');
        const data = await response.json();

        const currencies: CountryCurrency[] = [];
        const seenCodes = new Set<string>();

        for (const country of data) {
            if (!country.currencies) continue;
            for (const [code, details] of Object.entries(country.currencies as Record<string, { name: string; symbol: string }>)) {
                if (!seenCodes.has(code)) {
                    seenCodes.add(code);
                    let flag = country.flag || '';
                    if (code === 'INR') flag = '🇮🇳';
                    if (code === 'USD') flag = '🇺🇸';
                    if (code === 'EUR') flag = '🇪🇺';
                    if (code === 'GBP') flag = '🇬🇧';

                    currencies.push({
                        code,
                        name: details.name,
                        symbol: details.symbol || code,
                        country: country.name.common,
                        flag: flag,
                    });
                }
            }
        }

        return currencies.sort((a, b) => a.code.localeCompare(b.code));
    } catch (error) {
        console.error('Failed to fetch currencies:', error);
        // Return fallback common currencies
        return FALLBACK_CURRENCIES;
    }
}

export async function getExchangeRates(baseCurrency: string): Promise<ExchangeRates> {
    const cached = rateCache.get(baseCurrency);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.rates;
    }

    try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
        if (!response.ok) throw new Error('Failed to fetch exchange rates');
        const data = await response.json();

        const rates: ExchangeRates = {
            base: data.base,
            rates: data.rates,
            date: data.date,
        };

        // Cache for 1 hour
        rateCache.set(baseCurrency, { rates, expiresAt: Date.now() + 3600000 });
        return rates;
    } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
        // Return 1:1 rate as fallback
        return { base: baseCurrency, rates: { [baseCurrency]: 1 }, date: new Date().toISOString().split('T')[0] };
    }
}

export async function convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
): Promise<{ convertedAmount: number; exchangeRate: number }> {
    if (fromCurrency === toCurrency) {
        return { convertedAmount: amount, exchangeRate: 1 };
    }

    const rates = await getExchangeRates(fromCurrency);
    const rate = rates.rates[toCurrency] || 1;
    return {
        convertedAmount: Math.round(amount * rate * 100) / 100,
        exchangeRate: rate,
    };
}

export const FALLBACK_CURRENCIES: CountryCurrency[] = [
    { code: 'USD', name: 'United States Dollar', symbol: '$', country: 'United States', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', symbol: '€', country: 'European Union', flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', symbol: '£', country: 'United Kingdom', flag: '🇬🇧' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', country: 'Japan', flag: '🇯🇵' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', country: 'Canada', flag: '🇨🇦' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', country: 'Australia', flag: '🇦🇺' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', country: 'Switzerland', flag: '🇨🇭' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', country: 'China', flag: '🇨🇳' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', country: 'India', flag: '🇮🇳' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', country: 'Singapore', flag: '🇸🇬' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', country: 'United Arab Emirates', flag: '🇦🇪' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', country: 'Saudi Arabia', flag: '🇸🇦' },
];
