'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import { EmployeeMonthlyAttendanceSummary } from '@/types';
import { getEmployeeMonthlyAttendance } from '@/lib/googleSheets';
import { generateEmployeeAttendancePdf } from '@/lib/attendancePdf';
import toast from 'react-hot-toast';
import { Download, RefreshCw } from 'lucide-react';
import Link from 'next/link';

type Props = {
    params: Promise<{ employeeId: string }>;
};

export default function EmployeeAttendanceDetailPage({ params }: Props) {
    const [employeeId, setEmployeeId] = useState('');
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<EmployeeMonthlyAttendanceSummary | null>(null);

    useEffect(() => {
        params.then((p) => setEmployeeId(p.employeeId));
    }, [params]);

    const load = async (empId = employeeId, m = month, y = year) => {
        if (!empId) return;
        setLoading(true);
        try {
            const result = await getEmployeeMonthlyAttendance(empId, m, y);
            setSummary(result);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load monthly attendance.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [employeeId]);

    const monthOptions = useMemo(() => [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' },
    ], []);

    const downloadPdf = () => {
        if (!summary) return;
        try {
            generateEmployeeAttendancePdf(summary);
        } catch (error: any) {
            toast.error(error.message || 'Failed to open PDF.');
        }
    };

    return (
        <div className="page-enter flex flex-col h-full overflow-y-auto">
            <Header title="Employee Attendance Detail" subtitle="Monthly attendance records and hours" />

            <div className="p-6 space-y-6">
                <div className="flex flex-wrap gap-3">
                    <Link href="/admin/attendance" className="btn-secondary">Back to Attendance</Link>
                    <button className="btn-primary" onClick={downloadPdf} disabled={!summary}>
                        <Download size={16} /> Download PDF
                    </button>
                </div>

                <div className="card">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="label">Month</label>
                            <select className="input" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                                {monthOptions.map((m) => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label">Year</label>
                            <input className="input" type="number" value={year} onChange={(e) => setYear(Number(e.target.value || new Date().getFullYear()))} />
                        </div>
                        <div className="md:col-span-2 flex items-end">
                            <button className="btn-primary w-full" onClick={() => load()}>
                                <RefreshCw size={16} /> Load Record
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="card text-center" style={{ color: 'var(--text-secondary)' }}>Loading...</div>
                ) : !summary ? (
                    <div className="card text-center" style={{ color: 'var(--text-secondary)' }}>No data available.</div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <div className="card"><div className="label">Working Hours</div><div className="text-2xl font-bold">{summary.totalWorkingHours.toFixed(2)}</div></div>
                            <div className="card"><div className="label">Tracking Hours</div><div className="text-2xl font-bold">{summary.totalTrackingHours.toFixed(2)}</div></div>
                            <div className="card"><div className="label">Presents</div><div className="text-2xl font-bold">{summary.totalPresents}</div></div>
                            <div className="card"><div className="label">Leaves</div><div className="text-2xl font-bold">{summary.totalLeaves}</div></div>
                            <div className="card"><div className="label">Holidays</div><div className="text-2xl font-bold">{summary.totalHolidays}</div></div>
                            <div className="card"><div className="label">Absents</div><div className="text-2xl font-bold">{summary.totalAbsents}</div></div>
                        </div>

                        <div className="card" style={{ padding: 0 }}>
                            <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                                <h3 className="font-semibold">Daily Check-In / Check-Out Record</h3>
                            </div>
                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Status</th>
                                            <th>Leave Reason</th>
                                            <th>Check In / Check Out</th>
                                            <th>Breaks</th>
                                            <th>Working Hours</th>
                                            <th>Tracking Hours</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summary.records.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="text-center p-4" style={{ color: 'var(--text-secondary)' }}>
                                                    No records in selected month.
                                                </td>
                                            </tr>
                                        ) : (
                                            summary.records.map((r) => (
                                                <tr key={r.id}>
                                                    <td>{r.date}</td>
                                                    <td>{r.status}</td>
                                                    <td>{r.leaveReason || '-'}</td>
                                                    <td>{r.workSessions.map((s) => `${s.checkIn} - ${s.checkOut}`).join(', ') || '-'}</td>
                                                    <td>{r.breakSessions.map((b) => `${b.start} - ${b.end}`).join(', ') || '-'}</td>
                                                    <td>{Number(r.workingHours || 0).toFixed(2)}</td>
                                                    <td>{Number(r.trackingHours || 0).toFixed(2)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
