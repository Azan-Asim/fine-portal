'use client';

import type { LucideIcon } from 'lucide-react';

export interface DashboardStatCard {
    label: string;
    value: string | number;
    sub: string;
    icon: LucideIcon;
    color: string;
}

interface DashboardStatGridProps {
    cards: DashboardStatCard[];
    columns?: number;
}

export default function DashboardStatGrid({ cards, columns = 4 }: DashboardStatGridProps) {
    const minWidth = columns >= 5 ? 180 : 220;

    return (
        <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))` }}
        >
            {cards.map(({ label, value, sub, icon: Icon, color }) => (
                <div key={label} className="stat-card">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                            <Icon size={16} style={{ color }} />
                        </div>
                    </div>
                    <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{sub}</p>
                </div>
            ))}
        </div>
    );
}