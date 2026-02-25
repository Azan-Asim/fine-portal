'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
    LayoutDashboard, Users, FileText, CreditCard, Building2, LogOut, ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

const adminLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/employees', label: 'Employees', icon: Users },
    { href: '/admin/penalties', label: 'Penalties', icon: FileText },
    { href: '/admin/issue-penalty', label: 'Issue Penalty', icon: ShieldCheck },
    { href: '/bank-info', label: 'Bank Info', icon: Building2 },
];

const employeeLinks = [
    { href: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/bank-info', label: 'Bank Info', icon: Building2 },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const links = user?.role === 'admin' ? adminLinks : employeeLinks;

    return (
        <aside className="fixed left-0 top-0 h-full w-64 flex flex-col"
            style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}>

            {/* Brand */}
            <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-black font-bold text-sm"
                        style={{ background: 'var(--accent)' }}>
                        FP
                    </div>
                    <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Fine Portal</p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {user?.role === 'admin' ? 'Admin Panel' : 'Employee Portal'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {links.map(({ href, label, icon: Icon }) => (
                    <Link
                        key={href}
                        href={href}
                        className={cn('sidebar-link', pathname === href && 'active')}
                    >
                        <Icon size={18} />
                        {label}
                    </Link>
                ))}
            </nav>

            {/* User & Logout */}
            <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="px-3 py-2 rounded-lg mb-3" style={{ background: 'var(--bg-hover)' }}>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
                </div>
                <button onClick={logout} className="sidebar-link w-full" style={{ color: 'var(--danger)' }}>
                    <LogOut size={18} />
                    Logout
                </button>
            </div>
        </aside>
    );
}
