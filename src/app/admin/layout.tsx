'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import { isFullAccessRole, parseRoleList } from '@/lib/roleAccess';
import RulesGate from '@/components/RulesGate';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const assignedRoles = parseRoleList(user?.roles && user.roles.length > 0 ? user.roles : user?.role);
    const hasAdminAccess = assignedRoles.some((role) => isFullAccessRole(role));

    useEffect(() => {
        if (!isLoading) {
            if (!user) router.push('/login');
            else if (!hasAdminAccess) router.push('/employee/dashboard');
        }
    }, [user, isLoading, hasAdminAccess, router]);

    if (isLoading || !user || !hasAdminAccess) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <div className="spinner" style={{ width: 36, height: 36 }} />
            </div>
        );
    }

    return (
        <RulesGate>
            <div className="flex min-h-screen">
                <Sidebar />
                <main className="flex-1 ml-64 flex flex-col min-h-screen overflow-x-hidden">
                    {children}
                </main>
            </div>
        </RulesGate>
    );
}
