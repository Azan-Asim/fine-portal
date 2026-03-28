'use client';

import { CompanyIncome } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Trash2, FileText } from 'lucide-react';

interface CompanyIncomeTableProps {
    incomes: CompanyIncome[];
    onDelete: (id: string) => Promise<void>;
}

export default function CompanyIncomeTable({ incomes, onDelete }: CompanyIncomeTableProps) {
    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this income?')) {
            await onDelete(id);
        }
    };

    if (incomes.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                No company income found. Add your first income to get started.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border)' }}>
                        <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Date</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Description</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Amount</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Received By</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Receipt</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Notes</th>
                        <th className="px-6 py-3 text-center text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {incomes.map((income) => (
                        <tr
                            key={income.id}
                            style={{ borderBottom: '1px solid var(--border)' }}
                            className="hover:bg-opacity-50"
                        >
                            <td className="px-6 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                                {formatDate(income.date)}
                            </td>
                            <td className="px-6 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                                {income.description}
                            </td>
                            <td className="px-6 py-3 text-sm font-semibold" style={{ color: '#3FB950' }}>
                                +{formatCurrency(income.amount)}
                            </td>
                            <td className="px-6 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                                <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: 'var(--bg-hover)' }}>
                                    {income.receivedBy}
                                </span>
                            </td>
                            <td className="px-6 py-3 text-sm">
                                {income.receiptUrl ? (
                                    <span className="text-blue-600 cursor-pointer hover:text-blue-800 flex items-center gap-1">
                                        <FileText size={16} />
                                        {income.receiptUrl}
                                    </span>
                                ) : (
                                    <span style={{ color: 'var(--text-secondary)' }}>-</span>
                                )}
                            </td>
                            <td className="px-6 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                {income.notes || '-'}
                            </td>
                            <td className="px-6 py-3 text-center">
                                <button
                                    onClick={() => handleDelete(income.id)}
                                    className="text-red-500 hover:text-red-700 transition"
                                    title="Delete income"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
