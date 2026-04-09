'use client';

import { useEffect, useMemo, useState } from 'react';
import { AttendanceTodayTracker } from '@/types';
import { checkInAttendance, checkOutAttendance, getAttendanceTodayTracker } from '@/lib/googleSheets';
import { Clock3, LogIn, LogOut, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface AttendanceTrackerCardProps {
    employeeId: string;
}

function formatDuration(seconds: number) {
    const safe = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const remaining = safe % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
}

function statusBadgeClass(status: string) {
    if (status === 'Critical') return 'bg-red-500/10 text-red-500';
    if (status === 'Attention') return 'bg-amber-500/10 text-amber-500';
    if (status === 'Late') return 'bg-red-500/10 text-red-500';
    if (status === 'Overtime') return 'bg-indigo-500/10 text-indigo-400';
    if (status === 'Half Day') return 'bg-orange-500/10 text-orange-500';
    return 'bg-green-500/10 text-green-500';
}

export default function AttendanceTrackerCard({ employeeId }: AttendanceTrackerCardProps) {
    const [tracker, setTracker] = useState<AttendanceTodayTracker | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);

    const isCheckedIn = !!tracker && (tracker.canCheckOut || !!tracker.activeSession);

    const refresh = async (silent?: boolean) => {
        if (!silent) setLoading(true);
        try {
            const next = await getAttendanceTodayTracker(employeeId);
            setTracker(next);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to load attendance tracker.';
            toast.error(message);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, [employeeId]);

    useEffect(() => {
        const handle = setInterval(() => {
            refresh(true);
        }, 30_000);
        return () => clearInterval(handle);
    }, [employeeId]);

    const totalWorkedSeconds = tracker?.totalWorkedSeconds || 0;

    const lastCompletedSessionSeconds = useMemo(() => {
        if (!tracker?.sessions?.length) return 0;

        for (let index = tracker.sessions.length - 1; index >= 0; index -= 1) {
            const session = tracker.sessions[index];
            if (!session.checkIn || !session.checkOut) continue;

            const checkInMs = new Date(session.checkIn).getTime();
            const checkOutMs = new Date(session.checkOut).getTime();

            if (Number.isNaN(checkInMs) || Number.isNaN(checkOutMs)) continue;
            return Math.max(0, Math.floor((checkOutMs - checkInMs) / 1000));
        }

        return 0;
    }, [tracker]);

    const isDebugVisible = process.env.NODE_ENV !== 'production';

    const onCheckIn = async () => {
        setBusy(true);
        try {
            const next = await checkInAttendance(employeeId);
            setTracker(next);
            toast.success('Checked in successfully.');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Check-in failed.';
            toast.error(message);
        } finally {
            setBusy(false);
        }
    };

    const onCheckOut = async () => {
        setBusy(true);
        try {
            const next = await checkOutAttendance(employeeId);
            setTracker(next);
            toast.success('Checked out successfully.');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Check-out failed.';
            toast.error(message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="card" style={{ padding: 0 }}>
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                    <Clock3 size={16} style={{ color: 'var(--accent)' }} />
                    <h3 className="font-semibold">Today Attendance Tracker</h3>
                </div>
                <button className="btn-secondary" onClick={() => refresh()} disabled={busy || loading}>
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {loading ? (
                <div className="p-6" style={{ color: 'var(--text-secondary)' }}>Loading attendance...</div>
            ) : !tracker ? (
                <div className="p-6" style={{ color: 'var(--danger)' }}>Unable to load attendance tracker.</div>
            ) : (
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="rounded-lg p-3" style={{ background: 'var(--bg-hover)' }}>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Current Status</p>
                            <p className="text-xl font-semibold">{isCheckedIn ? 'Checked In' : 'Checked Out'}</p>
                        </div>
                        <div className="rounded-lg p-3" style={{ background: 'var(--bg-hover)' }}>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total Worked Today</p>
                            <p className="text-xl font-semibold">{formatDuration(totalWorkedSeconds)}</p>
                        </div>
                        <div className="rounded-lg p-3" style={{ background: 'var(--bg-hover)' }}>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Session Count</p>
                            <p className="text-xl font-semibold">{tracker.sessionCount}</p>
                        </div>
                        <div className="rounded-lg p-3" style={{ background: 'var(--bg-hover)' }}>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Daily Status</p>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${statusBadgeClass(tracker.attendanceStatus)}`}>
                                {tracker.attendanceStatus}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <span>Start: {tracker.policy.startWorkingTime}</span>
                        <span>Grace: {tracker.policy.gracePeriodMinutes}m</span>
                        <span>Required: {tracker.policy.requiredDailyWorkingHours}h</span>
                        <span>Last session: {formatDuration(lastCompletedSessionSeconds)}</span>
                        <span>Late this month: {tracker.lateCountInMonth}</span>
                        <span>Leave from late: {tracker.leaveDeductionFromLate}</span>
                        <span>Paid leave deduction: {tracker.paidLeaveDeductions}</span>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {isCheckedIn ? (
                            <button
                                className="btn-danger"
                                disabled={busy || !tracker.canCheckOut}
                                onClick={onCheckOut}
                            >
                                <LogOut size={16} /> Check-Out
                            </button>
                        ) : (
                            <button
                                className="btn-primary"
                                disabled={busy || !tracker.canCheckIn}
                                onClick={onCheckIn}
                            >
                                <LogIn size={16} /> Check-In
                            </button>
                        )}
                    </div>

                    {isDebugVisible && (
                        <div
                            className="rounded-lg p-3 text-xs"
                            style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                        >
                            <p className="font-semibold mb-2">Timer Debug (Dev Only)</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <p>Total worked seconds: {tracker.totalWorkedSeconds}</p>
                                <p>Last completed session seconds: {lastCompletedSessionSeconds}</p>
                                <p>Backend active seconds: {tracker.activeSession?.activeDurationSeconds || 0}</p>
                                <p>Has active session: {tracker.activeSession ? 'yes' : 'no'}</p>
                                <p>Session ID: {tracker.activeSession?.sessionId || 'none'}</p>
                                <p>canCheckIn: {tracker.canCheckIn ? 'yes' : 'no'}</p>
                                <p>canCheckOut: {tracker.canCheckOut ? 'yes' : 'no'}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
