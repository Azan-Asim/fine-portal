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

function formatTime(value?: string) {
    if (!value) return '--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function AttendanceTrackerCard({ employeeId }: AttendanceTrackerCardProps) {
    const [tracker, setTracker] = useState<AttendanceTodayTracker | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [nowTick, setNowTick] = useState(Date.now());

    const isCheckedIn = !!tracker && (tracker.canCheckOut || !!tracker.activeSession);
    const hasActiveSession = !!tracker?.activeSession;
    const canClockIn = !!tracker?.canCheckIn;
    const canClockOut = !!tracker?.canCheckOut;
    const hasHistory = !!tracker?.sessions?.length;

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

    useEffect(() => {
        const handle = setInterval(() => {
            setNowTick(Date.now());
        }, 1000);
        return () => clearInterval(handle);
    }, []);

    const completedWorkedSeconds = useMemo(() => {
        if (!tracker?.sessions?.length) return 0;

        return tracker.sessions.reduce((sum, session) => {
            if (!session.checkIn || !session.checkOut) return sum;

            const checkInMs = new Date(session.checkIn).getTime();
            const checkOutMs = new Date(session.checkOut).getTime();

            if (Number.isNaN(checkInMs) || Number.isNaN(checkOutMs)) return sum;
            const durationSeconds = Math.max(0, Math.floor((checkOutMs - checkInMs) / 1000));
            return sum + durationSeconds;
        }, 0);
    }, [tracker]);

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

    const activeWorkedSeconds = useMemo(() => {
        if (!tracker?.activeSession?.checkInUtc) return 0;
        const checkInMs = new Date(tracker.activeSession.checkInUtc).getTime();
        if (Number.isNaN(checkInMs)) return 0;
        return Math.max(0, Math.floor((nowTick - checkInMs) / 1000));
    }, [tracker, nowTick]);

    const totalWorkedSecondsLive = completedWorkedSeconds + activeWorkedSeconds;

    const currentCheckInTime = useMemo(() => {
        if (tracker?.activeSession?.checkInUtc) {
            return tracker.activeSession.checkInUtc;
        }
        const openSession = tracker?.sessions?.find((session) => session.checkIn && !session.checkOut);
        return openSession?.checkIn || '';
    }, [tracker]);

    const lastCheckOutTime = useMemo(() => {
        if (!tracker?.sessions?.length) return '';
        for (let index = tracker.sessions.length - 1; index >= 0; index -= 1) {
            const session = tracker.sessions[index];
            if (session.checkOut) return session.checkOut;
        }
        return '';
    }, [tracker]);

    const timelineEntries = useMemo(() => {
        if (!tracker?.sessions?.length) return [] as { id: string; type: 'Clock in' | 'Clock out'; time: string; active?: boolean }[];

        return tracker.sessions.flatMap((session, index) => {
            const items: { id: string; type: 'Clock in' | 'Clock out'; time: string; active?: boolean }[] = [];
            if (session.checkIn) {
                items.push({
                    id: `check-in-${index}-${session.checkIn}`,
                    type: 'Clock in',
                    time: session.checkIn,
                    active: !session.checkOut,
                });
            }
            if (session.checkOut) {
                items.push({
                    id: `check-out-${index}-${session.checkOut}`,
                    type: 'Clock out',
                    time: session.checkOut,
                });
            }
            return items;
        });
    }, [tracker]);

    const liveTimeLabel = new Date(nowTick).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

    const onCheckIn = async () => {
        setBusy(true);
        try {
            const next = await checkInAttendance(employeeId);
            setTracker(next);
            toast.success(`Checked in at ${formatTime(next.activeSession?.checkInUtc)}.`);
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
            const latestCheckout = [...(next.sessions || [])].reverse().find((session) => !!session.checkOut)?.checkOut;
            toast.success(`Checked out at ${formatTime(latestCheckout)}.`);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Check-out failed.';
            toast.error(message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="card" style={{ padding: 0, borderRadius: 24, overflow: 'hidden' }}>
            <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)', background: 'var(--bg-hover)' }}>
                <div className="flex items-center gap-2">
                    <Clock3 size={16} style={{ color: 'var(--accent)' }} />
                    <h3 className="font-semibold">{tracker ? formatDate(tracker.date) : 'Today'}</h3>
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
                <div className="p-5 space-y-5" style={{ background: '#f3f4f6' }}>
                    <div className="rounded-2xl p-4 bg-white border" style={{ borderColor: 'var(--border)' }}>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Hi, {tracker.employeeName}</p>
                        <p className="text-xl font-semibold mt-1">{hasActiveSession ? 'Clock in running' : hasHistory ? 'Clock out completed' : 'Ready to clock in'}</p>
                        <div className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <span>Worked today: {formatDuration(totalWorkedSecondsLive)}</span>
                            <span className="mx-2">•</span>
                            <span>Sessions: {tracker.sessionCount}</span>
                        </div>
                    </div>

                    <div className="relative pl-6">
                        <div className="absolute left-2.5 top-1 bottom-1 w-px" style={{ background: '#d1d5db' }} />

                        {!hasHistory && (
                            <div className="relative mb-4">
                                <span className="absolute" style={{ left: '-22px', top: '8px', height: 12, width: 12, borderRadius: 9999, background: '#9ca3af' }} />
                                <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Clock in</div>
                                <div className="rounded-2xl p-4 bg-white border" style={{ borderColor: 'var(--border)' }}>
                                    <p className="font-semibold text-lg">No attendance recorded yet</p>
                                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                        Tap clock in to start the day.
                                    </p>
                                </div>
                            </div>
                        )}

                        {timelineEntries.map((entry) => (
                            <div key={entry.id} className="relative mb-4">
                                <span
                                    className="absolute"
                                    style={{
                                        left: '-22px',
                                        top: '8px',
                                        height: 12,
                                        width: 12,
                                        borderRadius: 9999,
                                        background: entry.active ? '#3b82f6' : '#9ca3af',
                                    }}
                                />
                                <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{entry.type}</div>
                                <div className="rounded-2xl p-4 bg-white border" style={{ borderColor: 'var(--border)' }}>
                                    <p className="font-semibold text-2xl">Attendance recorded {formatTime(entry.time)}</p>
                                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                        {entry.type === 'Clock in' ? 'Check in time' : 'Check out time'}
                                    </p>
                                </div>
                            </div>
                        ))}

                        <div className="relative">
                            <span
                                className="absolute"
                                style={{ left: '-22px', top: '8px', height: 12, width: 12, borderRadius: 9999, background: '#3b82f6' }}
                            />
                            <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                                {hasActiveSession ? 'Clock out' : 'Clock in'}
                            </div>
                            <div className="rounded-2xl p-6 bg-white border" style={{ borderColor: 'var(--border)' }}>
                                <p className="text-6xl font-bold text-center tracking-wide">{liveTimeLabel}</p>
                                <div className="mt-6 flex justify-center">
                                    {hasActiveSession ? (
                                        <button
                                            className="btn-danger"
                                            disabled={busy || !canClockOut}
                                            onClick={onCheckOut}
                                            style={{ borderRadius: 9999, paddingLeft: 36, paddingRight: 36, minWidth: 220 }}
                                        >
                                            <LogOut size={18} /> Clock Out
                                        </button>
                                    ) : (
                                        <button
                                            className="btn-primary"
                                            disabled={busy || !canClockIn}
                                            onClick={onCheckIn}
                                            style={{ borderRadius: 9999, paddingLeft: 36, paddingRight: 36, minWidth: 220 }}
                                        >
                                            <LogIn size={18} /> Clock In
                                        </button>
                                    )}
                                </div>

                                <div className="mt-5 text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
                                    {hasActiveSession ? `Checked in at ${formatTime(currentCheckInTime)}` : `Last checked out at ${formatTime(lastCheckOutTime)}`}
                                </div>
                                <div className="mt-2 text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
                                    {hasActiveSession
                                        ? 'Clock out becomes available only after clock in.'
                                        : 'Clock in is available for a new session when the day is still open.'}
                                </div>
                                <div className="mt-2 text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
                                    Current session: {hasActiveSession ? formatDuration(activeWorkedSeconds) : '--'} • Last completed: {formatDuration(lastCompletedSessionSeconds)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
