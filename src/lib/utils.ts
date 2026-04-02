export function cn(...classes: (string | false | undefined | null)[]) {
    return classes.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number | string | null | undefined) {
    const normalized = typeof amount === 'number'
        ? amount
        : Number(amount ?? 0);

    const safeAmount = Number.isFinite(normalized) ? normalized : 0;
    return `PKR ${safeAmount.toLocaleString('en-PK')}`;
}

export function formatDate(dateStr: string) {
    if (!dateStr) return '—';

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';

    return date.toLocaleDateString('en-PK', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
}

export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
