// TypeScript types for Devsinn Team Management Portal

export type UserRole = 'employee' | 'lead' | 'manager' | 'hr' | 'admin';
export type LegacyUserRole = UserRole | 'higher-management';
export type Department = 'web' | 'app' | 'backend' | 'overall' | '';
export type RuleTargetRole = UserRole | 'all';

export type PermissionKey =
    | 'module.company-expenses.view'
    | 'module.company-expenses.edit'
    | 'module.expenses.manage-approvers'
    | 'module.employees.manage-permissions';

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    roles: UserRole[];
    activeRole: UserRole;
    permissions: PermissionKey[];
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
    role: UserRole | string;
    permissions?: string;
    department: Department;
    leadId: string;
    status: string;
    joiningDate: string;
    contactNumber: string;
    startWorkingTime: string;
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

export interface CompanyAsset {
    id: string;
    assetName: string;
    allocatedResourceId: string;
    allocatedResourceName: string;
    allocatedResourceRole: UserRole | '';
    issuanceDate: string;
    returnDate: string;
    conditionAtIssuance: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
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

export interface RuleItem {
    id: string;
    targetRole: RuleTargetRole;
    title: string;
    content: string;
    active: boolean;
    sortOrder: number;
    createdBy: string;
    createdByName: string;
    updatedBy: string;
    updatedByName: string;
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

export interface ProjectItem {
    id: string;
    name: string;
    description: string;
    allowedDepartments: Department[];
    createdAt: string;
}

export interface ProjectDocument {
    id: string;
    projectId: string;
    title: string;
    description: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
    uploadedBy: string;
    uploadedByName: string;
    uploadedAt: string;
    accessList: string[];
}

// ============ DAILY WORK REPORT & ATTENDANCE SYSTEM ============

export type AttendanceSubmissionType = 'Check-In' | 'Check-Out';
export type DailyRecordStatus = 'Open' | 'Locked';

/**
 * Raw form submission - created every time employee fills the daily form
 * Employees submit this twice a day (morning check-in and evening check-out)
 */
export interface DailyWorkSubmission {
    id: string;
    employeeId: string;
    employeeEmail: string;
    date: string; // YYYY-MM-DD
    submissionType: AttendanceSubmissionType; // Check-In or Check-Out
    submissionTime: string; // ISO timestamp
    todaysSummary: string; // For Check-Out: what did you do today
    yesterdaysPlan?: string; // For Check-In: what was planned for today
    tomorrowsPlan?: string; // For Check-Out: what's planned for tomorrow
    challenges: string; // Any blockers or challenges
    supportNeeded: string; // What help is needed
    submittedByRole?: UserRole | string;
    createdAt: string;
}

/**
 * Merged daily attendance record - one per employee per day
 * Created/updated by automation that merges check-in and check-out submissions
 */
export interface DailyAttendanceSummary {
    id: string;
    employeeId: string;
    employeeEmail: string;
    employeeName: string;
    date: string; // YYYY-MM-DD
    checkInTime?: string; // ISO timestamp
    checkOutTime?: string; // ISO timestamp
    totalWorkingHours: number; // Calculated: (checkOut - checkIn) * 24, rounded to 2 decimals
    isLateCheckIn: boolean; // true if checkIn is after 9:10 AM
    checkInStatus: 'On Time' | 'Late'; // Derived from isLateCheckIn
    status: DailyRecordStatus; // Open until midnight, then Locked
    workSummary?: string; // merged from work submissions
    dayPlan?: string; // merged from submissions
    challengesAndSupport?: string; // merged from submissions
    createdAt: string;
    lockedAt?: string; // timestamp when record was locked at midnight
}

/**
 * Monthly payroll data with leave deductions
 */
export interface MonthlyPayrollData {
    id: string;
    employeeId: string;
    employeeName: string;
    email: string;
    month: number; // 1-12
    year: number;
    baseSalary: number;
    
    // Attendance metrics
    totalWorkingDays: number; // Days employee was supposed to work
    totalPresent: number; // Days with valid check-in/check-out
    totalLateComings: number; // Count of days where checkIn was after 9:10 AM
    
    // Leave calculations
    paidLeavesAllowed: number; // 1 per month policy
    paidLeavesUsed: number;
    unpaidLeavesCalculated: number; // (totalLateComings / 4) - full days deducted
    remainingPaidLeaves: number; // paidLeavesAllowed - paidLeavesUsed
    
    // Deductions
    totalLeaveDeduction: number; // (unpaidLeavesCalculated + paidLeavesUsed) * (baseSalary / 30)
    latePenaltyDeduction: number; // Can be manually added or auto-calculated
    otherDeductions: number;
    totalDeductions: number; // sum of all deductions
    
    // Final amounts
    netPay: number; // baseSalary - totalDeductions
    payrollStatus: 'Pending' | 'Received' | 'Cancelled';
    
    // Audit trail
    createdAt: string;
    updatedAt: string;
    approvedBy?: string;
    approvedAt?: string;
}
