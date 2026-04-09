'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import DashboardStatGrid, { DashboardStatCard } from '@/components/dashboard/DashboardStatGrid';
import SimpleBarChart, { BarChartItem } from '@/components/dashboard/SimpleBarChart';
import AttendanceTrackerCard from '@/components/attendance/AttendanceTrackerCard';
import { useAuth } from '@/context/AuthContext';
import {
    getAttendanceRecords,
    getPerformanceRecords,
    getStaffDashboardData,
    getMonthlyAttendancePerformance,
} from '@/lib/googleSheets';
import { formatCurrency, formatDate } from '@/lib/utils';
import { AttendanceRecord, Employee, MonthlyAttendancePerformanceRow, PaymentType, Penalty, PerformanceRecord, SalarySlip } from '@/types';
import { CalendarClock, CheckCircle, CreditCard, Loader2, RefreshCw, ShieldAlert, ShieldCheck, TrendingDown, TrendingUp, Users, X } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import toast from 'react-hot-toast';

type StaffRole = 'employee' | 'lead';

function sameMonth(dateValue: string, reference: Date) {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return false;
    return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth();
}

function recentSort<T extends { createdAt?: string; payDate?: string; date?: string }>(items: T[]) {
    return [...items].sort((a, b) => String(b.createdAt || b.payDate || b.date || '').localeCompare(String(a.createdAt || a.payDate || a.date || '')));
}

export default function StaffDashboardView() {
    const { user } = useAuth();
    const role = user?.role as StaffRole | undefined;
    const now = useMemo(() => new Date(), []);
    const currentMonthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const cacheKey = useMemo(() => {
        if (!user) return '';
        return `staff-dashboard-core:${user.id}:${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }, [now, user]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [penalties, setPenalties] = useState<Penalty[]>([]);
    const [salarySlips, setSalarySlips] = useState<SalarySlip[]>([]);
    const [monthlyAttendance, setMonthlyAttendance] = useState<{ records: AttendanceRecord[]; totalWorkingHours: number; totalTrackingHours: number; totalPresents: number; totalAbsents: number; totalLeaves: number; totalHolidays: number; performance: PerformanceRecord | null; } | null>(null);
    const [currentPerformance, setCurrentPerformance] = useState<PerformanceRecord | null>(null);
    const [teamAttendanceRecords, setTeamAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [teamPerformanceRecords, setTeamPerformanceRecords] = useState<PerformanceRecord[]>([]);
    const [monthlyPerformanceRows, setMonthlyPerformanceRows] = useState<MonthlyAttendancePerformanceRow[]>([]);
    const [secondaryLoading, setSecondaryLoading] = useState(false);

    const [payPenalty, setPayPenalty] = useState<Penalty | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [payDate, setPayDate] = useState<Date | null>(new Date());
    const [proofUrl, setProofUrl] = useState('');
    const [payType, setPayType] = useState<PaymentType>('JazzCash');
    const [notes, setNotes] = useState('');

    const loadSecondary = useCallback(async () => {
        if (!user || role !== 'lead') return;
        setSecondaryLoading(true);
        try {
            const monthlyRows = await getMonthlyAttendancePerformance(now.getMonth() + 1, now.getFullYear());
            const [attendanceRecords, performanceRecords] = await Promise.all([
                getAttendanceRecords(),
                getPerformanceRecords(),
            ]);
            setTeamAttendanceRecords(attendanceRecords);
            setTeamPerformanceRecords(performanceRecords);
            setMonthlyPerformanceRows(monthlyRows);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to load dashboard data.';
            toast.error(message);
        } finally {
            setSecondaryLoading(false);
        }
    }, [now, role, user]);

    const load = useCallback(async () => {
        if (!user) return;

        let hydratedFromCache = false;
        if (typeof window !== 'undefined' && cacheKey) {
            const cachedValue = window.localStorage.getItem(cacheKey);
            if (cachedValue) {
                try {
                    const cached = JSON.parse(cachedValue) as {
                        employees: Employee[];
                        penalties: Penalty[];
                        salarySlips: SalarySlip[];
                        monthlyAttendance: { records: AttendanceRecord[]; totalWorkingHours: number; totalTrackingHours: number; totalPresents: number; totalAbsents: number; totalLeaves: number; totalHolidays: number; performance: PerformanceRecord | null; };
                        currentPerformance: PerformanceRecord | null;
                    };
                    setEmployees(cached.employees || []);
                    setPenalties(cached.penalties || []);
                    setSalarySlips(cached.salarySlips || []);
                    setMonthlyAttendance(cached.monthlyAttendance || null);
                    setCurrentPerformance(cached.currentPerformance || null);
                    hydratedFromCache = true;
                    setLoading(false);
                } catch {
                    window.localStorage.removeItem(cacheKey);
                }
            }
        }

        if (!hydratedFromCache) {
            setLoading(true);
        }

        try {
            const data = await getStaffDashboardData(user.id, now.getMonth() + 1, now.getFullYear());

            setPenalties(data.penalties.filter((item) => item.email.toLowerCase() === user.email.toLowerCase()));
            setSalarySlips(data.salarySlips);
            setMonthlyAttendance(data.monthlyAttendance);
            setCurrentPerformance(data.currentPerformance);
            setEmployees(data.employees);

            if (typeof window !== 'undefined' && cacheKey) {
                window.localStorage.setItem(cacheKey, JSON.stringify({
                    employees: data.employees,
                    penalties: data.penalties,
                    salarySlips: data.salarySlips,
                    monthlyAttendance: data.monthlyAttendance,
                    currentPerformance: data.currentPerformance,
                }));
            }

            if (role === 'lead') {
                void loadSecondary();
            } else {
                setTeamAttendanceRecords([]);
                setTeamPerformanceRecords([]);
                setMonthlyPerformanceRows([]);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to load dashboard data.';
            toast.error(message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [cacheKey, loadSecondary, now, role, user]);

    useEffect(() => {
        load();
    }, [load]);

    const refresh = async () => {
        setRefreshing(true);
        await load();
    };

    const directReports = useMemo(() => {
        if (!user) return [];
        if (role !== 'lead') return [];
        return employees.filter((employee) => employee.leadId === user.id);
    }, [employees, role, user]);

    const currentMonthAttendance = monthlyAttendance?.records || [];
    const attendanceCounts = currentMonthAttendance.reduce<Record<string, number>>((accumulator, record) => {
        const key = record.status || 'Unknown';
        accumulator[key] = (accumulator[key] || 0) + 1;
        return accumulator;
    }, {});

    const penaltyCounts = penalties.reduce<Record<string, number>>((accumulator, penalty) => {
        accumulator[penalty.status] = (accumulator[penalty.status] || 0) + 1;
        return accumulator;
    }, {});

    const salarySlipTotal = salarySlips.reduce((sum, slip) => sum + Number(slip.netPay || 0), 0);

    const leadTeamPerformance = directReports.length === 0
        ? []
        : recentSort(teamPerformanceRecords)
            .filter((record) => directReports.some((employee) => employee.id === record.employeeId) && record.month === now.getMonth() + 1 && record.year === now.getFullYear())
            .slice(0, 5)
            .map((record) => ({
                label: employees.find((employee) => employee.id === record.employeeId)?.name || record.employeeId,
                value: Number(record.totalScore || 0),
                color: '#8B5CF6',
            } as BarChartItem));

    const leadAttendance = directReports.length === 0
        ? []
        : directReports.slice(0, 5).map((employee) => {
            const monthly = teamAttendanceRecords.filter((record) => record.employeeId === employee.id && sameMonth(record.date, now));
            const present = monthly.filter((record) => record.status === 'Present').length;
            return {
                label: employee.name,
                value: present,
                color: '#3FB950',
            } as BarChartItem;
        });

    const cards: DashboardStatCard[] = [
        { label: 'Penalties', value: penalties.length, sub: 'Your record', icon: ShieldAlert, color: '#F85149' },
        { label: 'Paid', value: penaltyCounts.Paid || 0, sub: 'Verified penalties', icon: ShieldCheck, color: '#3FB950' },
        { label: 'Pending', value: penaltyCounts.Pending || 0, sub: 'Awaiting approval', icon: TrendingDown, color: '#F0883E' },
        { label: 'Working Hours', value: monthlyAttendance?.totalWorkingHours?.toFixed(1) || '0.0', sub: currentMonthName, icon: CalendarClock, color: '#58A6FF' },
        { label: 'Performance', value: currentPerformance?.totalScore || 0, sub: 'Current month score', icon: TrendingUp, color: '#8B5CF6' },
        { label: 'Salary Slips', value: salarySlips.length, sub: `Net total ${formatCurrency(salarySlipTotal)}`, icon: CreditCard, color: '#21c9d3' },
        { label: 'Present', value: monthlyAttendance?.totalPresents || 0, sub: currentMonthName, icon: CheckCircle, color: '#3FB950' },
        { label: 'Leaves', value: monthlyAttendance?.totalLeaves || 0, sub: currentMonthName, icon: CalendarClock, color: '#F0883E' },
    ];

    const attendanceChart: BarChartItem[] = Object.entries(attendanceCounts)
        .map(([label, value]) => ({
            label,
            value,
            color: label === 'Present' ? '#3FB950' : label === 'Leave' ? '#F0883E' : label === 'Holiday' ? '#58A6FF' : '#F85149',
        }))
        .sort((a, b) => b.value - a.value);

    const penaltyChart: BarChartItem[] = Object.entries(penaltyCounts)
        .map(([label, value]) => ({
            label,
            value,
            color: label === 'Paid' ? '#3FB950' : label === 'Pending' ? '#F0883E' : '#F85149',
        }))
        .sort((a, b) => b.value - a.value);

    const recentPenaltyRows = recentSort(penalties).slice(0, 5);
    const recentSalarySlipRows = recentSort(salarySlips).slice(0, 5);
    const teamRows = directReports.map((employee) => {
        const teamPerformance = teamPerformanceRecords.find((record) => record.employeeId === employee.id && record.month === now.getMonth() + 1 && record.year === now.getFullYear());
        const teamAttendance = teamAttendanceRecords.filter((record) => record.employeeId === employee.id && sameMonth(record.date, now));
        return {
            employee,
            performance: teamPerformance,
            present: teamAttendance.filter((record) => record.status === 'Present').length,
            leave: teamAttendance.filter((record) => record.status === 'Leave').length,
            absent: teamAttendance.filter((record) => record.status === 'Absent').length,
        };
    });

    const leadMonthlyPerformanceRows = useMemo(() => {
        if (role !== 'lead') return [];
        const directIds = new Set(directReports.map((employee) => employee.id));
        return monthlyPerformanceRows.filter((row) => directIds.has(row.employeeId));
    }, [role, directReports, monthlyPerformanceRows]);

    const teamDataLoading = role === 'lead' && secondaryLoading;

    const paySubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!payPenalty || !payDate || !proofUrl.trim()) {
            toast.error('Please fill all required fields.');
            return;
        }

        setSubmitting(true);
        try {
            const { submitPayment } = await import('@/lib/googleSheets');
            const updated = await submitPayment(
                payPenalty.id,
                payDate.toISOString().split('T')[0],
                proofUrl.trim(),
                payType,
                notes.trim(),
            );
            setPenalties((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
            setPayPenalty(null);
            setPayDate(new Date());
            setProofUrl('');
            setPayType('JazzCash');
            setNotes('');
            toast.success('Payment submitted! Awaiting admin verification.');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to submit payment.';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const title = role === 'lead' ? `Lead Dashboard` : `Employee Dashboard`;
    const subtitle = role === 'lead'
        ? 'Your work, performance, and team snapshot'
        : 'Your penalties, attendance, salary, and monthly progress';
    const payDateValue = payDate ? payDate.toISOString().split('T')[0] : '';

    return (
        <div className="page-enter flex flex-col h-full">
            <Header title={title} subtitle={subtitle} />

            <div className="p-8 space-y-8 flex-1 overflow-y-auto">
                <div className="flex justify-end">
                    <button onClick={refresh} className="btn-secondary" disabled={loading || refreshing}>
                        <RefreshCw size={16} className={loading || refreshing ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, index) => (
                            <div key={index} className="stat-card animate-pulse">
                                <div className="h-4 rounded" style={{ background: 'var(--border)', width: '60%' }} />
                                <div className="h-8 rounded mt-2" style={{ background: 'var(--border)', width: '40%' }} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        <DashboardStatGrid cards={cards} columns={4} />

                        {user ? <AttendanceTrackerCard employeeId={user.id} /> : null}

                        <div className="grid gap-6 lg:grid-cols-2">
                            <SimpleBarChart
                                title="Attendance Status"
                                subtitle={currentMonthName}
                                items={attendanceChart}
                                emptyText="No attendance data for the current month."
                            />

                            <SimpleBarChart
                                title={role === 'lead' ? 'Penalty Status' : 'Salary Snapshot'}
                                subtitle={role === 'lead' ? 'Your penalty pipeline' : 'Salary slips by value'}
                                items={role === 'lead' ? penaltyChart : recentSalarySlipRows.map((slip) => ({ label: `${slip.salaryMonth} ${slip.salaryYear}`, value: Number(slip.netPay || 0), color: '#21c9d3' }))}
                                emptyText="No data available."
                            />
                        </div>

                        {role === 'lead' && directReports.length > 0 ? (
                            <div className="grid gap-6 lg:grid-cols-2">
                                <SimpleBarChart
                                    title="Team Performance"
                                    subtitle="Current month direct reports"
                                    items={leadTeamPerformance}
                                    emptyText={teamDataLoading ? 'Loading team performance...' : 'No team performance records found.'}
                                />
                                <SimpleBarChart
                                    title="Team Attendance"
                                    subtitle="Present count by direct report"
                                    items={leadAttendance}
                                    emptyText={teamDataLoading ? 'Loading team attendance...' : 'No team attendance records found.'}
                                />
                            </div>
                        ) : null}

                        <div className="grid gap-6 lg:grid-cols-2">
                            <div className="card" style={{ padding: 0 }}>
                                <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                                    <h3 className="font-semibold">Recent Penalties</h3>
                                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{recentPenaltyRows.length} items</span>
                                </div>
                                <div className="table-wrapper">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Reason</th>
                                                <th>Amount</th>
                                                <th>Date</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentPenaltyRows.map((item) => (
                                                <tr key={item.id}>
                                                    <td>
                                                        <p className="text-sm max-w-xs truncate" style={{ color: 'var(--text-secondary)' }}>{item.reason}</p>
                                                    </td>
                                                    <td className="font-semibold" style={{ color: 'var(--accent)' }}>{formatCurrency(item.amount)}</td>
                                                    <td style={{ color: 'var(--text-secondary)' }}>{formatDate(item.date)}</td>
                                                    <td>
                                                        <span className={`badge-${item.status === 'Paid' ? 'paid' : item.status === 'Pending' ? 'pending' : 'unpaid'}`}>{item.status}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="card" style={{ padding: 0 }}>
                                <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                                    <h3 className="font-semibold">Salary Slips</h3>
                                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{recentSalarySlipRows.length} items</span>
                                </div>
                                <div className="table-wrapper">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Month</th>
                                                <th>Net Pay</th>
                                                <th>Pay Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentSalarySlipRows.map((item) => (
                                                <tr key={item.id}>
                                                    <td style={{ color: 'var(--text-secondary)' }}>{item.salaryMonth} {item.salaryYear}</td>
                                                    <td className="font-semibold" style={{ color: 'var(--accent)' }}>{formatCurrency(item.netPay)}</td>
                                                    <td style={{ color: 'var(--text-secondary)' }}>{formatDate(item.payDate)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {role === 'lead' && directReports.length > 0 ? (
                            <div className="card" style={{ padding: 0 }}>
                                <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                                    <h3 className="font-semibold">Direct Reports</h3>
                                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{teamRows.length} members</span>
                                </div>
                                <div className="table-wrapper">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Employee</th>
                                                <th>Department</th>
                                                <th>Performance</th>
                                                <th>Present</th>
                                                <th>Leave</th>
                                                <th>Absent</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                                    {teamDataLoading ? (
                                                        <tr>
                                                            <td colSpan={6} className="py-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                                                                Loading team analytics...
                                                            </td>
                                                        </tr>
                                                    ) : teamRows.map((row) => (
                                                <tr key={row.employee.id}>
                                                    <td>
                                                        <div>
                                                            <p className="font-medium">{row.employee.name}</p>
                                                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{row.employee.email}</p>
                                                        </div>
                                                    </td>
                                                    <td style={{ color: 'var(--text-secondary)' }}>{row.employee.department || 'overall'}</td>
                                                    <td className="font-semibold" style={{ color: 'var(--accent)' }}>{row.performance ? row.performance.totalScore : '—'}</td>
                                                    <td>{row.present}</td>
                                                    <td>{row.leave}</td>
                                                    <td>{row.absent}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : null}

                        {role === 'lead' && leadMonthlyPerformanceRows.length > 0 ? (
                            <div className="card" style={{ padding: 0 }}>
                                <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                                    <h3 className="font-semibold">Monthly Attendance Performance</h3>
                                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{currentMonthName}</span>
                                </div>
                                <div className="table-wrapper">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Total Hours</th>
                                                <th>Late</th>
                                                <th>Leaves Used</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {leadMonthlyPerformanceRows.map((row) => (
                                                <tr key={row.employeeId}>
                                                    <td>{row.employeeName}</td>
                                                    <td>{row.totalHours.toFixed(2)}h</td>
                                                    <td>{row.lateCount}</td>
                                                    <td>{row.leavesUsed + row.paidLeaveDeductions}</td>
                                                    <td>
                                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${row.status === 'Good' ? 'bg-green-500/10 text-green-500' : row.status === 'Attention' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
                                                            {row.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : null}
                    </>
                )}
            </div>

            {payPenalty && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: 500 }}>
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-bold text-lg">Submit Payment</h3>
                            <button onClick={() => setPayPenalty(null)}>
                                <X size={20} style={{ color: 'var(--text-secondary)' }} />
                            </button>
                        </div>

                        <div className="rounded-lg p-4 mb-5" style={{ background: 'var(--bg-secondary)' }}>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                <strong style={{ color: 'var(--text-primary)' }}>Amount Due:</strong> {formatCurrency(payPenalty.amount)}
                            </p>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                <strong style={{ color: 'var(--text-primary)' }}>Reason:</strong> {payPenalty.reason}
                            </p>
                        </div>

                        <form onSubmit={paySubmit} className="space-y-4">
                            <div>
                                <label className="label">Payment Date *</label>
                                <div className="input flex items-center gap-2">
                                    <CalendarClock size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                                    <input
                                        type="date"
                                        value={payDateValue}
                                        onChange={(event) => {
                                            const value = event.target.value;
                                            setPayDate(value ? new Date(`${value}T00:00:00`) : null);
                                        }}
                                        className="w-full bg-transparent outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="label">Payment Type *</label>
                                <select className="select" value={payType} onChange={(event) => setPayType(event.target.value as PaymentType)}>
                                    <option value="JazzCash">JazzCash</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Cash">Cash</option>
                                </select>
                            </div>

                            <ImageUploader label="Payment Screenshot" value={proofUrl} onChange={setProofUrl} required />

                            <div>
                                <label className="label">Notes (Optional)</label>
                                <textarea className="input" rows={2} placeholder="e.g. Transaction ID: XXXX" value={notes} onChange={(event) => setNotes(event.target.value)} />
                            </div>

                            <button type="submit" className="btn-primary w-full justify-center py-3" disabled={submitting}>
                                {submitting ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                                {submitting ? 'Submitting...' : 'Submit Payment'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}