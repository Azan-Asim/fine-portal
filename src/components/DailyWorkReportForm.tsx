'use client';

import React, { useState } from 'react';
import { submitDailyWorkReport } from '@/lib/googleSheets';
import toast from 'react-hot-toast';
import { DailyWorkSubmission } from '@/types';

interface DailyWorkReportFormProps {
    employeeId: string;
    employeeEmail: string;
    userRole?: string;
    onSuccess?: () => void;
}

type SubmissionType = 'Check-In' | 'Check-Out';

export default function DailyWorkReportForm({ employeeId, employeeEmail, userRole = 'employee', onSuccess }: DailyWorkReportFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [submissionType, setSubmissionType] = useState<SubmissionType>('Check-In');
    const [todaysSummary, setTodaysSummary] = useState('');
    const [yesterdaysPlan, setYesterdaysPlan] = useState('');
    const [tomorrowsPlan, setTomorrowsPlan] = useState('');
    const [challenges, setChallenges] = useState('');
    const [supportNeeded, setSupportNeeded] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!todaysSummary.trim() && submissionType === 'Check-Out') {
            toast.error('Work summary is required for Check-Out');
            return;
        }

        setIsLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const now = new Date().toISOString();

            const payload: Omit<DailyWorkSubmission, 'id' | 'createdAt'> = {
                employeeId,
                employeeEmail,
                date: today,
                submissionType,
                submissionTime: now,
                todaysSummary: submissionType === 'Check-Out' ? todaysSummary : '',
                yesterdaysPlan: submissionType === 'Check-In' ? yesterdaysPlan : '',
                tomorrowsPlan: submissionType === 'Check-Out' ? tomorrowsPlan : '',
                challenges,
                supportNeeded,
                submittedByRole: userRole,
            };

            await submitDailyWorkReport(payload);

            toast.success(`${submissionType} submitted successfully`);

            // Reset form
            setTodaysSummary('');
            setYesterdaysPlan('');
            setTomorrowsPlan('');
            setChallenges('');
            setSupportNeeded('');

            onSuccess?.();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to submit report';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Daily Work Report</h2>

            {/* Submission Type */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Submission Type</label>
                <select
                    value={submissionType}
                    onChange={(event) => setSubmissionType(event.target.value as SubmissionType)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="Check-In">Check-In</option>
                    <option value="Check-Out">Check-Out</option>
                </select>
            </div>

            {/* Check-In: Yesterday's Plan */}
            {submissionType === 'Check-In' && (
                <div>
                    <label htmlFor="yesterdaysPlan" className="block text-sm font-medium text-gray-700 mb-2">
                        Yesterday's Plan / What was supposed to be done today?
                    </label>
                    <textarea
                        id="yesterdaysPlan"
                        value={yesterdaysPlan}
                        onChange={(e) => setYesterdaysPlan(e.target.value)}
                        placeholder="Describe what you were planned to do today..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                    />
                </div>
            )}

            {/* Check-Out: Today's Summary */}
            {submissionType === 'Check-Out' && (
                <div>
                    <label htmlFor="todaysSummary" className="block text-sm font-medium text-gray-700 mb-2">
                        Today's Work Summary <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="todaysSummary"
                        value={todaysSummary}
                        onChange={(e) => setTodaysSummary(e.target.value)}
                        placeholder="Describe what you accomplished today..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                        required
                    />
                </div>
            )}

            {/* Check-Out: Tomorrow's Plan */}
            {submissionType === 'Check-Out' && (
                <div>
                    <label htmlFor="tomorrowsPlan" className="block text-sm font-medium text-gray-700 mb-2">
                        Tomorrow's Plan / What will you do next?
                    </label>
                    <textarea
                        id="tomorrowsPlan"
                        value={tomorrowsPlan}
                        onChange={(e) => setTomorrowsPlan(e.target.value)}
                        placeholder="Describe what you plan to do tomorrow..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                    />
                </div>
            )}

            {/* Challenges & Support (Both) */}
            <div>
                <label htmlFor="challenges" className="block text-sm font-medium text-gray-700 mb-2">
                    Challenges / Blockers
                </label>
                <textarea
                    id="challenges"
                    value={challenges}
                    onChange={(e) => setChallenges(e.target.value)}
                    placeholder="Any challenges or blockers you're facing?"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                />
            </div>

            {/* Support Needed (Both) */}
            <div>
                <label htmlFor="supportNeeded" className="block text-sm font-medium text-gray-700 mb-2">
                    Support Needed
                </label>
                <textarea
                    id="supportNeeded"
                    value={supportNeeded}
                    onChange={(e) => setSupportNeeded(e.target.value)}
                    placeholder="What help or resources do you need?"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                />
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
            >
                {isLoading ? 'Submitting...' : `Submit ${submissionType}`}
            </button>

            {/* Info Message */}
            <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-800 text-sm">
                <p className="font-semibold mb-1">📋 How it works:</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>You can submit Check-In and Check-Out at any time within the same day.</li>
                    <li>Check-In is allowed once per day per person.</li>
                    <li>Check-Out is allowed once per day, only after a Check-In exists for that day.</li>
                </ul>
            </div>
        </form>
    );
}
