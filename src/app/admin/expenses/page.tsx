'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Header from '@/components/Header';
import PenaltyExpenseForm from '@/components/PenaltyExpenseForm';
import PenaltyExpenseTable from '@/components/PenaltyExpenseTable';
import PenaltyFinanceReport from '@/components/PenaltyFinanceReport';
import CompanyExpenseForm from '@/components/CompanyExpenseForm';
import CompanyExpenseTable from '@/components/CompanyExpenseTable';
import CompanyIncomeForm from '@/components/CompanyIncomeForm';
import CompanyIncomeTable from '@/components/CompanyIncomeTable';
import CompanyFinanceReport from '@/components/CompanyFinanceReport';
import { PenaltyExpense, CompanyExpense, CompanyIncome, Penalty, Employee, AuthorizedApproverConfig } from '@/types';
import { getPenalties, getPenaltyExpenses, getCompanyExpenses, getCompanyIncomes, addPenaltyExpense, addCompanyExpense, addCompanyIncome, deletePenaltyExpense, deleteCompanyExpense, deleteCompanyIncome, getEmployees, updateCompanyExpense } from '@/lib/googleSheets';
import { Plus, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { hasAnyRole, hasPermission, parseRoleList } from '@/lib/roleAccess';

type TabType = 'penalty-expenses' | 'company-expenses' | 'company-income' | 'reports';

export default function ExpensesPage() {
    const { user } = useAuth();
    const APPROVER_STORAGE_KEY = 'authorizedApproverConfig';
    const COMPANY_EXPENSES_PAGE_SIZE = 30;

    const [activeTab, setActiveTab] = useState<TabType>('penalty-expenses');
    const [penaltyExpenses, setPenaltyExpenses] = useState<PenaltyExpense[]>([]);
    const [companyExpenses, setCompanyExpenses] = useState<CompanyExpense[]>([]);
    const [companyIncomes, setCompanyIncomes] = useState<CompanyIncome[]>([]);
    const [penalties, setPenalties] = useState<Penalty[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [approverConfig, setApproverConfig] = useState<AuthorizedApproverConfig>({
        companyExpenseApproverIds: [],
        penaltyExpenseApproverIds: [],
    });

    const [showPenaltyExpenseForm, setShowPenaltyExpenseForm] = useState(false);
    const [showCompanyExpenseForm, setShowCompanyExpenseForm] = useState(false);
    const [showCompanyIncomeForm, setShowCompanyIncomeForm] = useState(false);
    const [editingCompanyExpense, setEditingCompanyExpense] = useState<CompanyExpense | null>(null);

    const [companyExpenseQuery, setCompanyExpenseQuery] = useState('');
    const [companyExpenseMonth, setCompanyExpenseMonth] = useState('all');
    const [companyExpensePaidBy, setCompanyExpensePaidBy] = useState('all');
    const [companyExpenseApprovedBy, setCompanyExpenseApprovedBy] = useState('all');
    const [companyExpensePage, setCompanyExpensePage] = useState(1);

    const assignedRoles = parseRoleList(user?.roles && user.roles.length > 0 ? user.roles : user?.role);
    const isAdminLike = hasAnyRole(assignedRoles, ['admin', 'hr', 'manager']);
    const canViewCompanyExpenses = isAdminLike || hasPermission(user?.permissions, 'module.company-expenses.view');
    const canEditCompanyExpenses = isAdminLike || hasPermission(user?.permissions, 'module.company-expenses.edit');
    const canManageApprovers = hasAnyRole(assignedRoles, ['admin']) || hasPermission(user?.permissions, 'module.expenses.manage-approvers');

    // Load data from Google Sheets
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [p, pe, ce, ci, emp] = await Promise.all([
                getPenalties(),
                getPenaltyExpenses(),
                getCompanyExpenses(),
                getCompanyIncomes(),
                getEmployees(),
            ]);
            setPenalties(p);
            setPenaltyExpenses(pe);
            setCompanyExpenses(ce);
            setCompanyIncomes(ci);
            setEmployees(emp);

            const savedConfig = localStorage.getItem(APPROVER_STORAGE_KEY);
            if (savedConfig) {
                setApproverConfig(JSON.parse(savedConfig) as AuthorizedApproverConfig);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [APPROVER_STORAGE_KEY]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        localStorage.setItem(APPROVER_STORAGE_KEY, JSON.stringify(approverConfig));
    }, [APPROVER_STORAGE_KEY, approverConfig]);

    const toggleApprover = (scope: 'company' | 'penalty', employeeId: string) => {
        setApproverConfig((prev) => {
            if (scope === 'company') {
                const exists = prev.companyExpenseApproverIds.includes(employeeId);
                return {
                    ...prev,
                    companyExpenseApproverIds: exists
                        ? prev.companyExpenseApproverIds.filter((id) => id !== employeeId)
                        : [...prev.companyExpenseApproverIds, employeeId],
                };
            }

            const exists = prev.penaltyExpenseApproverIds.includes(employeeId);
            return {
                ...prev,
                penaltyExpenseApproverIds: exists
                    ? prev.penaltyExpenseApproverIds.filter((id) => id !== employeeId)
                    : [...prev.penaltyExpenseApproverIds, employeeId],
            };
        });
    };

    const companyApprovers = employees.filter((emp) => approverConfig.companyExpenseApproverIds.includes(emp.id));
    const penaltyApprovers = employees.filter((emp) => approverConfig.penaltyExpenseApproverIds.includes(emp.id));

    // Handlers for Penalty Expenses
    const handleAddPenaltyExpense = async (expense: Omit<PenaltyExpense, 'id' | 'createdAt'>) => {
        try {
            const newExpense = await addPenaltyExpense(expense);
            setPenaltyExpenses(prev => [newExpense, ...prev]);
        } catch (error) {
            toast.error('Failed to add expense');
            throw error;
        }
    };

    const handleDeletePenaltyExpense = async (id: string) => {
        try {
            await deletePenaltyExpense(id);
            setPenaltyExpenses(prev => prev.filter(e => e.id !== id));
            toast.success('Expense deleted successfully');
        } catch (error) {
            toast.error('Failed to delete expense');
        }
    };

    // Handlers for Company Expenses
    const handleAddCompanyExpense = async (expense: Omit<CompanyExpense, 'id' | 'createdAt'>) => {
        if (!canEditCompanyExpenses) {
            toast.error('You do not have permission to add company expenses.');
            return;
        }
        try {
            const newExpense = await addCompanyExpense(expense);
            setCompanyExpenses(prev => [newExpense, ...prev]);
        } catch (error) {
            throw error;
        }
    };

    const handleDeleteCompanyExpense = async (id: string) => {
        if (!canEditCompanyExpenses) {
            toast.error('You do not have permission to delete company expenses.');
            return;
        }
        try {
            await deleteCompanyExpense(id);
            setCompanyExpenses(prev => prev.filter(e => e.id !== id));
            toast.success('Expense deleted successfully');
        } catch (error) {
            toast.error('Failed to delete expense');
        }
    };

    const handleUpdateCompanyExpense = async (expense: Omit<CompanyExpense, 'id' | 'createdAt'>) => {
        if (!editingCompanyExpense) return;
        if (!canEditCompanyExpenses) {
            toast.error('You do not have permission to edit company expenses.');
            return;
        }

        const updated = await updateCompanyExpense(editingCompanyExpense.id, expense);
        setCompanyExpenses((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
        setEditingCompanyExpense(null);
    };

    // Handlers for Company Income
    const handleAddCompanyIncome = async (income: Omit<CompanyIncome, 'id' | 'createdAt'>) => {
        try {
            const newIncome = await addCompanyIncome(income);
            setCompanyIncomes(prev => [newIncome, ...prev]);
        } catch (error) {
            toast.error('Failed to add income');
            throw error;
        }
    };

    const handleDeleteCompanyIncome = async (id: string) => {
        try {
            await deleteCompanyIncome(id);
            setCompanyIncomes(prev => prev.filter(i => i.id !== id));
            toast.success('Income deleted successfully');
        } catch (error) {
            toast.error('Failed to delete income');
        }
    };

    // Calculate summary stats
    const totalPenaltyExpenses = penaltyExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalCompanyExpenses = companyExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalCompanyIncome = companyIncomes.reduce((sum, i) => sum + i.amount, 0);

    const companyExpenseMonths = useMemo(() => {
        const months = Array.from(new Set(companyExpenses.map((expense) => {
            const date = new Date(expense.date);
            return isNaN(date.getTime()) ? 'Unknown Month' : date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        })));
        return months.sort((a, b) => (a < b ? 1 : -1));
    }, [companyExpenses]);

    const companyExpensePaidByOptions = useMemo(() => {
        return Array.from(new Set(companyExpenses.map((expense) => String(expense.paidBy || '').trim()).filter(Boolean))).sort();
    }, [companyExpenses]);

    const companyExpenseApprovedByOptions = useMemo(() => {
        return Array.from(new Set(companyExpenses.map((expense) => String(expense.approvedBy || '').trim()).filter(Boolean))).sort();
    }, [companyExpenses]);

    const filteredCompanyExpenses = useMemo(() => {
        const term = companyExpenseQuery.trim().toLowerCase();

        return companyExpenses.filter((expense) => {
            const expenseDate = new Date(expense.date);
            const expenseMonth = isNaN(expenseDate.getTime()) ? 'Unknown Month' : expenseDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

            const matchMonth = companyExpenseMonth === 'all' || expenseMonth === companyExpenseMonth;
            const matchPaidBy = companyExpensePaidBy === 'all' || String(expense.paidBy || '').trim() === companyExpensePaidBy;
            const matchApprovedBy = companyExpenseApprovedBy === 'all' || String(expense.approvedBy || '').trim() === companyExpenseApprovedBy;

            if (!term) {
                return matchMonth && matchPaidBy && matchApprovedBy;
            }

            const haystack = [
                expense.description,
                expense.paidBy,
                expense.approvedBy,
                expense.paymentMethod,
                expense.receiptUrl,
                expense.notes,
                expense.date,
            ].join(' ').toLowerCase();

            return matchMonth && matchPaidBy && matchApprovedBy && haystack.includes(term);
        });
    }, [companyExpenses, companyExpenseQuery, companyExpenseMonth, companyExpensePaidBy, companyExpenseApprovedBy]);

    const companyExpensesTotalPages = Math.max(1, Math.ceil(filteredCompanyExpenses.length / COMPANY_EXPENSES_PAGE_SIZE));
    const paginatedCompanyExpenses = useMemo(() => {
        const start = (companyExpensePage - 1) * COMPANY_EXPENSES_PAGE_SIZE;
        return filteredCompanyExpenses.slice(start, start + COMPANY_EXPENSES_PAGE_SIZE);
    }, [filteredCompanyExpenses, companyExpensePage]);

    useEffect(() => {
        setCompanyExpensePage(1);
    }, [companyExpenseQuery, companyExpenseMonth, companyExpensePaidBy, companyExpenseApprovedBy]);

    useEffect(() => {
        if (companyExpensePage > companyExpensesTotalPages) {
            setCompanyExpensePage(companyExpensesTotalPages);
        }
    }, [companyExpensePage, companyExpensesTotalPages]);

    if (loading) {
        return (
            <div className="flex flex-col h-full">
                <Header title="Expense Management" subtitle="Loading..." />
                <div className="flex-1 flex items-center justify-center">
                    <div className="spinner" style={{ width: 36, height: 36 }} />
                </div>
            </div>
        );
    }

    return (
        <div className="page-enter flex flex-col h-full overflow-y-auto">
            <Header title="Expense Management" subtitle="Manage penalties, company expenses, and income" />

            <div className="flex-1 p-6 space-y-6">
                <div className="rounded-lg p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Authorized Approvers by Designation</h2>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Select employees who can approve each expense type.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Company Expense Approvers</h3>
                            <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
                                {employees.map((emp) => (
                                    <label key={`company-${emp.id}`} className="flex items-center gap-3 p-2 rounded" style={{ background: 'var(--bg-hover)' }}>
                                        <input
                                            type="checkbox"
                                            checked={approverConfig.companyExpenseApproverIds.includes(emp.id)}
                                            onChange={() => toggleApprover('company', emp.id)}
                                            disabled={!canManageApprovers}
                                        />
                                        <span style={{ color: 'var(--text-primary)' }}>{emp.name}</span>
                                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>({emp.jobPosition || 'No Designation'})</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Penalty Expense Approvers</h3>
                            <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
                                {employees.map((emp) => (
                                    <label key={`penalty-${emp.id}`} className="flex items-center gap-3 p-2 rounded" style={{ background: 'var(--bg-hover)' }}>
                                        <input
                                            type="checkbox"
                                            checked={approverConfig.penaltyExpenseApproverIds.includes(emp.id)}
                                            onChange={() => toggleApprover('penalty', emp.id)}
                                            disabled={!canManageApprovers}
                                        />
                                        <span style={{ color: 'var(--text-primary)' }}>{emp.name}</span>
                                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>({emp.jobPosition || 'No Designation'})</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-lg p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                    Penalty Expenses
                                </p>
                                <p className="text-2xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>
                                    {penaltyExpenses.length}
                                </p>
                                <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                                    Total: PKR {totalPenaltyExpenses.toLocaleString('en-PK')}
                                </p>
                            </div>
                            <DollarSign size={24} style={{ color: '#F85149' }} />
                        </div>
                    </div>

                    <div className="rounded-lg p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                    Company Expenses
                                </p>
                                <p className="text-2xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>
                                    {companyExpenses.length}
                                </p>
                                <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                                    Total: PKR {totalCompanyExpenses.toLocaleString('en-PK')}
                                </p>
                            </div>
                            <TrendingDown size={24} style={{ color: '#F85149' }} />
                        </div>
                    </div>

                    <div className="rounded-lg p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                    Company Income
                                </p>
                                <p className="text-2xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>
                                    {companyIncomes.length}
                                </p>
                                <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                                    Total: PKR {totalCompanyIncome.toLocaleString('en-PK')}
                                </p>
                            </div>
                            <TrendingUp size={24} style={{ color: '#3FB950' }} />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex gap-0">
                        {[
                            { id: 'penalty-expenses', label: 'Penalty Expenses' },
                            { id: 'company-expenses', label: 'Company Expenses' },
                            { id: 'company-income', label: 'Company Income' },
                            { id: 'reports', label: 'Finance Reports' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                                    activeTab === tab.id
                                        ? 'border-blue-600'
                                        : 'border-transparent'
                                }`}
                                style={{
                                    color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)'
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="space-y-6">
                    {/* Penalty Expenses Tab */}
                    {activeTab === 'penalty-expenses' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                    Penalty Expenses
                                </h2>
                                <button
                                    onClick={() => setShowPenaltyExpenseForm(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    <Plus size={20} />
                                    Add Expense
                                </button>
                            </div>

                            <div className="rounded-lg p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                                <PenaltyExpenseTable
                                    expenses={penaltyExpenses}
                                    onDelete={handleDeletePenaltyExpense}
                                />
                            </div>

                            {showPenaltyExpenseForm && (
                                <PenaltyExpenseForm
                                    onSubmit={handleAddPenaltyExpense}
                                    onClose={() => setShowPenaltyExpenseForm(false)}
                                    approvers={penaltyApprovers}
                                />
                            )}
                        </div>
                    )}

                    {/* Company Expenses Tab */}
                    {activeTab === 'company-expenses' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                    Company Expenses
                                </h2>
                                {canEditCompanyExpenses ? (
                                    <button
                                        onClick={() => setShowCompanyExpenseForm(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                    >
                                        <Plus size={20} />
                                        Add Expense
                                    </button>
                                ) : null}
                            </div>

                            <div className="rounded-lg p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                                {!canViewCompanyExpenses ? (
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        You do not have permission to view company expenses.
                                    </p>
                                ) : (
                                    <>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                                    <input
                                        className="input"
                                        placeholder="Search description, paid by, notes..."
                                        value={companyExpenseQuery}
                                        onChange={(event) => setCompanyExpenseQuery(event.target.value)}
                                    />
                                    <select
                                        className="select"
                                        value={companyExpenseMonth}
                                        onChange={(event) => setCompanyExpenseMonth(event.target.value)}
                                    >
                                        <option value="all">All Months</option>
                                        {companyExpenseMonths.map((month) => (
                                            <option key={month} value={month}>{month}</option>
                                        ))}
                                    </select>
                                    <select
                                        className="select"
                                        value={companyExpensePaidBy}
                                        onChange={(event) => setCompanyExpensePaidBy(event.target.value)}
                                    >
                                        <option value="all">All Paid By</option>
                                        {companyExpensePaidByOptions.map((person) => (
                                            <option key={person} value={person}>{person}</option>
                                        ))}
                                    </select>
                                    <select
                                        className="select"
                                        value={companyExpenseApprovedBy}
                                        onChange={(event) => setCompanyExpenseApprovedBy(event.target.value)}
                                    >
                                        <option value="all">All Approved By</option>
                                        {companyExpenseApprovedByOptions.map((person) => (
                                            <option key={person} value={person}>{person}</option>
                                        ))}
                                    </select>
                                </div>

                                <CompanyExpenseTable
                                    expenses={paginatedCompanyExpenses}
                                    onDelete={handleDeleteCompanyExpense}
                                    canEdit={canEditCompanyExpenses}
                                    canDelete={canEditCompanyExpenses}
                                    onEdit={(expense) => setEditingCompanyExpense(expense)}
                                />

                                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        Showing {paginatedCompanyExpenses.length} of {filteredCompanyExpenses.length} expenses
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            className="btn-secondary"
                                            disabled={companyExpensePage <= 1}
                                            onClick={() => setCompanyExpensePage((previous) => Math.max(1, previous - 1))}
                                        >
                                            Previous
                                        </button>
                                        <span className="text-sm px-2" style={{ color: 'var(--text-secondary)' }}>
                                            Page {companyExpensePage} / {companyExpensesTotalPages}
                                        </span>
                                        <button
                                            className="btn-secondary"
                                            disabled={companyExpensePage >= companyExpensesTotalPages}
                                            onClick={() => setCompanyExpensePage((previous) => Math.min(companyExpensesTotalPages, previous + 1))}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                                    </>
                                )}
                            </div>

                            {showCompanyExpenseForm && (
                                <CompanyExpenseForm
                                    onSubmit={handleAddCompanyExpense}
                                    onClose={() => setShowCompanyExpenseForm(false)}
                                    approvers={companyApprovers}
                                />
                            )}

                            {editingCompanyExpense && (
                                <CompanyExpenseForm
                                    initialExpense={editingCompanyExpense}
                                    onSubmit={handleUpdateCompanyExpense}
                                    onClose={() => setEditingCompanyExpense(null)}
                                    approvers={companyApprovers}
                                />
                            )}
                        </div>
                    )}

                    {/* Company Income Tab */}
                    {activeTab === 'company-income' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                    Company Income
                                </h2>
                                <button
                                    onClick={() => setShowCompanyIncomeForm(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    <Plus size={20} />
                                    Add Income
                                </button>
                            </div>

                            <div className="rounded-lg p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                                <CompanyIncomeTable
                                    incomes={companyIncomes}
                                    onDelete={handleDeleteCompanyIncome}
                                />
                            </div>

                            {showCompanyIncomeForm && (
                                <CompanyIncomeForm
                                    onSubmit={handleAddCompanyIncome}
                                    onClose={() => setShowCompanyIncomeForm(false)}
                                />
                            )}
                        </div>
                    )}

                    {/* Reports Tab */}
                    {activeTab === 'reports' && (
                        <div className="space-y-12">
                            <div className="rounded-lg p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                                <PenaltyFinanceReport
                                    penalties={penalties}
                                    expenses={penaltyExpenses}
                                />
                            </div>

                            <div className="rounded-lg p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                                <CompanyFinanceReport
                                    expenses={companyExpenses}
                                    incomes={companyIncomes}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
