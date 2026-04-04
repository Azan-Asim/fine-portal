'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import DashboardStatGrid, { DashboardStatCard } from '@/components/dashboard/DashboardStatGrid';
import SimpleBarChart, { BarChartItem } from '@/components/dashboard/SimpleBarChart';
import { useAuth } from '@/context/AuthContext';
import {
    getManagementDashboardData,
} from '@/lib/googleSheets';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
    AttendanceRecord,
    CompanyExpense,
    CompanyIncome,
    Employee,
    PayrollRecord,
    Penalty,
    PerformanceRecord,
    ProjectItem,
} from '@/types';
import { Building2, CalendarClock, DollarSign, FolderKanban, Loader2, RefreshCw, ShieldCheck, TrendingDown, TrendingUp, Users } from 'lucide-react';
import toast from 'react-hot-toast';

type ManagementRole = 'higher-management' | 'hr' | 'manager';

interface DashboardBundle {
    employees: Employee[];
    penalties: Penalty[];
    companyExpenses: CompanyExpense[];
    companyIncomes: CompanyIncome[];
    payrollRecords: PayrollRecord[];
    projects: ProjectItem[];
    projectDocumentCounts: Record<string, number>;
    attendanceRecords: AttendanceRecord[];
    performanceRecords: PerformanceRecord[];
}

function sameMonth(dateValue: string, reference: Date) {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return false;
    return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth();
}

function recentSort<T extends { createdAt?: string; date?: string }>(items: T[]) {
    return [...items].sort((a, b) => String(b.createdAt || b.date || '').localeCompare(String(a.createdAt || a.date || '')));
}

function averageScore(records: PerformanceRecord[]) {
    if (records.length === 0) return 0;
    return Number((records.reduce((sum, record) => sum + Number(record.totalScore || 0), 0) / records.length).toFixed(1));
}

export default function ManagementDashboardView() {
    const { user } = useAuth();
    const role = user?.role as ManagementRole | undefined;
    const now = useMemo(() => new Date(), []);
    const currentMonthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [bundle, setBundle] = useState<DashboardBundle>({
        employees: [],
        penalties: [],
        companyExpenses: [],
        companyIncomes: [],
        payrollRecords: [],
        projects: [],
        projectDocumentCounts: {},
        attendanceRecords: [],
        performanceRecords: [],
    });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getManagementDashboardData();
            setBundle(data);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to load dashboard data.';
            toast.error(message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const refresh = async () => {
        setRefreshing(true);
        await load();
    };

    const currentMonthExpenses = bundle.companyExpenses.filter((item) => sameMonth(item.date, now));
    const currentMonthIncome = bundle.companyIncomes.filter((item) => sameMonth(item.date, now));
    const currentMonthPayroll = bundle.payrollRecords.filter((item) => sameMonth(item.payrollDate, now));
    const currentMonthAttendance = bundle.attendanceRecords.filter((item) => sameMonth(item.date, now));
    const currentMonthPerformance = bundle.performanceRecords.filter((item) => item.month === now.getMonth() + 1 && item.year === now.getFullYear());

    const roleCounts = bundle.employees.reduce<Record<string, number>>((accumulator, employee) => {
        const key = employee.role || 'employee';
        accumulator[key] = (accumulator[key] || 0) + 1;
        return accumulator;
    }, {});

    const departmentCounts = bundle.employees.reduce<Record<string, number>>((accumulator, employee) => {
        const key = employee.department || 'overall';
        accumulator[key] = (accumulator[key] || 0) + 1;
        return accumulator;
    }, {});

    const attendanceStatusCounts = currentMonthAttendance.reduce<Record<string, number>>((accumulator, record) => {
        const key = record.status || 'Unknown';
        accumulator[key] = (accumulator[key] || 0) + 1;
        return accumulator;
    }, {});

    const financeChart: BarChartItem[] = [
        { label: 'Income', value: currentMonthIncome.reduce((sum, item) => sum + Number(item.amount || 0), 0), color: '#3FB950' },
        { label: 'Expenses', value: currentMonthExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0), color: '#F85149' },
        { label: 'Payroll', value: currentMonthPayroll.reduce((sum, item) => sum + Number(item.total || 0), 0), color: '#F0883E' },
        {
            label: 'Net',
            value: currentMonthIncome.reduce((sum, item) => sum + Number(item.amount || 0), 0)
                - currentMonthExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0)
                - currentMonthPayroll.reduce((sum, item) => sum + Number(item.total || 0), 0),
            color: '#58A6FF',
        },
    ];

    const projectChart: BarChartItem[] = bundle.projects
        .map((project) => ({
            label: project.name,
            value: Number(bundle.projectDocumentCounts[project.id] || 0),
            color: '#21c9d3',
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    const performanceChart: BarChartItem[] = recentSort(currentMonthPerformance)
        .slice(0, 5)
        .map((record) => {
            const employee = bundle.employees.find((item) => item.id === record.employeeId);
            return {
                label: employee?.name || record.employeeId,
                value: Number(record.totalScore || 0),
                color: '#8B5CF6',
            };
        });

    const roleChart: BarChartItem[] = Object.entries(roleCounts)
        .map(([label, value]) => ({ label, value, color: '#58A6FF' }))
        .sort((a, b) => b.value - a.value);

    const departmentChart: BarChartItem[] = Object.entries(departmentCounts)
        .map(([label, value]) => ({ label, value, color: '#3FB950' }))
        .sort((a, b) => b.value - a.value);

    const attendanceChart: BarChartItem[] = Object.entries(attendanceStatusCounts)
        .map(([label, value]) => ({ label, value, color: label === 'Present' ? '#3FB950' : label === 'Leave' ? '#F0883E' : label === 'Holiday' ? '#58A6FF' : '#F85149' }))
        .sort((a, b) => b.value - a.value);

    const recentPenalties = recentSort(bundle.penalties).slice(0, 5);
    const recentExpenses = recentSort(bundle.companyExpenses).slice(0, 5);
    const recentPayroll = recentSort(bundle.payrollRecords).slice(0, 5);
    const recentEmployees = recentSort(bundle.employees).slice(0, 5);
    const topPerformance = recentSort(bundle.performanceRecords)
        .sort((a, b) => Number(b.totalScore || 0) - Number(a.totalScore || 0))
        .slice(0, 5);

    const executiveCards: DashboardStatCard[] = [
        { label: 'Employees', value: bundle.employees.length, sub: 'Active staff in system', icon: Users, color: '#3BF5C4' },
        { label: 'Projects', value: bundle.projects.length, sub: 'Tracked project folders', icon: FolderKanban, color: '#58A6FF' },
        { label: 'Current Month Income', value: formatCurrency(financeChart[0].value), sub: currentMonthName, icon: TrendingUp, color: '#3FB950' },
        { label: 'Current Month Expenses', value: formatCurrency(financeChart[1].value), sub: currentMonthName, icon: TrendingDown, color: '#F85149' },
        { label: 'Payroll Total', value: formatCurrency(financeChart[2].value), sub: currentMonthName, icon: DollarSign, color: '#F0883E' },
        { label: 'Net Position', value: formatCurrency(financeChart[3].value), sub: 'After payroll and expenses', icon: Building2, color: financeChart[3].value >= 0 ? '#21c9d3' : '#F85149' },
    ];

    const hrCards: DashboardStatCard[] = [
        { label: 'Employees', value: bundle.employees.length, sub: 'Registered workforce', icon: Users, color: '#3BF5C4' },
        { label: 'Role Types', value: Object.keys(roleCounts).length, sub: 'Unique role buckets', icon: ShieldCheck, color: '#58A6FF' },
        { label: 'Present This Month', value: attendanceStatusCounts.Present || 0, sub: currentMonthName, icon: CalendarClock, color: '#3FB950' },
        { label: 'Leaves This Month', value: attendanceStatusCounts.Leave || 0, sub: 'Attendance logs', icon: CalendarClock, color: '#F0883E' },
        { label: 'Open Penalties', value: bundle.penalties.filter((item) => item.status !== 'Paid').length, sub: 'Require follow-up', icon: TrendingDown, color: '#F85149' },
        { label: 'Avg Performance', value: averageScore(currentMonthPerformance), sub: 'Current month average', icon: TrendingUp, color: '#8B5CF6' },
    ];

    const managerCards: DashboardStatCard[] = [
        { label: 'Team Members', value: bundle.employees.length, sub: 'Overall team view', icon: Users, color: '#3BF5C4' },
        { label: 'Top Performance', value: topPerformance.length ? Number(topPerformance[0].totalScore || 0) : 0, sub: 'Best current month score', icon: TrendingUp, color: '#8B5CF6' },
        { label: 'Projects', value: bundle.projects.length, sub: 'Project ledger', icon: FolderKanban, color: '#58A6FF' },
        { label: 'Project Docs', value: Object.values(bundle.projectDocumentCounts).reduce((sum, count) => sum + Number(count || 0), 0), sub: 'Shared documents', icon: Building2, color: '#21c9d3' },
        { label: 'Attendance Present', value: attendanceStatusCounts.Present || 0, sub: currentMonthName, icon: CalendarClock, color: '#3FB950' },
        { label: 'Pending Penalties', value: bundle.penalties.filter((item) => item.status === 'Pending').length, sub: 'Awaiting verification', icon: TrendingDown, color: '#F0883E' },
    ];

    const cards = role === 'higher-management' ? executiveCards : role === 'hr' ? hrCards : managerCards;

    const title = role === 'higher-management' ? 'Executive Dashboard' : role === 'hr' ? 'HR Dashboard' : 'Manager Dashboard';
    const subtitle = role === 'higher-management'
        ? 'Financial control, project visibility, and monthly company health'
        : role === 'hr'
            ? 'Workforce distribution, attendance, and employee movement'
            : 'Team performance, attendance, and project visibility';

    const renderRecentPenaltiesTable = () => (
        <div className="card" style={{ padding: 0 }}>
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                <h3 className="font-semibold">Recent Penalties</h3>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{recentPenalties.length} items</span>
            </div>
            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Reason</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentPenalties.map((item) => (
                            <tr key={item.id}>
                                <td>
                                    <div>
                                        <p className="font-medium">{item.employeeName}</p>
                                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.email}</p>
                                    </div>
                                </td>
                                <td style={{ maxWidth: 240 }}><p className="truncate text-sm" style={{ color: 'var(--text-secondary)' }}>{item.reason}</p></td>
                                <td className="font-semibold" style={{ color: 'var(--accent)' }}>{formatCurrency(item.amount)}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{formatDate(item.date)}</td>
                                <td><span className={`badge-${item.status.toLowerCase() === 'pending' ? 'pending' : item.status.toLowerCase() === 'paid' ? 'paid' : 'unpaid'}`}>{item.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderRecentFinanceTable = () => (
        <div className="card" style={{ padding: 0 }}>
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                <h3 className="font-semibold">Recent Company Expenses</h3>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{recentExpenses.length} items</span>
            </div>
            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Paid By</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentExpenses.map((item) => (
                            <tr key={item.id}>
                                <td style={{ color: 'var(--text-secondary)' }}>{formatDate(item.date)}</td>
                                <td>
                                    <p className="text-sm max-w-xs truncate" style={{ color: 'var(--text-secondary)' }}>{item.description}</p>
                                </td>
                                <td style={{ color: 'var(--text-secondary)' }}>{item.paidBy}</td>
                                <td className="font-semibold" style={{ color: 'var(--accent)' }}>{formatCurrency(item.amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderEmployeeTable = () => (
        <div className="card" style={{ padding: 0 }}>
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                <h3 className="font-semibold">Recent Employees</h3>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{recentEmployees.length} items</span>
            </div>
            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Department</th>
                            <th>Joined</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentEmployees.map((item) => (
                            <tr key={item.id}>
                                <td>
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.email}</p>
                                </td>
                                <td style={{ color: 'var(--text-secondary)' }}>{item.role}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{item.department || 'overall'}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{formatDate(item.createdAt)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

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
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, index) => (
                            <div key={index} className="stat-card animate-pulse">
                                <div className="h-4 rounded" style={{ background: 'var(--border)', width: '60%' }} />
                                <div className="h-8 rounded mt-2" style={{ background: 'var(--border)', width: '40%' }} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        <DashboardStatGrid cards={cards} columns={role === 'higher-management' ? 6 : 6} />

                        <div className="grid gap-6 lg:grid-cols-2">
                            <SimpleBarChart
                                title={role === 'higher-management' ? 'Finance Snapshot' : role === 'hr' ? 'Workforce Distribution' : 'Team Performance Snapshot'}
                                subtitle={role === 'higher-management' ? 'Income vs expense vs payroll for the current month' : role === 'hr' ? 'Role mix across the organization' : 'Current month score leaderboard'}
                                items={role === 'higher-management' ? financeChart : role === 'hr' ? roleChart : performanceChart}
                                emptyText="No records found for this view."
                            />

                            <SimpleBarChart
                                title={role === 'higher-management' ? 'Project Document Coverage' : role === 'hr' ? 'Department Distribution' : 'Attendance Status'}
                                subtitle={role === 'higher-management' ? 'Top projects by uploaded documents' : role === 'hr' ? 'Current employee mix by department' : 'Attendance status this month'}
                                items={role === 'higher-management' ? projectChart : role === 'hr' ? departmentChart : attendanceChart}
                                emptyText="No records found for this view."
                            />
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                            {renderRecentPenaltiesTable()}
                            {role === 'higher-management' ? renderRecentFinanceTable() : renderEmployeeTable()}
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                            <div className="card" style={{ padding: 0 }}>
                                <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                                    <h3 className="font-semibold">Recent Payroll Records</h3>
                                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{recentPayroll.length} items</span>
                                </div>
                                <div className="table-wrapper">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Month</th>
                                                <th>Prepared By</th>
                                                <th>Total</th>
                                                <th>Received</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentPayroll.map((item) => (
                                                <tr key={item.id}>
                                                    <td style={{ color: 'var(--text-secondary)' }}>{item.salaryMonth} {item.salaryYear}</td>
                                                    <td style={{ color: 'var(--text-secondary)' }}>{item.preparedBy}</td>
                                                    <td className="font-semibold" style={{ color: 'var(--accent)' }}>{formatCurrency(item.total)}</td>
                                                    <td>
                                                        <span className={`badge-${item.salaryReceived ? 'paid' : 'pending'}`}>
                                                            {item.salaryReceived ? 'Paid' : 'Pending'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="card" style={{ padding: 0 }}>
                                <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                                    <h3 className="font-semibold">Current Month Attendance</h3>
                                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{currentMonthName}</span>
                                </div>
                                <div className="table-wrapper">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Status</th>
                                                <th>Count</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(attendanceStatusCounts).map(([status, count]) => (
                                                <tr key={status}>
                                                    <td style={{ color: 'var(--text-secondary)' }}>{status}</td>
                                                    <td className="font-semibold">{count}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}