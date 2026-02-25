'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';
import { getPenalties, getEmployees } from '@/lib/googleSheets';
import { Penalty, Employee, DashboardStats } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { TrendingUp, Users, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
    const [penalties, setPenalties] = useState<Penalty[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [p, e] = await Promise.all([getPenalties(), getEmployees()]);
            setPenalties(p);
            setEmployees(e);
        } catch {
            toast.error('Failed to load data. Check your Google Sheets connection.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const stats: DashboardStats = {
        total: penalties.length,
        paid: penalties.filter(p => p.status === 'Paid').length,
        unpaid: penalties.filter(p => p.status === 'Unpaid').length,
        pending: penalties.filter(p => p.status === 'Pending').length,
    };

    const totalAmount = penalties.reduce((s, p) => s + p.amount, 0);
    const recent = [...penalties].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

    const statCards = [
        { label: 'Total Penalties', value: stats.total, sub: formatCurrency(totalAmount), icon: TrendingUp, color: '#58A6FF' },
        { label: 'Total Employees', value: employees.length, sub: 'Registered', icon: Users, color: '#3BF5C4' },
        { label: 'Paid', value: stats.paid, sub: 'Verified', icon: CheckCircle, color: '#3FB950' },
        { label: 'Pending Verification', value: stats.pending, sub: 'Awaiting review', icon: Clock, color: '#F0883E' },
        { label: 'Unpaid', value: stats.unpaid, sub: 'Outstanding', icon: AlertCircle, color: '#F85149' },
    ];

    return (
        <div className="page-enter flex flex-col h-full">
            <Header title="Dashboard" subtitle="Overview of all penalties and employees" />

            <div className="p-8 space-y-8 flex-1">
                {/* Refresh */}
                <div className="flex justify-end">
                    <button onClick={load} className="btn-secondary" disabled={loading}>
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>

                {/* Stats */}
                {loading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="stat-card animate-pulse">
                                <div className="h-4 rounded" style={{ background: 'var(--border)', width: '60%' }} />
                                <div className="h-8 rounded mt-2" style={{ background: 'var(--border)', width: '40%' }} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        {statCards.map(({ label, value, sub, icon: Icon, color }) => (
                            <div key={label} className="stat-card">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{ background: `${color}20` }}>
                                        <Icon size={16} style={{ color }} />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
                                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{sub}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Recent Penalties */}
                <div className="card" style={{ padding: 0 }}>
                    <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                        <h2 className="font-semibold">Recent Penalties</h2>
                        <a href="/admin/penalties" className="text-xs font-medium" style={{ color: 'var(--accent)' }}>View all →</a>
                    </div>
                    {loading ? (
                        <div className="p-6 flex justify-center"><div className="spinner" /></div>
                    ) : recent.length === 0 ? (
                        <p className="p-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>No penalties yet.</p>
                    ) : (
                        <div className="table-wrapper">
                            <table>
                                <thead><tr>
                                    <th>Employee</th><th>Reason</th><th>Amount</th><th>Date</th><th>Status</th>
                                </tr></thead>
                                <tbody>
                                    {recent.map(p => (
                                        <tr key={p.id}>
                                            <td>
                                                <div>
                                                    <p className="font-medium">{p.employeeName}</p>
                                                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{p.email}</p>
                                                </div>
                                            </td>
                                            <td style={{ maxWidth: 200 }}>
                                                <p className="truncate text-sm" style={{ color: 'var(--text-secondary)' }}>{p.reason}</p>
                                            </td>
                                            <td className="font-semibold" style={{ color: 'var(--accent)' }}>{formatCurrency(p.amount)}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{formatDate(p.date)}</td>
                                            <td>
                                                <span className={`badge-${p.status.toLowerCase() === 'pending' ? 'pending' : p.status.toLowerCase() === 'paid' ? 'paid' : 'unpaid'}`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
