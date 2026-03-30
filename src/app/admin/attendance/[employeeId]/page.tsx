'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import { EmployeeMonthlyAttendanceSummary } from '@/types';
import { getEmployeeMonthlyAttendance, upsertPerformanceRecord } from '@/lib/googleSheets';
import { generateEmployeeAttendancePdf } from '@/lib/attendancePdf';
import toast from 'react-hot-toast';
import { Download, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { canEditFinalPerformanceReview, canEditWeeklyPerformance } from '@/lib/roleAccess';

type Props = {
    params: Promise<{ employeeId: string }>;
};

export default function EmployeeAttendanceDetailPage({ params }: Props) {
    const { user } = useAuth();
    const [employeeId, setEmployeeId] = useState('');
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<EmployeeMonthlyAttendanceSummary | null>(null);
    const [savingPerformance, setSavingPerformance] = useState(false);
    const [week1Comment, setWeek1Comment] = useState('');
    const [week1Score, setWeek1Score] = useState(0);
    const [week2Comment, setWeek2Comment] = useState('');
    const [week2Score, setWeek2Score] = useState(0);
    const [week3Comment, setWeek3Comment] = useState('');
    const [week3Score, setWeek3Score] = useState(0);
    const [week4Comment, setWeek4Comment] = useState('');
    const [week4Score, setWeek4Score] = useState(0);
    const [finalComment, setFinalComment] = useState('');
    const [finalScore, setFinalScore] = useState(0);

    useEffect(() => {
        params.then((p) => setEmployeeId(p.employeeId));
    }, [params]);

    const load = useCallback(async (empId = employeeId, m = month, y = year) => {
        if (!empId) return;
        setLoading(true);
        try {
            const result = await getEmployeeMonthlyAttendance(empId, m, y);
            setSummary(result);
            setWeek1Comment(result.performance?.week1Comment || '');
            setWeek1Score(Number(result.performance?.week1Score || 0));
            setWeek2Comment(result.performance?.week2Comment || '');
            setWeek2Score(Number(result.performance?.week2Score || 0));
            setWeek3Comment(result.performance?.week3Comment || '');
            setWeek3Score(Number(result.performance?.week3Score || 0));
            setWeek4Comment(result.performance?.week4Comment || '');
            setWeek4Score(Number(result.performance?.week4Score || 0));
            setFinalComment(result.performance?.finalComment || '');
            setFinalScore(Number(result.performance?.finalScore || 0));
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to load monthly attendance.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [employeeId, month, year]);

    useEffect(() => {
        load();
    }, [load]);

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
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to open PDF.';
            toast.error(message);
        }
    };

    const savePerformanceComments = async () => {
        if (!employeeId || !user) return;
        if (!canEditWeeklyPerformance(user.role) && !canEditFinalPerformanceReview(user.role)) {
            toast.error('You do not have permission to save comments.');
            return;
        }

        try {
            setSavingPerformance(true);
            const payload: {
                employeeId: string;
                month: number;
                year: number;
                leadId?: string;
                week1Comment?: string;
                week1Score?: number;
                week2Comment?: string;
                week2Score?: number;
                week3Comment?: string;
                week3Score?: number;
                week4Comment?: string;
                week4Score?: number;
                finalReviewerId?: string;
                finalComment?: string;
                finalScore?: number;
            } = {
                employeeId,
                month,
                year,
            };

            if (canEditWeeklyPerformance(user.role)) {
                payload.leadId = user.id;
                payload.week1Comment = week1Comment;
                payload.week1Score = week1Score;
                payload.week2Comment = week2Comment;
                payload.week2Score = week2Score;
                payload.week3Comment = week3Comment;
                payload.week3Score = week3Score;
                payload.week4Comment = week4Comment;
                payload.week4Score = week4Score;
            }

            if (canEditFinalPerformanceReview(user.role)) {
                payload.finalReviewerId = user.id;
                payload.finalComment = finalComment;
                payload.finalScore = finalScore;
            }

            await upsertPerformanceRecord({
                ...payload,
            });
            toast.success('Performance comments saved.');
            await load(employeeId, month, year);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to save performance comments.';
            toast.error(message);
        } finally {
            setSavingPerformance(false);
        }
    };

    return (
        <div className="page-enter flex flex-col h-full overflow-y-auto">
            <Header title="Employee Performance Detail" subtitle="Monthly attendance and weekly lead comments" />

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

                        <div className="card">
                            <div className="mb-4">
                                <h3 className="font-semibold">Weekly Performance Comments</h3>
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    Lead/Manager can add weekly comments with score out of 10 ({summary.month}/{summary.year}).
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Week 1</label>
                                    <textarea className="input" rows={3} value={week1Comment} onChange={(e) => setWeek1Comment(e.target.value)} placeholder="Week 1 comment" disabled={!canEditWeeklyPerformance(user?.role)} />
                                    <label className="label mt-2">Week 1 Score (0-10)</label>
                                    <input className="input" type="number" min={0} max={10} step={0.1} value={week1Score} onChange={(e) => setWeek1Score(Math.max(0, Math.min(10, Number(e.target.value || 0))))} disabled={!canEditWeeklyPerformance(user?.role)} />
                                </div>
                                <div>
                                    <label className="label">Week 2</label>
                                    <textarea className="input" rows={3} value={week2Comment} onChange={(e) => setWeek2Comment(e.target.value)} placeholder="Week 2 comment" disabled={!canEditWeeklyPerformance(user?.role)} />
                                    <label className="label mt-2">Week 2 Score (0-10)</label>
                                    <input className="input" type="number" min={0} max={10} step={0.1} value={week2Score} onChange={(e) => setWeek2Score(Math.max(0, Math.min(10, Number(e.target.value || 0))))} disabled={!canEditWeeklyPerformance(user?.role)} />
                                </div>
                                <div>
                                    <label className="label">Week 3</label>
                                    <textarea className="input" rows={3} value={week3Comment} onChange={(e) => setWeek3Comment(e.target.value)} placeholder="Week 3 comment" disabled={!canEditWeeklyPerformance(user?.role)} />
                                    <label className="label mt-2">Week 3 Score (0-10)</label>
                                    <input className="input" type="number" min={0} max={10} step={0.1} value={week3Score} onChange={(e) => setWeek3Score(Math.max(0, Math.min(10, Number(e.target.value || 0))))} disabled={!canEditWeeklyPerformance(user?.role)} />
                                </div>
                                <div>
                                    <label className="label">Week 4</label>
                                    <textarea className="input" rows={3} value={week4Comment} onChange={(e) => setWeek4Comment(e.target.value)} placeholder="Week 4 comment" disabled={!canEditWeeklyPerformance(user?.role)} />
                                    <label className="label mt-2">Week 4 Score (0-10)</label>
                                    <input className="input" type="number" min={0} max={10} step={0.1} value={week4Score} onChange={(e) => setWeek4Score(Math.max(0, Math.min(10, Number(e.target.value || 0))))} disabled={!canEditWeeklyPerformance(user?.role)} />
                                </div>
                            </div>
                            <div className="mt-4 p-4 rounded" style={{ background: 'var(--bg-hover)' }}>
                                <h4 className="font-semibold">Final Monthly Review (HR / Higher Management)</h4>
                                <div className="mt-3">
                                    <label className="label">Final Comment</label>
                                    <textarea className="input" rows={3} value={finalComment} onChange={(e) => setFinalComment(e.target.value)} placeholder="Final monthly review comment" disabled={!canEditFinalPerformanceReview(user?.role)} />
                                </div>
                                <div className="mt-3">
                                    <label className="label">Final Score (0-10)</label>
                                    <input className="input" type="number" min={0} max={10} step={0.1} value={finalScore} onChange={(e) => setFinalScore(Math.max(0, Math.min(10, Number(e.target.value || 0))))} disabled={!canEditFinalPerformanceReview(user?.role)} />
                                </div>
                            </div>
                            <div className="mt-4">
                                <button className="btn-primary" onClick={savePerformanceComments} disabled={savingPerformance || (!canEditWeeklyPerformance(user?.role) && !canEditFinalPerformanceReview(user?.role))}>
                                    {savingPerformance ? 'Saving...' : 'Save Performance Comments'}
                                </button>
                            </div>
                        </div>

                        <div className="card" style={{ padding: 0 }}>
                            <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                                <h3 className="font-semibold">Monthly Performance Score Table</h3>
                            </div>
                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Week</th>
                                            <th>Comment</th>
                                            <th>Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr><td>Week 1</td><td>{summary.performance?.week1Comment || '-'}</td><td>{Number(summary.performance?.week1Score || 0).toFixed(1)} / 10</td></tr>
                                        <tr><td>Week 2</td><td>{summary.performance?.week2Comment || '-'}</td><td>{Number(summary.performance?.week2Score || 0).toFixed(1)} / 10</td></tr>
                                        <tr><td>Week 3</td><td>{summary.performance?.week3Comment || '-'}</td><td>{Number(summary.performance?.week3Score || 0).toFixed(1)} / 10</td></tr>
                                        <tr><td>Week 4</td><td>{summary.performance?.week4Comment || '-'}</td><td>{Number(summary.performance?.week4Score || 0).toFixed(1)} / 10</td></tr>
                                        <tr><td>Final (HR/HM)</td><td>{summary.performance?.finalComment || '-'}</td><td>{Number(summary.performance?.finalScore || 0).toFixed(1)} / 10</td></tr>
                                        <tr>
                                            <td className="font-semibold">Total</td>
                                            <td className="font-semibold">Monthly Score</td>
                                            <td className="font-semibold">{Number(summary.totalPerformanceScore || 0).toFixed(1)} / {Number(summary.maxPerformanceScore || 50).toFixed(0)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="card" style={{ padding: 0 }}>
                            <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                                <h3 className="font-semibold">Daily Performance Record</h3>
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
                                            <th>Weekly Comments (1-4)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summary.records.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="text-center p-4" style={{ color: 'var(--text-secondary)' }}>
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
                                                    <td>{[
                                                        summary.performance?.week1Comment,
                                                        summary.performance?.week2Comment,
                                                        summary.performance?.week3Comment,
                                                        summary.performance?.week4Comment,
                                                    ].filter(Boolean).join(' | ') || '-'}</td>
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
