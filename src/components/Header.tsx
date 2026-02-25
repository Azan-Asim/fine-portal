'use client';

import { useAuth } from '@/context/AuthContext';
import { Bell } from 'lucide-react';

interface HeaderProps {
    title: string;
    subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
    const { user } = useAuth();

    return (
        <header className="flex items-center justify-between px-8 py-5 border-b"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-primary)' }}>
            <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h1>
                {subtitle && <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>}
            </div>
            <div className="flex items-center gap-4">
                <button className="relative p-2 rounded-lg transition-colors"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <Bell size={18} style={{ color: 'var(--text-secondary)' }} />
                </button>
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm"
                    style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
            </div>
        </header>
    );
}
