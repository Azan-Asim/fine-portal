'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { getEmployees, addPenalty } from '@/lib/googleSheets';
import { sendPenaltyEmail } from '@/lib/emailjs';
import { Employee } from '@/types';
import { formatDate } from '@/lib/utils';
import { Send, Loader2, CalendarDays } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import toast from 'react-hot-toast';

export default function IssuePenaltyPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loadingEmps, setLoadingEmps] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [selectedEmpId, setSelectedEmpId] = useState('');
    const [reason, setReason] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState<Date | null>(new Date());
    const [referenceUrl, setReferenceUrl] = useState(''); // holds the uploaded ImgBB URL

    const selectedEmp = employees.find(e => e.id === selectedEmpId);

    const dateValue = date ? date.toISOString().split('T')[0] : '';

    useEffect(() => {
        getEmployees().then(setEmployees).catch(() => toast.error('Failed to load employees.')).finally(() => setLoadingEmps(false));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmpId || !reason.trim() || !amount || !date) {
            toast.error('Please fill all required fields.');
            return;
        }
        if (!selectedEmp) { toast.error('Invalid employee selection.'); return; }

        setSubmitting(true);
        const dateStr = date.toISOString().split('T')[0];

        try {
            await addPenalty({
                employeeId: selectedEmp.id,
                employeeName: selectedEmp.name,
                email: selectedEmp.email,
                reason: reason.trim(),
                referenceUrl: referenceUrl.trim(),
                amount: Number(amount),
                date: dateStr,
            });

            // Send email notification
            try {
                await sendPenaltyEmail({
                    employeeName: selectedEmp.name,
                    employeeEmail: selectedEmp.email,
                    reason: reason.trim(),
                    amount: Number(amount),
                    date: dateStr,
                });
                toast.success('Penalty issued and email sent!');
            } catch {
                toast.success('Penalty issued!');
                toast.error('Email failed to send. Check EmailJS config.', { duration: 4000 });
            }

            // Reset form
            setSelectedEmpId(''); setReason(''); setAmount(''); setDate(new Date()); setReferenceUrl('');
        } catch {
            toast.error('Failed to issue penalty. Check your Google Sheets connection.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-enter flex flex-col h-full">
            <Header title="Issue Penalty" subtitle="Create a new penalty for an employee" />

            <div className="p-8 flex-1">
                <div className="max-w-2xl">
                    <div className="card">
                        <h2 className="font-semibold mb-6 text-lg" style={{ color: 'var(--accent)' }}>Penalty Details</h2>

                        {loadingEmps ? (
                            <div className="flex justify-center p-8"><div className="spinner" /></div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Employee Selector */}
                                <div>
                                    <label className="label">Penalized Person *</label>
                                    <select className="select" value={selectedEmpId}
                                        onChange={e => setSelectedEmpId(e.target.value)} required>
                                        <option value="">— Select Employee —</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Auto-filled email */}
                                {selectedEmp && (
                                    <div>
                                        <label className="label">Employee Email (auto-filled)</label>
                                        <input className="input" value={selectedEmp.email} readOnly
                                            style={{ color: 'var(--text-secondary)', cursor: 'not-allowed' }} />
                                    </div>
                                )}

                                {/* Reason */}
                                <div>
                                    <label className="label">Reason for Penalty *</label>
                                    <textarea className="input" rows={4} placeholder="Describe the reason for this penalty..."
                                        value={reason} onChange={e => setReason(e.target.value)} required />
                                </div>

                                {/* Amount + Date row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Penalty Amount (PKR) *</label>
                                        <input type="number" min="1" className="input" placeholder="e.g. 1000"
                                            value={amount} onChange={e => setAmount(e.target.value)} required />
                                    </div>
                                    <div>
                                        <label className="label">Penalty Date *</label>
                                        <div className="input flex items-center gap-2" style={{ cursor: 'pointer' }}>
                                            <CalendarDays size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                                            <input
                                                type="date"
                                                value={dateValue}
                                                onChange={(event) => {
                                                    const value = event.target.value;
                                                    setDate(value ? new Date(`${value}T00:00:00`) : null);
                                                }}
                                                className="w-full bg-transparent outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Reference Image Upload */}
                                <ImageUploader
                                    label="Reference Image (Optional)"
                                    value={referenceUrl}
                                    onChange={setReferenceUrl}
                                />

                                {/* Preview */}
                                {selectedEmp && amount && date && (
                                    <div className="rounded-lg p-4 mt-2" style={{ background: 'var(--accent-dim)', border: '1px solid rgba(59,245,196,0.2)' }}>
                                        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--accent)' }}>PREVIEW</p>
                                        <div className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                                            <p><strong style={{ color: 'var(--text-primary)' }}>Employee:</strong> {selectedEmp.name}</p>
                                            <p><strong style={{ color: 'var(--text-primary)' }}>Amount:</strong> PKR {Number(amount).toLocaleString()}</p>
                                            <p><strong style={{ color: 'var(--text-primary)' }}>Date:</strong> {formatDate(date.toISOString().split('T')[0])}</p>
                                        </div>
                                    </div>
                                )}

                                <button type="submit" className="btn-primary w-full justify-center py-3" disabled={submitting}>
                                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                    {submitting ? 'Issuing Penalty...' : 'Issue Penalty & Send Email'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
