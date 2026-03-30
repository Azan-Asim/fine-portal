'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import {
    AttendanceDayType,
    AttendanceRecord,
    AttendanceStatus,
    BreakSession,
    Employee,
    WorkSession,
} from '@/types';
import {
    getAttendanceByDate,
    getEmployees,
    setHolidayForDate,
    upsertAttendanceRecord,
} from '@/lib/googleSheets';
import { CheckCircle2, Plus, Trash2, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

const STATUS_OPTIONS: AttendanceStatus[] = ['Present', 'Absent', 'Leave'];

type RowDraft = {
    status: AttendanceStatus;
    leaveReason: string;
    trackingHours: number;
    workSessions: WorkSession[];
    breakSessions: BreakSession[];
};

function emptyWorkSession(): WorkSession {
    return { checkIn: '', checkOut: '' };
}

function emptyBreak(): BreakSession {
    return { start: '', end: '' };
}

export default function AttendancePage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [dayType, setDayType] = useState<AttendanceDayType>('Working Day');
    const [recordsByEmployee, setRecordsByEmployee] = useState<Record<string, AttendanceRecord>>({});
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [draftByEmployee, setDraftByEmployee] = useState<Record<string, RowDraft>>({});
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string>('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [employeeList, attendance] = await Promise.all([
                getEmployees(),
                getAttendanceByDate(date),
            ]);
            setEmployees(employeeList.filter((e) => e.status !== 'Left'));

            const holiday = attendance.find((r) => r.employeeId === 'GLOBAL' && r.status === 'Holiday');
            setDayType(holiday ? 'Holiday' : 'Working Day');

            const mapped: Record<string, AttendanceRecord> = {};
            const drafts: Record<string, RowDraft> = {};

            attendance
                .filter((r) => r.employeeId !== 'GLOBAL')
                .forEach((r) => {
                    mapped[r.employeeId] = r;
                    drafts[r.employeeId] = {
                        status: r.status === 'Holiday' ? 'Absent' : (r.status as AttendanceStatus),
                        leaveReason: r.leaveReason || '',
                        trackingHours: Number(r.trackingHours || 0),
                        workSessions: r.workSessions?.length ? r.workSessions : [emptyWorkSession()],
                        breakSessions: r.breakSessions?.length ? r.breakSessions : [emptyBreak()],
                    };
                });

            setRecordsByEmployee(mapped);
            setDraftByEmployee(drafts);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to load attendance data.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [date]);

    useEffect(() => {
        load();
    }, [load]);

    const ensureDraft = (employeeId: string): RowDraft => {
        const existing = draftByEmployee[employeeId];
        if (existing) return existing;
        return {
            status: 'Absent',
            leaveReason: '',
            trackingHours: 0,
            workSessions: [emptyWorkSession()],
            breakSessions: [emptyBreak()],
        };
    };

    const updateDraft = (employeeId: string, updater: (prev: RowDraft) => RowDraft) => {
        setDraftByEmployee((prev) => ({
            ...prev,
            [employeeId]: updater(prev[employeeId] || ensureDraft(employeeId)),
        }));
    };

    const markHoliday = async () => {
        try {
            await setHolidayForDate(date);
            setDayType('Holiday');
            toast.success('Holiday marked for selected date.');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to mark holiday.';
            toast.error(message);
        }
    };

    const saveEmployeeAttendance = async (employeeId: string) => {
        const d = ensureDraft(employeeId);
        if (d.status === 'Leave' && !d.leaveReason.trim()) {
            toast.error('Leave reason is required.');
            return;
        }

        try {
            setSavingId(employeeId);
            const saved = await upsertAttendanceRecord({
                employeeId,
                date,
                dayType: 'Working Day',
                status: d.status,
                leaveReason: d.leaveReason,
                trackingHours: d.status === 'Present' ? Number(d.trackingHours || 0) : 0,
                workSessions: d.status === 'Present' ? d.workSessions : [],
                breakSessions: d.status === 'Present' ? d.breakSessions : [],
            });

            setRecordsByEmployee((prev) => ({ ...prev, [employeeId]: saved }));
            toast.success('Attendance saved.');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to save attendance.';
            toast.error(message);
        } finally {
            setSavingId('');
        }
    };

    const employeesWithState = useMemo(() => {
        return employees.map((e) => ({ employee: e, record: recordsByEmployee[e.id] }));
    }, [employees, recordsByEmployee]);

    return (
        <div className="page-enter flex flex-col h-full overflow-y-auto">
            <Header title="Attendance" subtitle="Mark daily attendance and review employee monthly records" />

            <div className="p-6 space-y-6">
                <div className="card">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="label">Date</label>
                            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>
                        <div>
                            <label className="label">Day Type</label>
                            <select className="input" value={dayType} onChange={(e) => setDayType(e.target.value as AttendanceDayType)}>
                                <option value="Working Day">Working Day</option>
                                <option value="Holiday">Holiday</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button className="btn-primary w-full" onClick={load}>Reload</button>
                        </div>
                    </div>
                </div>

                {dayType === 'Holiday' ? (
                    <div className="card">
                        <div className="flex items-center justify-between gap-4">
                            <p style={{ color: 'var(--text-secondary)' }}>
                                Selected day is holiday. Attendance rows are hidden for this date.
                            </p>
                            <button className="btn-primary" onClick={markHoliday}>
                                <CheckCircle2 size={16} /> Confirm Holiday
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="card" style={{ padding: 0 }}>
                        <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
                            <UserCheck size={18} style={{ color: 'var(--accent)' }} />
                            <h2 className="font-semibold">Employees Attendance</h2>
                        </div>

                        {loading ? (
                            <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>Loading attendance...</div>
                        ) : (
                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Employee</th>
                                            <th>Status Today</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employeesWithState.map(({ employee, record }) => {
                                            const draft = ensureDraft(employee.id);
                                            const isOpen = selectedEmployeeId === employee.id;
                                            return (
                                                <>
                                                    <tr key={employee.id}>
                                                        <td>
                                                            <div className="font-medium">{employee.name}</div>
                                                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                                {employee.jobPosition || 'No Designation'}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="px-2 py-1 rounded text-xs font-semibold" style={{ background: 'var(--bg-hover)' }}>
                                                                {record?.status || 'Not Marked'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    className="btn-secondary"
                                                                    onClick={() => setSelectedEmployeeId(isOpen ? '' : employee.id)}
                                                                >
                                                                    {isOpen ? 'Close' : 'Select'}
                                                                </button>
                                                                <Link className="btn-primary" href={`/admin/attendance/${employee.id}`}>
                                                                    Detail Employee
                                                                </Link>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {isOpen && (
                                                        <tr key={`${employee.id}-details`}>
                                                            <td colSpan={3}>
                                                                <div className="p-4 rounded" style={{ background: 'var(--bg-hover)' }}>
                                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                        <div>
                                                                            <label className="label">Date</label>
                                                                            <input className="input" type="date" value={date} readOnly />
                                                                        </div>
                                                                        <div>
                                                                            <label className="label">Status</label>
                                                                            <select
                                                                                className="input"
                                                                                value={draft.status}
                                                                                onChange={(e) => updateDraft(employee.id, (prev) => ({ ...prev, status: e.target.value as AttendanceStatus }))}
                                                                            >
                                                                                {STATUS_OPTIONS.map((s) => (
                                                                                    <option key={s} value={s}>{s}</option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                        <div className="flex items-end">
                                                                            <button
                                                                                className="btn-primary w-full"
                                                                                onClick={() => saveEmployeeAttendance(employee.id)}
                                                                                disabled={savingId === employee.id}
                                                                            >
                                                                                {savingId === employee.id ? 'Saving...' : 'Confirm'}
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    {draft.status === 'Leave' && (
                                                                        <div className="mt-4">
                                                                            <label className="label">Leave Reason</label>
                                                                            <textarea
                                                                                className="input"
                                                                                value={draft.leaveReason}
                                                                                onChange={(e) => updateDraft(employee.id, (prev) => ({ ...prev, leaveReason: e.target.value }))}
                                                                                rows={3}
                                                                                placeholder="Enter leave reason"
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    {draft.status === 'Present' && (
                                                                        <div className="mt-4 space-y-4">
                                                                            <div>
                                                                                <label className="label">Tracking Hours</label>
                                                                                <input
                                                                                    className="input"
                                                                                    type="number"
                                                                                    step="0.25"
                                                                                    min="0"
                                                                                    value={draft.trackingHours}
                                                                                    onChange={(e) => updateDraft(employee.id, (prev) => ({ ...prev, trackingHours: Number(e.target.value || 0) }))}
                                                                                />
                                                                            </div>

                                                                            <div>
                                                                                <div className="flex items-center justify-between mb-2">
                                                                                    <label className="label">Working Time (Check In / Check Out)</label>
                                                                                    <button
                                                                                        className="btn-secondary"
                                                                                        onClick={() => updateDraft(employee.id, (prev) => ({ ...prev, workSessions: [...prev.workSessions, emptyWorkSession()] }))}
                                                                                    >
                                                                                        <Plus size={14} /> Add Working Time
                                                                                    </button>
                                                                                </div>
                                                                                <div className="space-y-2">
                                                                                    {draft.workSessions.map((session, idx) => (
                                                                                        <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                                                            <input
                                                                                                type="time"
                                                                                                className="input"
                                                                                                value={session.checkIn}
                                                                                                onChange={(e) => updateDraft(employee.id, (prev) => ({
                                                                                                    ...prev,
                                                                                                    workSessions: prev.workSessions.map((s, i) => i === idx ? { ...s, checkIn: e.target.value } : s),
                                                                                                }))}
                                                                                            />
                                                                                            <input
                                                                                                type="time"
                                                                                                className="input"
                                                                                                value={session.checkOut}
                                                                                                onChange={(e) => updateDraft(employee.id, (prev) => ({
                                                                                                    ...prev,
                                                                                                    workSessions: prev.workSessions.map((s, i) => i === idx ? { ...s, checkOut: e.target.value } : s),
                                                                                                }))}
                                                                                            />
                                                                                            <button
                                                                                                className="btn-danger"
                                                                                                onClick={() => updateDraft(employee.id, (prev) => ({
                                                                                                    ...prev,
                                                                                                    workSessions: prev.workSessions.filter((_, i) => i !== idx),
                                                                                                }))}
                                                                                            >
                                                                                                <Trash2 size={14} /> Remove
                                                                                            </button>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>

                                                                            <div>
                                                                                <div className="flex items-center justify-between mb-2">
                                                                                    <label className="label">Breaks Between Working Hours</label>
                                                                                    <button
                                                                                        className="btn-secondary"
                                                                                        onClick={() => updateDraft(employee.id, (prev) => ({ ...prev, breakSessions: [...prev.breakSessions, emptyBreak()] }))}
                                                                                    >
                                                                                        <Plus size={14} /> Add Break
                                                                                    </button>
                                                                                </div>
                                                                                <div className="space-y-2">
                                                                                    {draft.breakSessions.map((br, idx) => (
                                                                                        <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                                                            <input
                                                                                                type="time"
                                                                                                className="input"
                                                                                                value={br.start}
                                                                                                onChange={(e) => updateDraft(employee.id, (prev) => ({
                                                                                                    ...prev,
                                                                                                    breakSessions: prev.breakSessions.map((b, i) => i === idx ? { ...b, start: e.target.value } : b),
                                                                                                }))}
                                                                                            />
                                                                                            <input
                                                                                                type="time"
                                                                                                className="input"
                                                                                                value={br.end}
                                                                                                onChange={(e) => updateDraft(employee.id, (prev) => ({
                                                                                                    ...prev,
                                                                                                    breakSessions: prev.breakSessions.map((b, i) => i === idx ? { ...b, end: e.target.value } : b),
                                                                                                }))}
                                                                                            />
                                                                                            <button
                                                                                                className="btn-danger"
                                                                                                onClick={() => updateDraft(employee.id, (prev) => ({
                                                                                                    ...prev,
                                                                                                    breakSessions: prev.breakSessions.filter((_, i) => i !== idx),
                                                                                                }))}
                                                                                            >
                                                                                                <Trash2 size={14} /> Remove
                                                                                            </button>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
