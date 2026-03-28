'use client';

import { useState } from 'react';
import { CompanyExpense, CompanyIncome } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { generateFinanceReportPDF } from '@/lib/pdfGenerator';
import { Download } from 'lucide-react';

interface CompanyFinanceReportProps {
    expenses: CompanyExpense[];
    incomes: CompanyIncome[];
}

export default function CompanyFinanceReport({ expenses, incomes }: CompanyFinanceReportProps) {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Filter data by selected month and year
    const monthExpenses = expenses.filter(e => {
        const date = new Date(e.date);
        return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    });

    const monthIncomes = incomes.filter(i => {
        const date = new Date(i.date);
        return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    });

    const totalIncome = monthIncomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netBalance = totalIncome - totalExpenses;

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const handleDownloadPDF = () => {
        generateFinanceReportPDF(
            'Monthly Finance Report - Company Income & Expenses',
            monthNames[selectedMonth],
            selectedYear,
            [
                { label: 'Total Income', value: formatCurrency(totalIncome) },
                { label: 'Total Expenses', value: formatCurrency(totalExpenses) },
                { label: 'Net Balance', value: formatCurrency(netBalance) },
                { label: 'Income Transactions', value: monthIncomes.length },
            ],
            {
                headers: ['Category', 'Count', 'Amount'],
                rows: [
                    ['Income', monthIncomes.length.toString(), formatCurrency(totalIncome)],
                    ['Expenses', monthExpenses.length.toString(), formatCurrency(totalExpenses)],
                    ['Net Balance', '-', formatCurrency(netBalance)],
                ]
            }
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Monthly Finance Report - Company
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Total Income
                    </div>
                    <div className="text-3xl font-bold mt-2" style={{ color: '#3FB950' }}>
                        {formatCurrency(totalIncome)}
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {monthIncomes.length} transactions
                    </p>
                </div>

                <div className="rounded-lg p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Total Expenses
                    </div>
                    <div className="text-3xl font-bold mt-2" style={{ color: '#F85149' }}>
                        {formatCurrency(totalExpenses)}
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {monthExpenses.length} transactions
                    </p>
                </div>

                <div className="rounded-lg p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Net Balance
                    </div>
                    <div className="text-3xl font-bold mt-2" style={{ color: netBalance >= 0 ? '#3FB950' : '#F85149' }}>
                        {formatCurrency(netBalance)}
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {netBalance >= 0 ? 'Surplus' : 'Deficit'}
                    </p>
                </div>
            </div>

            {/* Detailed Summary */}
            <div className="rounded-lg p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                    Summary for {monthNames[selectedMonth]} {selectedYear}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Income Section */}
                    <div className="rounded-lg p-4" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                        <h4 className="font-semibold mb-4" style={{ color: '#3FB950' }}>Income Details</h4>
                        <div className="space-y-2">
                            {monthIncomes.length > 0 ? (
                                <>
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--text-secondary)' }}>Total Income</span>
                                        <span className="font-semibold" style={{ color: '#3FB950' }}>
                                            {formatCurrency(totalIncome)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--text-secondary)' }}>Transactions</span>
                                        <span style={{ color: 'var(--text-primary)' }}>{monthIncomes.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--text-secondary)' }}>Average Income</span>
                                        <span style={{ color: 'var(--text-primary)' }}>
                                            {formatCurrency(totalIncome / monthIncomes.length)}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <p style={{ color: 'var(--text-secondary)' }}>No income recorded</p>
                            )}
                        </div>
                    </div>

                    {/* Expense Section */}
                    <div className="rounded-lg p-4" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                        <h4 className="font-semibold mb-4" style={{ color: '#F85149' }}>Expense Details</h4>
                        <div className="space-y-2">
                            {monthExpenses.length > 0 ? (
                                <>
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--text-secondary)' }}>Total Expenses</span>
                                        <span className="font-semibold" style={{ color: '#F85149' }}>
                                            {formatCurrency(totalExpenses)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--text-secondary)' }}>Transactions</span>
                                        <span style={{ color: 'var(--text-primary)' }}>{monthExpenses.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--text-secondary)' }}>Average Expense</span>
                                        <span style={{ color: 'var(--text-primary)' }}>
                                            {formatCurrency(totalExpenses / monthExpenses.length)}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <p style={{ color: 'var(--text-secondary)' }}>No expenses recorded</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Net Balance Section */}
                <div className="mt-6 rounded-lg p-4 border-2" style={{ borderColor: netBalance >= 0 ? '#3FB950' : '#F85149', background: 'var(--bg-hover)' }}>
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Net Balance</p>
                            <p className="text-3xl font-bold" style={{ color: netBalance >= 0 ? '#3FB950' : '#F85149' }}>
                                {formatCurrency(netBalance)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                {netBalance >= 0 ? 'SURPLUS' : 'DEFICIT'}
                            </p>
                            <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                                {totalIncome > 0 ? `${((totalExpenses / totalIncome) * 100).toFixed(1)}% spent` : 'No income recorded'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
