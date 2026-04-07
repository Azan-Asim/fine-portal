'use client';

import { CompanyExpense } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Trash2, FileText, Pencil } from 'lucide-react';

interface CompanyExpenseTableProps {
    expenses: CompanyExpense[];
    onDelete: (id: string) => Promise<void>;
    onEdit?: (expense: CompanyExpense) => void;
    canEdit?: boolean;
    canDelete?: boolean;
}

export default function CompanyExpenseTable({ expenses, onDelete, onEdit, canEdit = false, canDelete = true }: CompanyExpenseTableProps) {
    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            await onDelete(id);
        }
    };

    const sortedExpenses = [...expenses].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

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
                    {sortedExpenses.map((expense) => (
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
                                    <a href={expense.receiptUrl} target="_blank" rel="noreferrer" className="text-blue-600 cursor-pointer hover:text-blue-800 flex items-center gap-1">
                                        <FileText size={16} />
                                        {expense.receiptUrl}
                                    </a>
                                ) : (
                                    <span style={{ color: 'var(--text-secondary)' }}>-</span>
                                )}
                            </td>
                            <td className="px-6 py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    {canEdit && onEdit ? (
                                        <button
                                            onClick={() => onEdit(expense)}
                                            className="text-blue-500 hover:text-blue-700 transition"
                                            title="Edit expense"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                    ) : null}
                                    {canDelete ? (
                                        <button
                                            onClick={() => handleDelete(expense.id)}
                                            className="text-red-500 hover:text-red-700 transition"
                                            title="Delete expense"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    ) : null}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
