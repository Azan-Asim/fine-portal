// TypeScript types for Devsinn Team Management Portal

export type UserRole = 'employee' | 'lead' | 'manager' | 'hr' | 'higher-management';
export type Department = 'web' | 'app' | 'backend' | 'overall' | '';

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    department?: Department;
    leadId?: string;
}

export interface Employee {
    id: string;
    name: string;
    email: string;
    fatherName: string;
    cnic: string;
    picture: string;
    bankName: string;
    bankTitle: string;
    bankAccountNumber: string;
    address: string;
    jobPosition: string;
    role: UserRole;
    department: Department;
    leadId: string;
    status: string;
    joiningDate: string;
    contactNumber: string;
    createdAt: string;
}

export type PenaltyStatus = 'Unpaid' | 'Pending' | 'Paid';
export type PaymentType = 'Cash' | 'Bank Transfer' | 'JazzCash';

export interface Penalty {
    id: string;
    employeeId: string;
    employeeName: string;
    email: string;
    reason: string;
    referenceUrl: string;
    amount: number;
    date: string;
    status: PenaltyStatus;
    paymentProof: string;
    paymentDate: string;
    paymentType: PaymentType | '';
    notes: string;
    createdAt: string;
}

export interface DashboardStats {
    total: number;
    paid: number;
    unpaid: number;
    pending: number;
}

// Expense Types
export type ExpenseType = 'penalty' | 'company';
export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'JazzCash' | 'Check';

export interface PenaltyExpense {
    id: string;
    date: string;
    description: string;
    amount: number;
    approvedBy: string;
    notes: string;
    createdAt: string;
}

export interface CompanyExpense {
    id: string;
    date: string;
    description: string;
    amount: number;
    paidBy: string;
    approvedBy: string;
    paymentMethod: PaymentMethod;
    receiptUrl: string;
    notes: string;
    createdAt: string;
}

export interface CompanyIncome {
    id: string;
    date: string;
    description: string;
    amount: number;
    receivedBy: PaymentMethod;
    receiptUrl: string;
    notes: string;
    createdAt: string;
}

export interface FinanceReport {
    month: string;
    year: number;
    totalPenalties: number;
    pendingPenalties: number;
    totalExpenses: number;
    totalIncome: number;
    remaining: number;
}

export type ApprovalScope = 'company-expense' | 'penalty-expense';

export interface AuthorizedApproverConfig {
    companyExpenseApproverIds: string[];
    penaltyExpenseApproverIds: string[];
}

export interface PayrollLineItem {
    employeeId: string;
    employeeName: string;
    accountNo: string;
    amount: number;
}

export interface PayrollDraft {
    payrollDate: string;
    chequeNo: string;
    salaryMonth: string;
    salaryYear: number;
    lineItems: PayrollLineItem[];
    preparedBy: string;
    designation: string;
}

export interface PayrollRecord extends PayrollDraft {
    id: string;
    total: number;
    payrollPdfHtml: string;
    chequeProofUrl: string;
    salaryReceived: boolean;
    salaryReceivedAt: string;
    createdAt: string;
}

export interface SalarySlip {
    id: string;
    payrollId: string;
    employeeId: string;
    employeeName: string;
    salaryMonth: string;
    salaryYear: number;
    payDate: string;
    amount: number;
    basicPay: number;
    leaveDeduction: number;
    lateDeduction: number;
    totalDeductions: number;
    netPay: number;
    workingDays: number;
    paidLeave: number;
    unpaidLeave: number;
    lateComings: number;
    slipHtml: string;
    createdAt: string;
}

export interface PerformanceRecord {
    id: string;
    employeeId: string;
    leadId: string;
    month: number;
    year: number;
    week1Comment: string;
    week1Score: number;
    week2Comment: string;
    week2Score: number;
    week3Comment: string;
    week3Score: number;
    week4Comment: string;
    week4Score: number;
    finalReviewerId: string;
    finalComment: string;
    finalScore: number;
    totalScore: number;
    maxScore: number;
    createdAt: string;
    updatedAt: string;
}

export type AttendanceDayType = 'Working Day' | 'Holiday';
export type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Holiday';

export interface WorkSession {
    checkIn: string;
    checkOut: string;
}

export interface BreakSession {
    start: string;
    end: string;
}

export interface AttendanceRecord {
    id: string;
    employeeId: string;
    date: string;
    dayType: AttendanceDayType;
    status: AttendanceStatus;
    leaveReason: string;
    trackingHours: number;
    workingHours: number;
    workSessions: WorkSession[];
    breakSessions: BreakSession[];
    performanceRecordId?: string;
    week1Comment?: string;
    week2Comment?: string;
    week3Comment?: string;
    week4Comment?: string;
    createdAt: string;
    updatedAt: string;
}

export interface EmployeeMonthlyAttendanceSummary {
    employee: Employee | null;
    month: number;
    year: number;
    totalWorkingHours: number;
    totalTrackingHours: number;
    totalLeaves: number;
    totalHolidays: number;
    totalPresents: number;
    totalAbsents: number;
    totalPerformanceScore: number;
    maxPerformanceScore: number;
    performance: PerformanceRecord | null;
    records: AttendanceRecord[];
}
