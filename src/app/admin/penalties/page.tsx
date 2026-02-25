'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';
import { getPenalties, deletePenalty, markPenaltyPaid, updatePenalty } from '@/lib/googleSheets';
import { Penalty, PenaltyStatus } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Trash2, CheckCircle, Eye, Search, Filter, Loader2, FileText, X } from 'lucide-react';
import toast from 'react-hot-toast';

type FilterOption = 'All' | PenaltyStatus;

export default function PenaltiesPage() {
    const [penalties, setPenalties] = useState<Penalty[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterOption>('All');
    const [actionId, setActionId] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Penalty | null>(null);
    const [viewProof, setViewProof] = useState<Penalty | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getPenalties();
            setPenalties(data);
        } catch {
            toast.error('Failed to load penalties.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = penalties.filter(p => {
        const matchFilter = filter === 'All' || p.status === filter;
        const matchSearch = p.employeeName.toLowerCase().includes(search.toLowerCase()) ||
            p.email.toLowerCase().includes(search.toLowerCase()) ||
            p.reason.toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
    });

    const handleDelete = async (p: Penalty) => {
        setActionId(p.id);
        try {
            await deletePenalty(p.id);
            setPenalties(prev => prev.filter(x => x.id !== p.id));
            setConfirmDelete(null);
            toast.success('Penalty removed.');
        } catch {
            toast.error('Failed to delete penalty.');
        } finally {
            setActionId(null);
        }
    };

    const handleMarkPaid = async (p: Penalty) => {
        setActionId(p.id);
        try {
            const updated = await markPenaltyPaid(p.id);
            setPenalties(prev => prev.map(x => x.id === p.id ? updated : x));
            toast.success('Marked as Paid!');
        } catch {
            toast.error('Failed to update penalty.');
        } finally {
            setActionId(null);
        }
    };

    const statusBadge = (status: PenaltyStatus) => {
        const cls = status === 'Paid' ? 'badge-paid' : status === 'Pending' ? 'badge-pending' : 'badge-unpaid';
        return <span className={cls}>{status}</span>;
    };

    const filterOptions: FilterOption[] = ['All', 'Unpaid', 'Pending', 'Paid'];

    return (
        <div className="page-enter flex flex-col h-full">
            <Header title="Penalty Management" subtitle="View, filter, and manage all penalties" />

            <div className="p-8 space-y-6 flex-1">
                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
                        <input className="input pl-9" placeholder="Search by name, email, or reason..."
                            value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                        <Filter size={16} className="self-center" style={{ color: 'var(--text-secondary)' }} />
                        {filterOptions.map(opt => (
                            <button key={opt} onClick={() => setFilter(opt)}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                                style={{
                                    background: filter === opt ? 'var(--accent)' : 'var(--bg-card)',
                                    color: filter === opt ? 'var(--bg-primary)' : 'var(--text-secondary)',
                                    border: `1px solid ${filter === opt ? 'var(--accent)' : 'var(--border)'}`,
                                }}>
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="card" style={{ padding: 0 }}>
                    <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
                        <FileText size={18} style={{ color: 'var(--accent)' }} />
                        <h2 className="font-semibold">Penalties ({filtered.length})</h2>
                    </div>

                    {loading ? (
                        <div className="p-8 flex justify-center"><div className="spinner" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="p-8 text-center">
                            <FileText size={40} className="mx-auto mb-3" style={{ color: 'var(--border)' }} />
                            <p style={{ color: 'var(--text-secondary)' }}>No penalties found.</p>
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table>
                                <thead><tr>
                                    <th>Employee</th><th>Reason</th><th>Amount</th><th>Date</th>
                                    <th>Status</th><th>Payment Type</th><th>Actions</th>
                                </tr></thead>
                                <tbody>
                                    {filtered.map(p => (
                                        <tr key={p.id}>
                                            <td>
                                                <div>
                                                    <p className="font-medium">{p.employeeName}</p>
                                                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{p.email}</p>
                                                </div>
                                            </td>
                                            <td>
                                                <p className="text-sm max-w-xs truncate" title={p.reason}
                                                    style={{ color: 'var(--text-secondary)' }}>{p.reason}</p>
                                            </td>
                                            <td className="font-semibold" style={{ color: 'var(--accent)' }}>{formatCurrency(p.amount)}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{formatDate(p.date)}</td>
                                            <td>{statusBadge(p.status)}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{p.paymentType || '—'}</td>
                                            <td>
                                                <div className="flex gap-2">
                                                    {p.paymentProof && (
                                                        <button onClick={() => setViewProof(p)}
                                                            className="p-1.5 rounded-md transition-colors"
                                                            title="View payment proof"
                                                            style={{ background: 'rgba(88,166,255,0.15)', color: '#58A6FF' }}>
                                                            <Eye size={14} />
                                                        </button>
                                                    )}
                                                    {p.status !== 'Paid' && (
                                                        <button onClick={() => handleMarkPaid(p)}
                                                            title="Mark as Paid"
                                                            disabled={actionId === p.id}
                                                            className="p-1.5 rounded-md transition-colors"
                                                            style={{ background: 'rgba(63,185,80,0.15)', color: 'var(--success)' }}>
                                                            {actionId === p.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                                        </button>
                                                    )}
                                                    <button onClick={() => setConfirmDelete(p)} title="Delete"
                                                        className="p-1.5 rounded-md transition-colors"
                                                        style={{ background: 'rgba(248,81,73,0.15)', color: 'var(--danger)' }}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Modal */}
            {confirmDelete && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                            style={{ background: 'rgba(248,81,73,0.15)' }}>
                            <Trash2 size={24} style={{ color: 'var(--danger)' }} />
                        </div>
                        <h3 className="text-lg font-bold text-center mb-2">Delete Penalty?</h3>
                        <p className="text-center text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                            Delete penalty for <strong>{confirmDelete.employeeName}</strong> ({formatCurrency(confirmDelete.amount)})?
                        </p>
                        <div className="flex gap-3">
                            <button className="btn-secondary flex-1" onClick={() => setConfirmDelete(null)}>Cancel</button>
                            <button className="btn-danger flex-1 justify-center" onClick={() => handleDelete(confirmDelete)} disabled={!!actionId}>
                                {actionId ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Proof Modal */}
            {viewProof && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: 560 }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">Payment Proof</h3>
                            <button onClick={() => setViewProof(null)}><X size={20} style={{ color: 'var(--text-secondary)' }} /></button>
                        </div>
                        <div className="text-sm space-y-2 mb-4" style={{ color: 'var(--text-secondary)' }}>
                            <p><strong style={{ color: 'var(--text-primary)' }}>Employee:</strong> {viewProof.employeeName}</p>
                            <p><strong style={{ color: 'var(--text-primary)' }}>Amount:</strong> {formatCurrency(viewProof.amount)}</p>
                            <p><strong style={{ color: 'var(--text-primary)' }}>Payment Date:</strong> {formatDate(viewProof.paymentDate)}</p>
                            <p><strong style={{ color: 'var(--text-primary)' }}>Payment Type:</strong> {viewProof.paymentType}</p>
                            {viewProof.notes && <p><strong style={{ color: 'var(--text-primary)' }}>Notes:</strong> {viewProof.notes}</p>}
                        </div>
                        {viewProof.paymentProof && (
                            <a href={viewProof.paymentProof} target="_blank" rel="noopener noreferrer"
                                className="btn-primary w-full justify-center">
                                <Eye size={16} /> View Screenshot
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
