'use client';

import { cn } from '@/lib/utils';

export interface BarChartItem {
    label: string;
    value: number;
    color?: string;
    hint?: string;
}

interface SimpleBarChartProps {
    title: string;
    subtitle?: string;
    items: BarChartItem[];
    emptyText?: string;
}

export default function SimpleBarChart({ title, subtitle, items, emptyText = 'No data available yet.' }: SimpleBarChartProps) {
    const maxValue = Math.max(...items.map((item) => Math.abs(item.value)), 0);

    return (
        <div className="card" style={{ padding: 0 }}>
            <div className="px-6 py-4 border-b flex items-start justify-between gap-3" style={{ borderColor: 'var(--border)' }}>
                <div>
                    <h3 className="font-semibold">{title}</h3>
                    {subtitle ? <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p> : null}
                </div>
            </div>

            <div className="p-6 space-y-4">
                {items.length === 0 ? (
                    <p className="text-sm text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                        {emptyText}
                    </p>
                ) : (
                    items.map((item, index) => {
                        const width = maxValue > 0 ? Math.max(6, (Math.abs(item.value) / maxValue) * 100) : 6;
                        return (
                            <div key={`${item.label}-${index}`} className="space-y-1.5">
                                <div className="flex items-center justify-between gap-3 text-sm">
                                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>{item.hint || item.value.toLocaleString('en-PK')}</span>
                                </div>
                                <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                                    <div
                                        className={cn('h-full rounded-full transition-all duration-300')}
                                        style={{
                                            width: `${width}%`,
                                            background: item.color || 'var(--accent)',
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}