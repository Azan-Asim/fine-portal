'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import { Employee, EmployeeMonthlyAttendanceSummary } from '@/types';
import { getEmployeeMonthlyAttendance, getEmployees, upsertPerformanceRecord } from '@/lib/googleSheets';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { generateEmployeeAttendancePdf } from '@/lib/attendancePdf';
import { canEditWeeklyPerformance, isFullAccessRole } from '@/lib/roleAccess';

export default function EmployeePerformancePage() {
    const { user } = useAuth();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [summary, setSummary] = useState<EmployeeMonthlyAttendanceSummary | null>(null);
    const [weekComments, setWeekComments] = useState({ week1: '', week2: '', week3: '', week4: '' });
    const [weekScores, setWeekScores] = useState({ week1: 0, week2: 0, week3: 0, week4: 0 });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const canEditWeekly = canEditWeeklyPerformance(user?.role);

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

    useEffect(() => {
        const run = async () => {
            if (!user) return;
            try {
                const list = await getEmployees();
                if (user.role === 'lead') {
                    const team = list.filter((e) => e.id === user.id || e.leadId === user.id);
                    setEmployees(team);
                    setSelectedEmployeeId(team[0]?.id || user.id);
                } else if (isFullAccessRole(user.role)) {
                    const activeEmployees = list.filter((e) => e.status !== 'Left');
                    setEmployees(activeEmployees);
                    setSelectedEmployeeId(activeEmployees[0]?.id || '');
                } else {
                    const mine = list.find((e) => e.id === user.id);
                    setEmployees(mine ? [mine] : []);
                    setSelectedEmployeeId(user.id);
                }
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : 'Failed to load employees.';
                toast.error(message);
            }
        };
        run();
    }, [user]);

    const loadSummary = useCallback(async () => {
        if (!selectedEmployeeId) return;
        setLoading(true);
        try {
            const result = await getEmployeeMonthlyAttendance(selectedEmployeeId, month, year);
            setSummary(result);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to load performance record.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [selectedEmployeeId, month, year]);

    useEffect(() => {
        if (selectedEmployeeId) {
            loadSummary();
        }
    }, [selectedEmployeeId, loadSummary]);

    useEffect(() => {
        setWeekComments({
            week1: summary?.performance?.week1Comment || '',
            week2: summary?.performance?.week2Comment || '',
            week3: summary?.performance?.week3Comment || '',
            week4: summary?.performance?.week4Comment || '',
        });
        setWeekScores({
            week1: Number(summary?.performance?.week1Score || 0),
            week2: Number(summary?.performance?.week2Score || 0),
            week3: Number(summary?.performance?.week3Score || 0),
            week4: Number(summary?.performance?.week4Score || 0),
        });
    }, [summary]);

    const savePerformance = async () => {
        if (!canEditWeekly || !user || !selectedEmployeeId) return;

        setSaving(true);
        try {
            await upsertPerformanceRecord({
                employeeId: selectedEmployeeId,
                leadId: user.id,
                month,
                year,
                week1Comment: weekComments.week1,
                week1Score: weekScores.week1,
                week2Comment: weekComments.week2,
                week2Score: weekScores.week2,
                week3Comment: weekComments.week3,
                week3Score: weekScores.week3,
                week4Comment: weekComments.week4,
                week4Score: weekScores.week4,
            });
            toast.success('Performance comments saved.');
            await loadSummary();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to save performance comments.';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page-enter flex flex-col h-full overflow-y-auto">
            <Header title="Monthly Performance Record" subtitle="Attendance and weekly lead comments" />

            <div className="p-6 space-y-6">
                <div className="card">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="label">Employee</label>
                            <select className="input" value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)}>
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                            </select>
                        </div>
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
                        <div className="flex items-end gap-2">
                            <button className="btn-primary w-full" onClick={loadSummary} disabled={loading}>
                                {loading ? 'Loading...' : 'Load Record'}
                            </button>
                            <button className="btn-secondary" onClick={() => summary && generateEmployeeAttendancePdf(summary)} disabled={!summary}>
                                Download PDF
                            </button>
                        </div>
                    </div>
                </div>

                {summary && (
                    <>
                        <div className="card">
                            <h3 className="font-semibold mb-3">Weekly Performance Comments + Scores</h3>
                            {canEditWeekly ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="label">Week 1 Comment</label>
                                            <textarea
                                                className="input min-h-[100px]"
                                                value={weekComments.week1}
                                                onChange={(e) => setWeekComments((prev) => ({ ...prev, week1: e.target.value }))}
                                                placeholder="Add Week 1 performance notes"
                                            />
                                            <label className="label mt-2">Week 1 Score (0-10)</label>
                                            <input className="input" type="number" min={0} max={10} step={0.1} value={weekScores.week1} onChange={(e) => setWeekScores((prev) => ({ ...prev, week1: Math.max(0, Math.min(10, Number(e.target.value || 0))) }))} />
                                        </div>
                                        <div>
                                            <label className="label">Week 2 Comment</label>
                                            <textarea
                                                className="input min-h-[100px]"
                                                value={weekComments.week2}
                                                onChange={(e) => setWeekComments((prev) => ({ ...prev, week2: e.target.value }))}
                                                placeholder="Add Week 2 performance notes"
                                            />
                                            <label className="label mt-2">Week 2 Score (0-10)</label>
                                            <input className="input" type="number" min={0} max={10} step={0.1} value={weekScores.week2} onChange={(e) => setWeekScores((prev) => ({ ...prev, week2: Math.max(0, Math.min(10, Number(e.target.value || 0))) }))} />
                                        </div>
                                        <div>
                                            <label className="label">Week 3 Comment</label>
                                            <textarea
                                                className="input min-h-[100px]"
                                                value={weekComments.week3}
                                                onChange={(e) => setWeekComments((prev) => ({ ...prev, week3: e.target.value }))}
                                                placeholder="Add Week 3 performance notes"
                                            />
                                            <label className="label mt-2">Week 3 Score (0-10)</label>
                                            <input className="input" type="number" min={0} max={10} step={0.1} value={weekScores.week3} onChange={(e) => setWeekScores((prev) => ({ ...prev, week3: Math.max(0, Math.min(10, Number(e.target.value || 0))) }))} />
                                        </div>
                                        <div>
                                            <label className="label">Week 4 Comment</label>
                                            <textarea
                                                className="input min-h-[100px]"
                                                value={weekComments.week4}
                                                onChange={(e) => setWeekComments((prev) => ({ ...prev, week4: e.target.value }))}
                                                placeholder="Add Week 4 performance notes"
                                            />
                                            <label className="label mt-2">Week 4 Score (0-10)</label>
                                            <input className="input" type="number" min={0} max={10} step={0.1} value={weekScores.week4} onChange={(e) => setWeekScores((prev) => ({ ...prev, week4: Math.max(0, Math.min(10, Number(e.target.value || 0))) }))} />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <button className="btn-primary" onClick={savePerformance} disabled={saving}>
                                            {saving ? 'Saving...' : 'Save Comments'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div><strong>Week 1:</strong> {summary.performance?.week1Comment || '-'} ({Number(summary.performance?.week1Score || 0).toFixed(1)}/10)</div>
                                    <div><strong>Week 2:</strong> {summary.performance?.week2Comment || '-'} ({Number(summary.performance?.week2Score || 0).toFixed(1)}/10)</div>
                                    <div><strong>Week 3:</strong> {summary.performance?.week3Comment || '-'} ({Number(summary.performance?.week3Score || 0).toFixed(1)}/10)</div>
                                    <div><strong>Week 4:</strong> {summary.performance?.week4Comment || '-'} ({Number(summary.performance?.week4Score || 0).toFixed(1)}/10)</div>
                                </div>
                            )}
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
                                <h3 className="font-semibold">Attendance + Performance Table</h3>
                            </div>
                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Status</th>
                                            <th>Working Hours</th>
                                            <th>Tracking Hours</th>
                                            <th>Weekly Comments</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summary.records.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="p-4 text-center" style={{ color: 'var(--text-secondary)' }}>
                                                    No record found.
                                                </td>
                                            </tr>
                                        ) : (
                                            summary.records.map((r) => (
                                                <tr key={r.id}>
                                                    <td>{r.date}</td>
                                                    <td>{r.status}</td>
                                                    <td>{Number(r.workingHours || 0).toFixed(2)}</td>
                                                    <td>{Number(r.trackingHours || 0).toFixed(2)}</td>
                                                    <td>{[
                                                        `W1: ${summary.performance?.week1Comment || '-'} (${Number(summary.performance?.week1Score || 0).toFixed(1)}/10)`,
                                                        `W2: ${summary.performance?.week2Comment || '-'} (${Number(summary.performance?.week2Score || 0).toFixed(1)}/10)`,
                                                        `W3: ${summary.performance?.week3Comment || '-'} (${Number(summary.performance?.week3Score || 0).toFixed(1)}/10)`,
                                                        `W4: ${summary.performance?.week4Comment || '-'} (${Number(summary.performance?.week4Score || 0).toFixed(1)}/10)`,
                                                    ].join(' | ')}</td>
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
