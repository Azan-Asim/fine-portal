'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import CompanyAssetsView from '@/components/assets/CompanyAssetsView';

export default function EmployeeAssetsPage() {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user) {
            router.push('/login');
        }
    }, [user, router]);

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-gray-600 text-lg">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <CompanyAssetsView
            basePath="/employee/dashboard"
            userId={user.id}
            userRole={user.activeRole}
            canManage={false}
        />
    );
}
