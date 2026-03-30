'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { SalarySlip } from '@/types';
import { getSalarySlipsForEmployee } from '@/lib/googleSheets';
import toast from 'react-hot-toast';
import { printSalarySlip } from '@/lib/salarySlipPdf';

export default function EmployeeSalarySlipsPage() {
    const { user } = useAuth();
    const [slips, setSlips] = useState<SalarySlip[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const data = await getSalarySlipsForEmployee(user.id);
                setSlips(data);
            } catch {
                toast.error('Failed to load salary slips.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user]);

    return (
        <div className="page-enter flex flex-col h-full overflow-y-auto">
            <Header title="My Salary Slips" subtitle="Download monthly salary slips" />

            <div className="p-6">
                <div className="card" style={{ padding: 0 }}>
                    <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                        <h3 className="font-semibold">Saved Salary Slips</h3>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Month</th>
                                    <th>Pay Date</th>
                                    <th>Amount</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr>
                                ) : slips.length === 0 ? (
                                    <tr><td colSpan={4} className="p-4 text-center" style={{ color: 'var(--text-secondary)' }}>No slips available yet.</td></tr>
                                ) : (
                                    slips.map((slip) => (
                                        <tr key={slip.id}>
                                            <td>{slip.salaryMonth} {slip.salaryYear}</td>
                                            <td>{slip.payDate}</td>
                                            <td>PKR {Number(slip.netPay || 0).toLocaleString('en-PK')}</td>
                                            <td>
                                                <button className="btn-primary" onClick={() => printSalarySlip(slip)}>
                                                    Download Slip
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
