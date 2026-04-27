'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AttendanceTrackerCard from '@/components/attendance/AttendanceTrackerCard';

export default function EmployeeAttendancePage() {
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
        <div className="min-h-screen py-4 px-3" style={{ background: '#e5e7eb' }}>
            <div className="max-w-md mx-auto">
                <AttendanceTrackerCard employeeId={user.id} />
            </div>
        </div>
    );
}
