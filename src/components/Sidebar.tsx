'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
    LayoutDashboard, Users, FileText, CreditCard, Building2, LogOut, ShieldCheck, DollarSign, CalendarCheck2, Award, FolderKanban, ScrollText, Package2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { canManageEmployees, canViewTeam, isFullAccessRole, parseRoleList } from '@/lib/roleAccess';
import { UserRole } from '@/types';

const adminLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/projects', label: 'Projects', icon: FolderKanban },
    { href: '/admin/employees', label: 'Employees', icon: Users },
    { href: '/admin/assets', label: 'Assets', icon: Package2 },
    { href: '/admin/penalties', label: 'Penalties', icon: FileText },
    { href: '/admin/issue-penalty', label: 'Issue Penalty', icon: ShieldCheck },
    { href: '/admin/attendance', label: 'Attendance', icon: CalendarCheck2 },
    { href: '/admin/rules', label: 'Rules', icon: ScrollText },
    { href: '/admin/expenses', label: 'Finance', icon: DollarSign },
    { href: '/admin/payroll', label: 'Payroll', icon: CreditCard },
    { href: '/bank-info', label: 'Bank Info', icon: Building2 },
];

const employeeLinks = [
    { href: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/employee/attendance', label: 'Attendance', icon: CalendarCheck2 },
    { href: '/employee/assets', label: 'Assets', icon: Package2 },
    { href: '/employee/projects', label: 'Projects', icon: FolderKanban },
    { href: '/employee/performance', label: 'Performance Record', icon: Award },
    { href: '/employee/salary-slips', label: 'Salary Slips', icon: FileText },
    { href: '/employee/rules', label: 'Rules', icon: ScrollText },
    { href: '/bank-info', label: 'Bank Info', icon: Building2 },
];

const leadLinks = [
    { href: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/employee/attendance', label: 'Attendance', icon: CalendarCheck2 },
    { href: '/employee/assets', label: 'Assets', icon: Package2 },
    { href: '/employee/projects', label: 'Projects', icon: FolderKanban },
    { href: '/employee/performance', label: 'Team Performance', icon: Award },
    { href: '/employee/salary-slips', label: 'Salary Slips', icon: FileText },
    { href: '/employee/rules', label: 'Rules', icon: ScrollText },
    { href: '/bank-info', label: 'Bank Info', icon: Building2 },
];

export default function Sidebar() {
    const { user, logout, switchActiveRole } = useAuth();
    const pathname = usePathname();
    const assignedRoles = parseRoleList(user?.roles && user.roles.length > 0 ? user.roles : user?.role);
    const hasAdminAccess = assignedRoles.some((role) => isFullAccessRole(role));
    const hasLeadAccess = assignedRoles.includes('lead');
    const hasEmployeeAccess = assignedRoles.some((role) => !isFullAccessRole(role) && role !== 'lead');

    const links = [
        ...(hasAdminAccess ? adminLinks : []),
        ...(hasLeadAccess ? leadLinks : []),
        ...(hasEmployeeAccess ? employeeLinks : []),
    ].filter((link, index, list) => list.findIndex((item) => item.href === link.href) === index);

    const filteredLinks = links.filter((link) => {
        if (link.href === '/admin/employees') return canManageEmployees(assignedRoles);
        return true;
    });

    const roleLabelMap: Record<UserRole, string> = {
        admin: 'Admin',
        hr: 'HR',
        manager: 'Manager',
        lead: 'Lead',
        employee: 'Employee',
    };

    return (
        <aside className="fixed left-0 top-0 h-full w-64 flex flex-col"
            style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}>

            {/* Brand */}
            <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-black font-bold text-sm"
                        style={{ background: 'var(--accent)' }}>
                        DT
                    </div>
                    <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Devsinn Team Management Portal</p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {assignedRoles.length > 1
                                ? 'Multi Role Portal'
                                : hasAdminAccess
                                    ? 'Management Portal'
                                    : canViewTeam(assignedRoles)
                                        ? 'Lead Portal'
                                        : 'Employee Portal'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {filteredLinks.map(({ href, label, icon: Icon }) => (
                    (() => {
                        const isActive = pathname === href || pathname.startsWith(`${href}/`);
                        return (
                    <Link
                        key={href}
                        href={href}
                        className={cn('sidebar-link', isActive && 'active')}
                    >
                        <Icon size={18} />
                        {label}
                    </Link>
                        );
                    })()
                ))}
            </nav>

            {/* User & Logout */}
            <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="px-3 py-2 rounded-lg mb-3" style={{ background: 'var(--bg-hover)' }}>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
                    {user && user.roles.length > 1 ? (
                        <div className="mt-2">
                            <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Active Role</label>
                            <select
                                className="select mt-1"
                                value={user.activeRole}
                                onChange={(event) => switchActiveRole(event.target.value as UserRole)}
                            >
                                {user.roles.map((role) => (
                                    <option key={role} value={role}>{roleLabelMap[role]}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                            Role: {user?.role ? roleLabelMap[user.role] : 'Employee'}
                        </p>
                    )}
                </div>
                <button onClick={logout} className="sidebar-link w-full" style={{ color: 'var(--danger)' }}>
                    <LogOut size={18} />
                    Logout
                </button>
            </div>
        </aside>
    );
}
