/**
 * Utility to standardize currency formatting across the entire application.
 * Ensures consistent locales based on the currency code provided.
 */

export const formatGlobalCurrency = (amount, currencyCode = 'INR', options = {}) => {
    // Map specific currencies to their correct locales
    const localeMap = {
        'INR': 'en-IN',
        'USD': 'en-US',
        'EUR': 'de-DE',
        'GBP': 'en-GB',
        'AED': 'ar-AE'
    };

    // Default to en-US if the currency code isn't explicitly mapped
    const locale = localeMap[currencyCode.toUpperCase()] || 'en-US';

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode.toUpperCase(),
        maximumFractionDigits: 2,
        ...options
    }).format(amount || 0);
};

export const numberToWords = (num) => {
    if (num === 0) return 'Zero';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertLessThanThousand = (n) => {
        if (n === 0) return '';
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
        return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertLessThanThousand(n % 100) : '');
    };

    const absNum = Math.abs(Math.round(num * 100) / 100);
    const intPart = Math.floor(absNum);
    const decPart = Math.round((absNum - intPart) * 100);

    // Indian numbering: Crore, Lakh, Thousand, Hundred
    let result = '';
    if (intPart >= 10000000) {
        result += convertLessThanThousand(Math.floor(intPart / 10000000)) + ' Crore ';
        const rem = intPart % 10000000;
        if (rem >= 100000) result += convertLessThanThousand(Math.floor(rem / 100000)) + ' Lakh ';
        const rem2 = rem % 100000;
        if (rem2 >= 1000) result += convertLessThanThousand(Math.floor(rem2 / 1000)) + ' Thousand ';
        const rem3 = rem2 % 1000;
        if (rem3 > 0) result += convertLessThanThousand(rem3);
    } else if (intPart >= 100000) {
        result += convertLessThanThousand(Math.floor(intPart / 100000)) + ' Lakh ';
        const rem = intPart % 100000;
        if (rem >= 1000) result += convertLessThanThousand(Math.floor(rem / 1000)) + ' Thousand ';
        const rem2 = rem % 1000;
        if (rem2 > 0) result += convertLessThanThousand(rem2);
    } else if (intPart >= 1000) {
        result += convertLessThanThousand(Math.floor(intPart / 1000)) + ' Thousand ';
        const rem = intPart % 1000;
        if (rem > 0) result += convertLessThanThousand(rem);
    } else {
        result = convertLessThanThousand(intPart);
    }

    result = result.trim();
    if (decPart > 0) {
        result += ' and ' + convertLessThanThousand(decPart) + ' Paise';
    }
    return result + ' Only';
};
