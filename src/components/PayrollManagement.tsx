'use client';

import React, { useState, useEffect } from 'react';
import {
    generateMonthlyPayroll,
    getAllMonthlyPayrollData,
    updatePayrollStatus,
    getEmployees
} from '@/lib/googleSheets';
import { Employee, MonthlyPayrollData } from '@/types';
import toast from 'react-hot-toast';

export default function PayrollManagement() {
    const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [payrollRecords, setPayrollRecords] = useState<MonthlyPayrollData[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        fetchInitialData();
    }, [month, year]);

    const fetchInitialData = async () => {
        try {
            setIsLoading(true);
            const [payroll, emps] = await Promise.all([
                getAllMonthlyPayrollData(month, year),
                getEmployees()
            ]);
            setPayrollRecords(payroll);
            setEmployees(emps);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch payroll data';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGeneratePayroll = async () => {
        setIsGenerating(true);
        try {
            const records = await generateMonthlyPayroll(month, year);
            setPayrollRecords(records);
            toast.success(`Payroll generated for ${records.length} employees`);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to generate payroll';
            toast.error(message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleUpdateStatus = async (recordId: string, newStatus: 'Pending' | 'Received' | 'Cancelled') => {
        try {
            const updated = await updatePayrollStatus(recordId, newStatus);
            setPayrollRecords((prev) =>
                prev.map((r) => (r.id === recordId ? updated : r))
            );
            toast.success(`Payroll status updated to ${newStatus}`);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update status';
            toast.error(message);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Received':
                return 'bg-green-100 text-green-800';
            case 'Pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'Cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getMonthName = (m: number): string => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return months[m - 1];
    };

    const totalNetPay = payrollRecords.reduce((sum, r) => sum + r.netPay, 0);
    const totalDeductions = payrollRecords.reduce((sum, r) => sum + r.totalDeductions, 0);
    const receivedCount = payrollRecords.filter((r) => r.payrollStatus === 'Received').length;

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Payroll Management</h2>

            {/* Month/Year Selector & Generate Button */}
            <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                    <select
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                            <option key={m} value={m}>
                                {getMonthName(m)}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-end">
                    <button
                        onClick={handleGeneratePayroll}
                        disabled={isGenerating || isLoading}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
                    >
                        {isGenerating ? 'Generating...' : 'Generate Payroll'}
                    </button>
                </div>

                <div className="flex items-end">
                    <button
                        onClick={fetchInitialData}
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
                    >
                        {isLoading ? 'Loading...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {payrollRecords.length > 0 && (
                <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-sm text-gray-600">Total Employees</p>
                        <p className="text-2xl font-bold text-blue-600">{payrollRecords.length}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <p className="text-sm text-gray-600">Total Net Pay</p>
                        <p className="text-2xl font-bold text-green-600">Rs. {totalNetPay.toFixed(2)}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <p className="text-sm text-gray-600">Total Deductions</p>
                        <p className="text-2xl font-bold text-red-600">Rs. {totalDeductions.toFixed(2)}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <p className="text-sm text-gray-600">Received</p>
                        <p className="text-2xl font-bold text-purple-600">{receivedCount}/{payrollRecords.length}</p>
                    </div>
                </div>
            )}

            {/* Payroll Records List */}
            {isLoading ? (
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Loading payroll records...</p>
                </div>
            ) : payrollRecords.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-lg">
                        No payroll records for {getMonthName(month)} {year}
                    </p>
                    <p className="text-gray-400 text-sm mt-2">Click "Generate Payroll" to create records</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {payrollRecords.map((record) => (
                        <div key={record.id} className="border rounded-lg overflow-hidden hover:shadow-md transition">
                            {/* Header / Summary Row */}
                            <div
                                onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                                className="bg-gray-50 border-b p-4 cursor-pointer hover:bg-gray-100 transition"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-800">{record.employeeName}</h3>
                                        <p className="text-sm text-gray-600">{record.email}</p>
                                    </div>

                                    <div className="text-right mr-4">
                                        <p className="text-2xl font-bold text-gray-800">Rs. {record.netPay.toFixed(2)}</p>
                                        <p className="text-xs text-gray-600">Net Pay</p>
                                    </div>

                                    <div className="ml-4">
                                        <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(record.payrollStatus)}`}>
                                            {record.payrollStatus}
                                        </span>
                                    </div>

                                    <div className="ml-4 text-xl text-gray-400">{expandedId === record.id ? '▼' : '▶'}</div>
                                </div>
                            </div>

                            {/* Detailed View */}
                            {expandedId === record.id && (
                                <div className="p-6 bg-white border-t">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
                                        {/* Attendance Metrics */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Attendance</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Working Days:</span>
                                                    <span className="font-medium">{record.totalWorkingDays}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Days Present:</span>
                                                    <span className="font-medium text-green-600">{record.totalPresent}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Late Comings:</span>
                                                    <span className="font-medium text-red-600">{record.totalLateComings}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Leave Details */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Leaves</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Paid Allowed:</span>
                                                    <span className="font-medium">{record.paidLeavesAllowed}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Paid Used:</span>
                                                    <span className="font-medium">{record.paidLeavesUsed}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Unpaid (4 lates = 1):</span>
                                                    <span className="font-medium text-red-600">{record.unpaidLeavesCalculated}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Salary Breakdown */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Salary Breakdown</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Base Salary:</span>
                                                    <span className="font-medium">Rs. {record.baseSalary.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-red-600">
                                                    <span>Total Deductions:</span>
                                                    <span className="font-medium">-Rs. {record.totalDeductions.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between border-t pt-2 text-lg">
                                                    <span className="font-semibold">Net Pay:</span>
                                                    <span className="font-bold text-green-600">Rs. {record.netPay.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Deduction Details */}
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                        <h4 className="text-sm font-semibold text-red-700 mb-3">Deduction Details</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-700">Leave Deduction (unpaid + paid):</span>
                                                <span className="font-medium">Rs. {record.totalLeaveDeduction.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-700">Late Penalty:</span>
                                                <span className="font-medium">Rs. {record.latePenaltyDeduction.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-700">Other Deductions:</span>
                                                <span className="font-medium">Rs. {record.otherDeductions.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        {record.payrollStatus === 'Pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleUpdateStatus(record.id, 'Received')}
                                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition"
                                                >
                                                    Mark as Received
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(record.id, 'Cancelled')}
                                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition"
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        )}
                                        {record.payrollStatus === 'Cancelled' && (
                                            <button
                                                onClick={() => handleUpdateStatus(record.id, 'Pending')}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition"
                                            >
                                                Restore to Pending
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Help Section */}
            <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">How Payroll Works</h3>
                <div className="space-y-3 text-sm text-gray-700 bg-blue-50 p-4 rounded-lg">
                    <div>
                        <p className="font-semibold text-blue-900 mb-1">📊 Automatic Calculations:</p>
                        <p>
                            Payroll is generated automatically from daily attendance data. Leave deductions are calculated based on: 4 late arrivals = 1 unpaid
                            leave day.
                        </p>
                    </div>
                    <div>
                        <p className="font-semibold text-blue-900 mb-1">✅ Workflow:</p>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Generate payroll for the month (uses most recent attendance data)</li>
                            <li>Review each employee's breakdown and deductions</li>
                            <li>Mark as "Received" when salary is paid (creates company expense automatically)</li>
                        </ol>
                    </div>
                    <div>
                        <p className="font-semibold text-blue-900 mb-1">💰 Late Arrival Penalty Rule:</p>
                        <p>Employee Policy: 4 late arrivals (after 9:10 AM) = 1 full unpaid holiday deducted from salary.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
