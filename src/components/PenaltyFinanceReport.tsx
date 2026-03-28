'use client';

import { useState } from 'react';
import { Penalty, PenaltyExpense } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { generateFinanceReportPDF } from '@/lib/pdfGenerator';
import { Download } from 'lucide-react';

interface PenaltyFinanceReportProps {
    penalties: Penalty[];
    expenses: PenaltyExpense[];
}

export default function PenaltyFinanceReport({ penalties, expenses }: PenaltyFinanceReportProps) {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Filter data by selected month and year
    const monthPenalties = penalties.filter(p => {
        const date = new Date(p.date);
        return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    });

    const monthExpenses = expenses.filter(e => {
        const date = new Date(e.date);
        return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    });

    const totalPenaltiesReceived = monthPenalties
        .filter(p => p.status === 'Paid')
        .reduce((sum, p) => sum + p.amount, 0);

    const totalPending = monthPenalties
        .filter(p => p.status === 'Unpaid' || p.status === 'Pending')
        .reduce((sum, p) => sum + p.amount, 0);

    const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = totalPenaltiesReceived - totalExpenses;

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const handleDownloadPDF = () => {
        generateFinanceReportPDF(
            'Monthly Penalty Finance Report',
            monthNames[selectedMonth],
            selectedYear,
            [
                { label: 'Total Penalties Received', value: formatCurrency(totalPenaltiesReceived) },
                { label: 'Pending Penalties', value: formatCurrency(totalPending) },
                { label: 'Total Expenses', value: formatCurrency(totalExpenses) },
                { label: 'Remaining Balance', value: formatCurrency(remaining) },
                { label: 'Total Penalties (Count)', value: monthPenalties.length },
                { label: 'Total Expenses (Count)', value: monthExpenses.length },
            ],
            {
                headers: ['Item', 'Count', 'Amount'],
                rows: [
                    ['Penalties Received', monthPenalties.filter(p => p.status === 'Paid').length.toString(), formatCurrency(totalPenaltiesReceived)],
                    ['Penalties Pending', monthPenalties.filter(p => p.status !== 'Paid').length.toString(), formatCurrency(totalPending)],
                    ['Expenses', monthExpenses.length.toString(), formatCurrency(totalExpenses)],
                    ['Remaining', '-', formatCurrency(remaining)],
                ]
            }
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Monthly Finance Report - Penalties
                </h2>
                <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                    <Download size={18} />
                    Download PDF
                </button>
            </div>

            {/* Month & Year Selection */}
            <div className="flex gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                        Month
                    </label>
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg-primary)' }}
                    >
                        {monthNames.map((month, idx) => (
                            <option key={idx} value={idx}>
                                {month}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                        Year
                    </label>
                    <input
                        type="number"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        min="2020"
                        max={new Date().getFullYear() + 1}
                        className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg-primary)', width: '120px' }}
                    />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-lg p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Total Penalties Received
                    </div>
                    <div className="text-2xl font-bold mt-2" style={{ color: '#3FB950' }}>
                        {formatCurrency(totalPenaltiesReceived)}
                    </div>
                </div>

                <div className="rounded-lg p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Pending Penalties
                    </div>
                    <div className="text-2xl font-bold mt-2" style={{ color: '#F0883E' }}>
                        {formatCurrency(totalPending)}
                    </div>
                </div>

                <div className="rounded-lg p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Total Expenses
                    </div>
                    <div className="text-2xl font-bold mt-2" style={{ color: '#F85149' }}>
                        {formatCurrency(totalExpenses)}
                    </div>
                </div>

                <div className="rounded-lg p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Remaining Balance
                    </div>
                    <div className="text-2xl font-bold mt-2" style={{ color: '#58A6FF' }}>
                        {formatCurrency(remaining)}
                    </div>
                </div>
            </div>

            {/* Summary Section */}
            <div className="rounded-lg p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                    Summary for {monthNames[selectedMonth]} {selectedYear}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Penalties Received</p>
                        <p className="text-3xl font-bold" style={{ color: '#3FB950' }}>
                            {formatCurrency(totalPenaltiesReceived)}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                            From {monthPenalties.filter(p => p.status === 'Paid').length} paid penalties
                        </p>
                    </div>

                    <div>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Pending Penalties</p>
                        <p className="text-3xl font-bold" style={{ color: '#F0883E' }}>
                            {formatCurrency(totalPending)}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {monthPenalties.filter(p => p.status !== 'Paid').length} unpaid/pending
                        </p>
                    </div>

                    <div>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Expenses</p>
                        <p className="text-3xl font-bold" style={{ color: '#F85149' }}>
                            {formatCurrency(totalExpenses)}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {monthExpenses.length} expenses recorded
                        </p>
                    </div>

                    <div>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Remaining Balance</p>
                        <p className="text-3xl font-bold" style={{ color: '#58A6FF' }}>
                            {formatCurrency(remaining)}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                            After all expenses
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
