// TypeScript types for Devsinn Team Management Portal

export type UserRole = 'admin' | 'employee';

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
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
    createdAt: string;
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
    records: AttendanceRecord[];
}
