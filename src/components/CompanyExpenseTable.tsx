'use client';

import { CompanyExpense } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Trash2, FileText } from 'lucide-react';

interface CompanyExpenseTableProps {
    expenses: CompanyExpense[];
    onDelete: (id: string) => Promise<void>;
}

export default function CompanyExpenseTable({ expenses, onDelete }: CompanyExpenseTableProps) {
    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            await onDelete(id);
        }
    };

    if (expenses.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                No company expenses found. Add your first expense to get started.
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
                        <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Paid By</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Approved By</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Method</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Receipt</th>
                        <th className="px-6 py-3 text-center text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {expenses.map((expense) => (
                        <tr
                            key={expense.id}
                            style={{ borderBottom: '1px solid var(--border)' }}
                            className="hover:bg-opacity-50"
                        >
                            <td className="px-6 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                                {formatDate(expense.date)}
                            </td>
                            <td className="px-6 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                                {expense.description}
                            </td>
                            <td className="px-6 py-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {formatCurrency(expense.amount)}
                            </td>
                            <td className="px-6 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                                {expense.paidBy}
                            </td>
                            <td className="px-6 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                                {expense.approvedBy}
                            </td>
                            <td className="px-6 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                                <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: 'var(--bg-hover)' }}>
                                    {expense.paymentMethod}
                                </span>
                            </td>
                            <td className="px-6 py-3 text-sm">
                                {expense.receiptUrl ? (
                                    <span className="text-blue-600 cursor-pointer hover:text-blue-800 flex items-center gap-1">
                                        <FileText size={16} />
                                        {expense.receiptUrl}
                                    </span>
                                ) : (
                                    <span style={{ color: 'var(--text-secondary)' }}>-</span>
                                )}
                            </td>
                            <td className="px-6 py-3 text-center">
                                <button
                                    onClick={() => handleDelete(expense.id)}
                                    className="text-red-500 hover:text-red-700 transition"
                                    title="Delete expense"
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
