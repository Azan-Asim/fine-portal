'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';
import { getPenalties, submitPayment } from '@/lib/googleSheets';
import { useAuth } from '@/context/AuthContext';
import { Penalty, PaymentType } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { TrendingUp, CheckCircle, Clock, AlertCircle, CreditCard, X, Loader2, CalendarDays } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ImageUploader from '@/components/ImageUploader';
import toast from 'react-hot-toast';

export default function EmployeeDashboard() {
    const { user } = useAuth();
    const [penalties, setPenalties] = useState<Penalty[]>([]);
    const [loading, setLoading] = useState(true);
    const [payPenalty, setPayPenalty] = useState<Penalty | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Payment form state
    const [payDate, setPayDate] = useState<Date | null>(new Date());
    const [proofUrl, setProofUrl] = useState('');
    const [payType, setPayType] = useState<PaymentType>('JazzCash');
    const [notes, setNotes] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const all = await getPenalties();
            const mine = all.filter(p => p.email.toLowerCase() === user?.email?.toLowerCase());
            setPenalties(mine);
        } catch {
            toast.error('Failed to load your penalties.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { load(); }, [load]);

    const stats = {
        total: penalties.length,
        paid: penalties.filter(p => p.status === 'Paid').length,
        unpaid: penalties.filter(p => p.status === 'Unpaid').length,
        pending: penalties.filter(p => p.status === 'Pending').length,
    };

    const statCards = [
        { label: 'Total Fines', value: stats.total, icon: TrendingUp, color: '#58A6FF' },
        { label: 'Paid', value: stats.paid, icon: CheckCircle, color: '#3FB950' },
        { label: 'Pending', value: stats.pending, icon: Clock, color: '#F0883E' },
        { label: 'Unpaid', value: stats.unpaid, icon: AlertCircle, color: '#F85149' },
    ];

    const handlePaySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!payPenalty || !payDate || !proofUrl.trim()) {
            toast.error('Please fill all required fields.'); return;
        }
        setSubmitting(true);
        try {
            const updated = await submitPayment(
                payPenalty.id,
                payDate.toISOString().split('T')[0],
                proofUrl.trim(),
                payType,
                notes.trim(),
            );
            setPenalties(prev => prev.map(p => p.id === updated.id ? updated : p));
            setPayPenalty(null);
            setProofUrl(''); setNotes(''); setPayDate(new Date()); setPayType('JazzCash');
            toast.success('Payment submitted! Awaiting admin verification.');
        } catch {
            toast.error('Failed to submit payment.');
        } finally {
            setSubmitting(false);
        }
    };

    const statusBadge = (status: Penalty['status']) => {
        const cls = status === 'Paid' ? 'badge-paid' : status === 'Pending' ? 'badge-pending' : 'badge-unpaid';
        return <span className={cls}>{status}</span>;
    };

    return (
        <div className="page-enter flex flex-col h-full">
            <Header title={`Welcome, ${user?.name?.split(' ')[0]}!`} subtitle="Your penalty overview" />

            <div className="p-8 space-y-8 flex-1">
                {/* Stats */}
                {loading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => <div key={i} className="stat-card animate-pulse"><div className="h-10 rounded" style={{ background: 'var(--border)' }} /></div>)}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {statCards.map(({ label, value, icon: Icon, color }) => (
                            <div key={label} className="stat-card">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                                        <Icon size={16} style={{ color }} />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold">{value}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Bank Info Banner */}
                <div className="rounded-xl p-5 flex items-center justify-between"
                    style={{ background: 'var(--accent-dim)', border: '1px solid rgba(59,245,196,0.25)' }}>
                    <div>
                        <p className="font-semibold" style={{ color: 'var(--accent)' }}>Pay via JazzCash</p>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                            Name: <strong style={{ color: 'var(--text-primary)' }}>Azan Asim</strong> &nbsp;|&nbsp;
                            Account: <strong style={{ color: 'var(--text-primary)' }}>03221475219</strong>
                        </p>
                    </div>
                    <a href="/bank-info" className="btn-secondary text-sm">View Details</a>
                </div>

                {/* Penalties Table */}
                <div className="card" style={{ padding: 0 }}>
                    <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                        <h2 className="font-semibold">My Penalties</h2>
                    </div>
                    {loading ? (
                        <div className="p-8 flex justify-center"><div className="spinner" /></div>
                    ) : penalties.length === 0 ? (
                        <div className="p-8 text-center">
                            <CheckCircle size={40} className="mx-auto mb-3" style={{ color: 'var(--success)' }} />
                            <p className="font-medium">You have no penalties!</p>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Great job keeping a clean record.</p>
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table>
                                <thead><tr>
                                    <th>Reason</th><th>Amount</th><th>Date</th><th>Status</th><th>Action</th>
                                </tr></thead>
                                <tbody>
                                    {penalties.map(p => (
                                        <tr key={p.id}>
                                            <td>
                                                <p className="text-sm max-w-xs" title={p.reason} style={{ color: 'var(--text-secondary)' }}>{p.reason}</p>
                                            </td>
                                            <td className="font-semibold" style={{ color: 'var(--accent)' }}>{formatCurrency(p.amount)}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{formatDate(p.date)}</td>
                                            <td>{statusBadge(p.status)}</td>
                                            <td>
                                                {p.status === 'Unpaid' && (
                                                    <button className="btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                                        onClick={() => setPayPenalty(p)}>
                                                        <CreditCard size={14} /> Pay Now
                                                    </button>
                                                )}
                                                {p.status === 'Pending' && (
                                                    <span className="text-xs" style={{ color: 'var(--warning)' }}>Under review</span>
                                                )}
                                                {p.status === 'Paid' && (
                                                    <span className="text-xs" style={{ color: 'var(--success)' }}>✓ Confirmed</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Pay Penalty Modal */}
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

                        <form onSubmit={handlePaySubmit} className="space-y-4">
                            <div>
                                <label className="label">Payment Date *</label>
                                <div className="input flex items-center gap-2">
                                    <CalendarDays size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                                    <DatePicker selected={payDate} onChange={(d: Date | null) => setPayDate(d)}
                                        dateFormat="yyyy-MM-dd" placeholderText="Select date" />
                                </div>
                            </div>

                            <div>
                                <label className="label">Payment Type *</label>
                                <select className="select" value={payType}
                                    onChange={e => setPayType(e.target.value as PaymentType)}>
                                    <option value="JazzCash">JazzCash</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Cash">Cash</option>
                                </select>
                            </div>

                            <ImageUploader
                                label="Payment Screenshot"
                                value={proofUrl}
                                onChange={setProofUrl}
                                required
                            />

                            <div>
                                <label className="label">Notes (Optional)</label>
                                <textarea className="input" rows={2} placeholder="e.g. Transaction ID: XXXX"
                                    value={notes} onChange={e => setNotes(e.target.value)} />
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
