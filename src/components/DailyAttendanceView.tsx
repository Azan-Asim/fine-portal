'use client';

import React, { useState, useEffect } from 'react';
import { getDailyAttendanceSummariesByDate } from '@/lib/googleSheets';
import { DailyAttendanceSummary } from '@/types';
import toast from 'react-hot-toast';

interface DailyAttendanceViewProps {
    userRole?: string;
}

export default function DailyAttendanceView({ userRole = 'employee' }: DailyAttendanceViewProps) {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [records, setRecords] = useState<DailyAttendanceSummary[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchRecordsForDate();
    }, [selectedDate]);

    const fetchRecordsForDate = async () => {
        try {
            setIsLoading(true);
            const dateStr = formatDateToYYYYMMDD(selectedDate);
            const data = await getDailyAttendanceSummariesByDate(dateStr);
            setRecords(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch attendance records';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDateToYYYYMMDD = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const parseDateInput = (value: string): Date => {
        const parsed = new Date(`${value}T00:00:00`);
        return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    };

    const formatTimeString = (timeStr?: string): string => {
        if (!timeStr) return '-';
        try {
            return new Date(timeStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch {
            return timeStr;
        }
    };

    const getStatusColor = (status: string, isLate: boolean) => {
        if (status === 'Locked') return 'bg-gray-100 text-gray-800';
        if (isLate) return 'bg-red-100 text-red-800';
        return 'bg-green-100 text-green-800';
    };

    const getRecordBadgeClass = (isLate: boolean) => {
        return isLate ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200';
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Daily Attendance Summary</h2>

            {/* Date Picker */}
            <div className="mb-6 flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Select Date:</label>
                <input
                    type="date"
                    value={formatDateToYYYYMMDD(selectedDate)}
                    onChange={(event) => setSelectedDate(parseDateInput(event.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Loading attendance records...</p>
                </div>
            )}

            {/* Records Grid */}
            {!isLoading && (
                <>
                    {records.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <p className="text-gray-500 text-lg">No attendance records for {formatDateToYYYYMMDD(selectedDate)}</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4 text-sm text-gray-600">
                                Showing <span className="font-semibold">{records.length}</span> record{records.length !== 1 ? 's' : ''} for{' '}
                                <span className="font-semibold">{selectedDate.toDateString()}</span>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {records.map((record) => (
                                    <div
                                        key={record.id}
                                        className={`border-2 rounded-lg p-4 ${getRecordBadgeClass(record.isLateCheckIn)}`}
                                    >
                                        {/* Employee Info */}
                                        <div className="mb-3">
                                            <h3 className="font-semibold text-lg text-gray-800">{record.employeeName}</h3>
                                            <p className="text-sm text-gray-600">{record.employeeEmail}</p>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="mb-3 flex gap-2">
                                            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status, record.isLateCheckIn)}`}>
                                                {record.checkInStatus}
                                            </span>
                                            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${record.status === 'Locked' ? 'bg-gray-200 text-gray-700' : 'bg-blue-200 text-blue-700'}`}>
                                                {record.status}
                                            </span>
                                        </div>

                                        {/* Time & Hours */}
                                        <div className="space-y-2 mb-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Check-In:</span>
                                                <span className="font-medium">{formatTimeString(record.checkInTime)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Check-Out:</span>
                                                <span className="font-medium">{formatTimeString(record.checkOutTime)}</span>
                                            </div>
                                            <div className="flex justify-between border-t pt-2">
                                                <span className="text-gray-600 font-medium">Working Hours:</span>
                                                <span className="font-bold text-lg text-blue-600">{record.totalWorkingHours.toFixed(2)}h</span>
                                            </div>
                                        </div>

                                        {/* Notes Section */}
                                        {record.workSummary && (
                                            <div className="mt-3 pt-3 border-t">
                                                <p className="text-xs font-semibold text-gray-700 mb-1">Work Summary:</p>
                                                <p className="text-sm text-gray-600 line-clamp-2">{record.workSummary}</p>
                                            </div>
                                        )}

                                        {record.challengesAndSupport && (
                                            <div className="mt-2">
                                                <p className="text-xs font-semibold text-gray-700 mb-1">Challenges:</p>
                                                <p className="text-sm text-gray-600 line-clamp-2">{record.challengesAndSupport}</p>
                                            </div>
                                        )}

                                        {/* Locked Info */}
                                        {record.status === 'Locked' && record.lockedAt && (
                                            <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                                                Locked at {new Date(record.lockedAt).toLocaleTimeString()}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Summary Stats */}
                            <div className="mt-8 pt-6 border-t">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Summary</h3>
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-600">Total Employees</p>
                                        <p className="text-3xl font-bold text-blue-600">{records.length}</p>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-600">On Time</p>
                                        <p className="text-3xl font-bold text-green-600">{records.filter((r) => !r.isLateCheckIn).length}</p>
                                    </div>
                                    <div className="bg-red-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-600">Late Arrivals</p>
                                        <p className="text-3xl font-bold text-red-600">{records.filter((r) => r.isLateCheckIn).length}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-600">Avg Hours</p>
                                        <p className="text-3xl font-bold text-gray-600">
                                            {(records.reduce((sum, r) => sum + r.totalWorkingHours, 0) / records.length).toFixed(1)}h
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
