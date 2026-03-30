'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import { Employee, PayrollDraft, PayrollLineItem, PayrollRecord, SalarySlip } from '@/types';
import { addPayrollRecord, addSalarySlipsForPayroll, getEmployees, getPayrollRecords, getSalarySlipsByPayroll, updatePayrollRecord } from '@/lib/googleSheets';
import { Plus, FileText, Trash2, CheckCircle2, Image as ImageIcon, Download } from 'lucide-react';
import { generatePayrollLetterPdf } from '@/lib/payrollPdf';
import { uploadImage } from '@/lib/uploadImage';
import toast from 'react-hot-toast';
import { printSalarySlip } from '@/lib/salarySlipPdf';

type PayrollEmployeeMeta = {
    salaryByEmployeeId: Record<string, number>;
};

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const META_KEY = 'payrollEmployeeMeta';
const MAX_PAYROLL_EMPLOYEES = 6;

export default function PayrollPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [salaryByEmployeeId, setSalaryByEmployeeId] = useState<Record<string, number>>({});
    const [payrollHistory, setPayrollHistory] = useState<PayrollRecord[]>([]);
    const [salarySlipsByPayrollId, setSalarySlipsByPayrollId] = useState<Record<string, SalarySlip[]>>({});
    const [actionLoadingId, setActionLoadingId] = useState<string>('');

    const [draft, setDraft] = useState<PayrollDraft>({
        payrollDate: new Date().toISOString().slice(0, 10),
        chequeNo: '',
        salaryMonth: MONTHS[new Date().getMonth()],
        salaryYear: new Date().getFullYear(),
        lineItems: [],
        preparedBy: 'Ubaid Ullah Asim',
        designation: 'Chief Executive',
    });

    const loadEmployees = useCallback(async () => {
        setLoading(true);
        try {
            const list = await getEmployees();
            setEmployees(list);
            const payrolls = await getPayrollRecords();
            setPayrollHistory(payrolls.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

            const metaRaw = localStorage.getItem(META_KEY);
            if (metaRaw) {
                const meta = JSON.parse(metaRaw) as PayrollEmployeeMeta;
                setSalaryByEmployeeId(meta.salaryByEmployeeId || {});
            }
        } catch {
            toast.error('Failed to load employees for payroll.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadEmployees();
    }, [loadEmployees]);

    const openPayrollPdf = (record: PayrollRecord) => {
        if (!record.payrollPdfHtml) {
            toast.error('No saved payroll PDF found for this record.');
            return;
        }
        const popup = window.open('', '_blank');
        if (!popup) {
            toast.error('Unable to open payroll PDF window.');
            return;
        }
        popup.document.open();
        popup.document.write(record.payrollPdfHtml);
        popup.document.close();
    };

    const uploadChequeProof = async (payrollId: string, file?: File) => {
        if (!file) return;
        setActionLoadingId(payrollId);
        try {
            const url = await uploadImage(file);
            const updated = await updatePayrollRecord(payrollId, { chequeProofUrl: url });
            setPayrollHistory((prev) => prev.map((p) => (p.id === payrollId ? updated : p)));
            toast.success('Cheque proof uploaded.');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to upload cheque proof.';
            toast.error(message);
        } finally {
            setActionLoadingId('');
        }
    };

    const markSalaryReceived = async (record: PayrollRecord) => {
        const ok = window.confirm('Confirm that salary is successfully delivered to all employees account?');
        if (!ok) return;
        setActionLoadingId(record.id);
        try {
            const updated = await updatePayrollRecord(record.id, {
                salaryReceived: true,
                salaryReceivedAt: new Date().toISOString(),
            });
            setPayrollHistory((prev) => prev.map((p) => (p.id === record.id ? updated : p)));
            toast.success('Salary is successfully delivered to employees account.');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to update salary delivery status.';
            toast.error(message);
        } finally {
            setActionLoadingId('');
        }
    };

    const generateSlips = async (record: PayrollRecord) => {
        setActionLoadingId(record.id);
        try {
            const slips = await addSalarySlipsForPayroll(record.id);
            setSalarySlipsByPayrollId((prev) => ({ ...prev, [record.id]: slips }));
            toast.success('Salary slips created for payroll employees.');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to generate salary slips.';
            toast.error(message);
        } finally {
            setActionLoadingId('');
        }
    };

    const loadSlips = async (record: PayrollRecord) => {
        setActionLoadingId(record.id);
        try {
            const slips = await getSalarySlipsByPayroll(record.id);
            setSalarySlipsByPayrollId((prev) => ({ ...prev, [record.id]: slips }));
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to load salary slips.';
            toast.error(message);
        } finally {
            setActionLoadingId('');
        }
    };

    useEffect(() => {
        const payload: PayrollEmployeeMeta = { salaryByEmployeeId };
        localStorage.setItem(META_KEY, JSON.stringify(payload));
    }, [salaryByEmployeeId]);

    const selectedEmployee = useMemo(
        () => employees.find((e) => e.id === selectedEmployeeId),
        [employees, selectedEmployeeId]
    );

    const addEmployeeRow = () => {
        if (draft.lineItems.length >= MAX_PAYROLL_EMPLOYEES) {
            toast.error(`You can add maximum ${MAX_PAYROLL_EMPLOYEES} employees in one payroll PDF.`);
            return;
        }

        if (!selectedEmployee) {
            toast.error('Select employee first.');
            return;
        }

        const alreadyAdded = draft.lineItems.some((line) => line.employeeId === selectedEmployee.id);
        if (alreadyAdded) {
            toast.error('Employee already added in payroll list.');
            return;
        }

        const amount = salaryByEmployeeId[selectedEmployee.id] || 0;
        const newLine: PayrollLineItem = {
            employeeId: selectedEmployee.id,
            employeeName: selectedEmployee.name,
            accountNo: selectedEmployee.bankAccountNumber || '',
            amount,
        };

        setDraft((prev) => ({ ...prev, lineItems: [...prev.lineItems, newLine] }));
        setSelectedEmployeeId('');
    };

    const updateLine = (employeeId: string, key: 'accountNo' | 'amount', value: string) => {
        setDraft((prev) => ({
            ...prev,
            lineItems: prev.lineItems.map((line) =>
                line.employeeId === employeeId
                    ? {
                        ...line,
                        [key]: key === 'amount' ? Number(value || 0) : value,
                    }
                    : line
            ),
        }));

        if (key === 'amount') {
            const amount = Number(value || 0);
            setSalaryByEmployeeId((prev) => ({ ...prev, [employeeId]: amount }));
        }
    };

    const removeLine = (employeeId: string) => {
        setDraft((prev) => ({
            ...prev,
            lineItems: prev.lineItems.filter((line) => line.employeeId !== employeeId),
        }));
    };

    const total = draft.lineItems.reduce((sum, line) => sum + Number(line.amount || 0), 0);

    const createPdf = async () => {
        if (!draft.chequeNo.trim()) {
            toast.error('Cheque no is required.');
            return;
        }
        if (draft.lineItems.length === 0) {
            toast.error('Add at least one employee to payroll list.');
            return;
        }
        if (draft.lineItems.length > MAX_PAYROLL_EMPLOYEES) {
            toast.error(`Only ${MAX_PAYROLL_EMPLOYEES} employees are allowed in one payroll PDF.`);
            return;
        }

        const computedTotal = draft.lineItems.reduce((sum, line) => sum + Number(line.amount || 0), 0);
        const popup = window.open('', '_blank');
        if (!popup) {
            toast.error('Unable to open print window. Please allow popups for this site.');
            return;
        }

        popup.document.open();
        popup.document.write('<!doctype html><html><head><title>Preparing Payroll PDF</title></head><body style="font-family: Arial, sans-serif; padding: 16px;">Preparing payroll PDF...</body></html>');
        popup.document.close();

        try {
            setSaving(true);
            const record = await addPayrollRecord({
                ...draft,
                total: computedTotal,
                payrollPdfHtml: '',
                chequeProofUrl: '',
                salaryReceived: false,
                salaryReceivedAt: '',
            });
            const popupHtml = generatePayrollLetterPdf(draft, popup);
            const updated = await updatePayrollRecord(record.id, { payrollPdfHtml: popupHtml });
            setPayrollHistory((prev) => [updated, ...prev]);
            toast.success('Payroll saved to Google Sheets.');
        } catch (error: unknown) {
            popup.close();
            const message = error instanceof Error ? error.message : 'Failed to open payroll PDF.';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page-enter flex flex-col h-full overflow-y-auto">
            <Header title="Monthly Payroll" subtitle="Create payroll letter and export PDF" />

            <div className="p-6 space-y-6">
                <div className="rounded-lg p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Payroll Form</h2>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Date</label>
                            <input
                                type="date"
                                value={draft.payrollDate}
                                onChange={(e) => setDraft((prev) => ({ ...prev, payrollDate: e.target.value }))}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Cheque No</label>
                            <input
                                type="text"
                                value={draft.chequeNo}
                                onChange={(e) => setDraft((prev) => ({ ...prev, chequeNo: e.target.value }))}
                                className="input"
                                placeholder="D-52849735"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Salary Month</label>
                            <select
                                value={draft.salaryMonth}
                                onChange={(e) => setDraft((prev) => ({ ...prev, salaryMonth: e.target.value }))}
                                className="input"
                            >
                                {MONTHS.map((month) => (
                                    <option key={month} value={month}>{month}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Salary Year</label>
                            <input
                                type="number"
                                min="2020"
                                max="2100"
                                value={draft.salaryYear}
                                onChange={(e) => setDraft((prev) => ({ ...prev, salaryYear: Number(e.target.value || new Date().getFullYear()) }))}
                                className="input"
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-lg p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    <div className="flex flex-col md:flex-row md:items-end gap-4">
                        <div className="flex-1">
                            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Add Employee</label>
                            <select
                                value={selectedEmployeeId}
                                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                className="input"
                                disabled={loading}
                            >
                                <option value="">Select employee</option>
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.name} ({emp.jobPosition || 'No Designation'})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button onClick={addEmployeeRow} className="btn-primary">
                            <Plus size={16} /> Add to Payroll
                        </button>
                    </div>
                </div>

                <div className="rounded-lg p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Payroll Employees</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    <th className="text-left p-2">Employee</th>
                                    <th className="text-left p-2">Account No</th>
                                    <th className="text-left p-2">Salary (PKR)</th>
                                    <th className="text-left p-2">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {draft.lineItems.map((line) => (
                                    <tr key={line.employeeId} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td className="p-2">{line.employeeName}</td>
                                        <td className="p-2">
                                            <input
                                                value={line.accountNo}
                                                onChange={(e) => updateLine(line.employeeId, 'accountNo', e.target.value)}
                                                className="input"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                value={line.amount}
                                                onChange={(e) => updateLine(line.employeeId, 'amount', e.target.value)}
                                                className="input"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <button onClick={() => removeLine(line.employeeId)} className="btn-secondary">
                                                <Trash2 size={14} /> Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {draft.lineItems.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-4 text-center" style={{ color: 'var(--text-secondary)' }}>
                                            No employee added to payroll yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4 text-right font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Total: PKR {total.toLocaleString('en-PK')}
                    </div>
                    <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Maximum {MAX_PAYROLL_EMPLOYEES} employees are allowed in one payroll PDF page.
                    </p>
                </div>

                <div className="rounded-lg p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Signatory</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Authorized Person Name</label>
                            <input
                                value={draft.preparedBy}
                                onChange={(e) => setDraft((prev) => ({ ...prev, preparedBy: e.target.value }))}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Designation</label>
                            <input
                                value={draft.designation}
                                onChange={(e) => setDraft((prev) => ({ ...prev, designation: e.target.value }))}
                                className="input"
                            />
                        </div>
                    </div>
                    <button onClick={createPdf} className="btn-primary" disabled={saving}>
                        <FileText size={16} /> {saving ? 'Saving Payroll...' : 'Generate Payroll PDF'}
                    </button>
                </div>

                <div className="rounded-lg p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Saved Payroll Records</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    <th className="text-left p-2">Month</th>
                                    <th className="text-left p-2">Date</th>
                                    <th className="text-left p-2">Total</th>
                                    <th className="text-left p-2">Cheque Proof</th>
                                    <th className="text-left p-2">Salary Status</th>
                                    <th className="text-left p-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payrollHistory.map((record) => (
                                    <tr key={record.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td className="p-2">{record.salaryMonth} {record.salaryYear}</td>
                                        <td className="p-2">{record.payrollDate}</td>
                                        <td className="p-2">PKR {Number(record.total || 0).toLocaleString('en-PK')}</td>
                                        <td className="p-2">
                                            <div className="flex items-center gap-2">
                                                {record.chequeProofUrl ? (
                                                    <a href={record.chequeProofUrl} target="_blank" rel="noreferrer" className="btn-secondary">
                                                        <ImageIcon size={14} /> View
                                                    </a>
                                                ) : (
                                                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Not uploaded</span>
                                                )}
                                                <label className="btn-secondary" style={{ cursor: 'pointer' }}>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        hidden
                                                        onChange={(e) => uploadChequeProof(record.id, e.target.files?.[0])}
                                                    />
                                                    Upload Check
                                                </label>
                                            </div>
                                        </td>
                                        <td className="p-2">
                                            {record.salaryReceived ? (
                                                <span className="text-green-500 text-xs font-semibold">Delivered</span>
                                            ) : (
                                                <span className="text-orange-400 text-xs font-semibold">Pending</span>
                                            )}
                                        </td>
                                        <td className="p-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <button className="btn-primary" onClick={() => openPayrollPdf(record)}>
                                                    <Download size={14} /> View PDF
                                                </button>
                                                {!record.salaryReceived && (
                                                    <button className="btn-secondary" onClick={() => markSalaryReceived(record)} disabled={actionLoadingId === record.id}>
                                                        <CheckCircle2 size={14} /> Received Salary
                                                    </button>
                                                )}
                                                <button className="btn-secondary" onClick={() => generateSlips(record)} disabled={actionLoadingId === record.id}>
                                                    Generate Slips
                                                </button>
                                                <button className="btn-secondary" onClick={() => loadSlips(record)} disabled={actionLoadingId === record.id}>
                                                    Load Slips
                                                </button>
                                            </div>
                                            {(salarySlipsByPayrollId[record.id] || []).length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {salarySlipsByPayrollId[record.id].map((slip) => (
                                                        <button key={slip.id} className="btn-secondary" onClick={() => printSalarySlip(slip)}>
                                                            {slip.employeeName} Slip
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {payrollHistory.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-4 text-center" style={{ color: 'var(--text-secondary)' }}>
                                            No payroll saved yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
