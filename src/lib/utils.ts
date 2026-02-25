export function cn(...classes: (string | false | undefined | null)[]) {
    return classes.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number) {
    return `PKR ${amount.toLocaleString('en-PK')}`;
}

export function formatDate(dateStr: string) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-PK', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
}

export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
