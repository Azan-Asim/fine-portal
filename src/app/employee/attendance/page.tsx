'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import DailyWorkReportForm from '@/components/DailyWorkReportForm';
import DailyAttendanceView from '@/components/DailyAttendanceView';

/**
 * Employee Attendance Page
 * Route: /employee/attendance
 *
 * Allows employees to:
 * - Submit daily check-in anytime during the day
 * - Submit daily check-out anytime after a check-in exists for the same day
 * - View their recent submissions
 */
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
        <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">Attendance & Daily Report</h1>
                    <p className="text-gray-600">Welcome, {user.name}. Submit check-in and check-out from the same form whenever needed during the day.</p>
                </div>

                {/* Main Form */}
                <div className="mb-8">
                    <DailyWorkReportForm 
                        employeeId={user.id} 
                        employeeEmail={user.email}
                        userRole={user.activeRole}
                        onSuccess={() => {
                            // Optional: Show success message or refresh data
                        }}
                    />
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                        <h3 className="font-semibold text-blue-900 mb-2">📋 Check-In</h3>
                        <p className="text-sm text-blue-800">
                            Submit anytime to mark the start of your workday and share your daily plan.
                        </p>
                    </div>

                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                        <h3 className="font-semibold text-green-900 mb-2">✅ Check-Out</h3>
                        <p className="text-sm text-green-800">
                            Submit anytime after check-in to mark the end of your workday and summarize your accomplishments.
                        </p>
                    </div>

                    <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
                        <h3 className="font-semibold text-purple-900 mb-2">⏰ Hours Calculation</h3>
                        <p className="text-sm text-purple-800">
                            Your daily working hours are automatically calculated from check-in/out times.
                        </p>
                    </div>
                </div>

                {/* Tips Section */}
                <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">💡 Tips</h2>
                    <ul className="space-y-2 text-gray-700">
                        <li>✓ Use the same form for both check-in and check-out on the same day</li>
                        <li>✓ Check-out is only allowed after a check-in exists for that day</li>
                        <li>✓ Previous day's records are automatically locked at midnight</li>
                        <li>✓ Contact HR if you need to make corrections to past records</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
