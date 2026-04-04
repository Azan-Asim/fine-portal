import {
    Employee,
    Penalty,
    PenaltyStatus,
    PaymentType,
    PenaltyExpense,
    CompanyExpense,
    CompanyIncome,
    PayrollRecord,
    AttendanceRecord,
    AttendanceDayType,
    AttendanceStatus,
    WorkSession,
    BreakSession,
    EmployeeMonthlyAttendanceSummary,
    PerformanceRecord,
    SalarySlip,
    UserRole,
    Department,
    ProjectItem,
    ProjectDocument,
    RuleItem,
} from '@/types';

export interface ManagementDashboardData {
    employees: Employee[];
    penalties: Penalty[];
    companyExpenses: CompanyExpense[];
    companyIncomes: CompanyIncome[];
    payrollRecords: PayrollRecord[];
    projects: ProjectItem[];
    projectDocumentCounts: Record<string, number>;
    attendanceRecords: AttendanceRecord[];
    performanceRecords: PerformanceRecord[];
}

export interface StaffDashboardData {
    employees: Employee[];
    penalties: Penalty[];
    salarySlips: SalarySlip[];
    monthlyAttendance: EmployeeMonthlyAttendanceSummary;
    currentPerformance: PerformanceRecord | null;
    attendanceRecords: AttendanceRecord[];
    performanceRecords: PerformanceRecord[];
}

async function request<T>(action: string, data?: object): Promise<T> {
    const res = await fetch('/api/google-sheets', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action,
            payload: data,
        }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
        const message =
            json && typeof json === 'object' && 'error' in json && typeof json.error === 'string'
                ? json.error
                : `Request failed: ${res.status}`;
        throw new Error(message);
    }
    if (!json || typeof json !== 'object') {
        throw new Error('Invalid JSON response from API');
    }
    if (json.error) throw new Error(json.error);
    return json.data as T;
}

// ============ EMPLOYEES ============

export async function getEmployees(): Promise<Employee[]> {
    return request<Employee[]>('getEmployees');
}

export async function addEmployee(data: Omit<Employee, 'id' | 'createdAt'>): Promise<Employee> {
    return request<Employee>('addEmployee', data);
}

export async function updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    return request<Employee>('updateEmployee', { id, updates });
}

export async function deleteEmployee(id: string): Promise<void> {
    return request<void>('deleteEmployee', { id });
}

// ============ PENALTIES ============

export async function getPenalties(): Promise<Penalty[]> {
    return request<Penalty[]>('getPenalties');
}

export async function addPenalty(data: Omit<Penalty, 'id' | 'status' | 'paymentProof' | 'paymentDate' | 'paymentType' | 'notes' | 'createdAt'>): Promise<Penalty> {
    return request<Penalty>('addPenalty', data);
}

export async function updatePenalty(id: string, updates: Partial<Penalty>): Promise<Penalty> {
    return request<Penalty>('updatePenalty', { id, updates });
}

export async function deletePenalty(id: string): Promise<void> {
    return request<void>('deletePenalty', { id });
}

export async function markPenaltyPaid(id: string): Promise<Penalty> {
    return request<Penalty>('updatePenalty', { id, updates: { status: 'Paid' as PenaltyStatus } });
}

export async function submitPayment(
    id: string,
    paymentDate: string,
    paymentProof: string,
    paymentType: PaymentType,
    notes: string,
): Promise<Penalty> {
    return request<Penalty>('updatePenalty', {
        id,
        updates: {
            status: 'Pending' as PenaltyStatus,
            paymentDate,
            paymentProof,
            paymentType,
            notes,
        },
    });
}

// ============ PENALTY EXPENSES ============

export async function getPenaltyExpenses(): Promise<PenaltyExpense[]> {
    return request<PenaltyExpense[]>('getPenaltyExpenses');
}

export async function addPenaltyExpense(data: Omit<PenaltyExpense, 'id' | 'createdAt'>): Promise<PenaltyExpense> {
    return request<PenaltyExpense>('addPenaltyExpense', data);
}

export async function deletePenaltyExpense(id: string): Promise<void> {
    return request<void>('deletePenaltyExpense', { id });
}

// ============ COMPANY EXPENSES ============

export async function getCompanyExpenses(): Promise<CompanyExpense[]> {
    return request<CompanyExpense[]>('getCompanyExpenses');
}

export async function addCompanyExpense(data: Omit<CompanyExpense, 'id' | 'createdAt'>): Promise<CompanyExpense> {
    return request<CompanyExpense>('addCompanyExpense', data);
}

export async function deleteCompanyExpense(id: string): Promise<void> {
    return request<void>('deleteCompanyExpense', { id });
}

// ============ COMPANY INCOME ============

export async function getCompanyIncomes(): Promise<CompanyIncome[]> {
    return request<CompanyIncome[]>('getCompanyIncomes');
}

export async function addCompanyIncome(data: Omit<CompanyIncome, 'id' | 'createdAt'>): Promise<CompanyIncome> {
    return request<CompanyIncome>('addCompanyIncome', data);
}

export async function deleteCompanyIncome(id: string): Promise<void> {
    return request<void>('deleteCompanyIncome', { id });
}

// ============ PAYROLL ============

export async function getPayrollRecords(): Promise<PayrollRecord[]> {
    return request<PayrollRecord[]>('getPayrollRecords');
}

export async function addPayrollRecord(data: Omit<PayrollRecord, 'id' | 'createdAt'>): Promise<PayrollRecord> {
    return request<PayrollRecord>('addPayrollRecord', data);
}

export async function updatePayrollRecord(id: string, updates: Partial<PayrollRecord>): Promise<PayrollRecord> {
    return request<PayrollRecord>('updatePayrollRecord', { id, updates });
}

export async function addSalarySlipsForPayroll(payrollId: string): Promise<SalarySlip[]> {
    return request<SalarySlip[]>('addSalarySlipsForPayroll', { payrollId });
}

export async function getSalarySlipsForEmployee(employeeId: string): Promise<SalarySlip[]> {
    return request<SalarySlip[]>('getSalarySlipsForEmployee', { employeeId });
}

export async function getSalarySlipsByPayroll(payrollId: string): Promise<SalarySlip[]> {
    return request<SalarySlip[]>('getSalarySlipsByPayroll', { payrollId });
}

// ============ ATTENDANCE ============

export async function getAttendanceByDate(date: string): Promise<AttendanceRecord[]> {
    return request<AttendanceRecord[]>('getAttendanceByDate', { date });
}

export async function getAttendanceRecords(): Promise<AttendanceRecord[]> {
    return request<AttendanceRecord[]>('getAttendanceRecords');
}

export async function upsertAttendanceRecord(data: {
    employeeId: string;
    date: string;
    dayType: AttendanceDayType;
    status: AttendanceStatus;
    leaveReason?: string;
    trackingHours?: number;
    workSessions?: WorkSession[];
    breakSessions?: BreakSession[];
    week1Comment?: string;
    week2Comment?: string;
    week3Comment?: string;
    week4Comment?: string;
}): Promise<AttendanceRecord> {
    return request<AttendanceRecord>('upsertAttendanceRecord', data);
}

export async function setHolidayForDate(date: string): Promise<AttendanceRecord> {
    return request<AttendanceRecord>('setHolidayForDate', { date });
}

export async function getEmployeeMonthlyAttendance(
    employeeId: string,
    month: number,
    year: number
): Promise<EmployeeMonthlyAttendanceSummary> {
    return request<EmployeeMonthlyAttendanceSummary>('getEmployeeMonthlyAttendance', { employeeId, month, year });
}

export async function upsertPerformanceRecord(data: {
    employeeId: string;
    leadId?: string;
    month: number;
    year: number;
    week1Comment?: string;
    week1Score?: number;
    week2Comment?: string;
    week2Score?: number;
    week3Comment?: string;
    week3Score?: number;
    week4Comment?: string;
    week4Score?: number;
    finalReviewerId?: string;
    finalComment?: string;
    finalScore?: number;
}): Promise<PerformanceRecord> {
    return request<PerformanceRecord>('upsertPerformanceRecord', data);
}

export async function getPerformanceRecord(employeeId: string, month: number, year: number): Promise<PerformanceRecord | null> {
    return request<PerformanceRecord | null>('getPerformanceRecord', { employeeId, month, year });
}

export async function getPerformanceRecords(): Promise<PerformanceRecord[]> {
    return request<PerformanceRecord[]>('getPerformanceRecords');
}

export async function getRolePermissions(role: UserRole): Promise<{
    fullAccess: boolean;
    canViewTeam: boolean;
    canViewOwn: boolean;
}> {
    return request('getRolePermissions', { role });
}

export function validateLeadDepartment(role: UserRole, department: Department): boolean {
    return role !== 'lead' || !!department;
}

// ============ PROJECT DOCUMENTS ============

export async function getProjects(): Promise<ProjectItem[]> {
    return request<ProjectItem[]>('getProjects');
}

export async function getProjectDocumentCounts(): Promise<Record<string, number>> {
    return request<Record<string, number>>('getProjectDocumentCounts');
}

export async function getProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
    return request<ProjectDocument[]>('getProjectDocuments', { projectId });
}

// ============ RULES ============

export async function getRules(): Promise<{ rules: RuleItem[]; latestUpdatedAt: string }> {
    return request<{ rules: RuleItem[]; latestUpdatedAt: string }>('getRules');
}

export async function getManagementDashboardData(): Promise<ManagementDashboardData> {
    return request<ManagementDashboardData>('getManagementDashboardData');
}

export async function getStaffDashboardData(employeeId: string, month: number, year: number): Promise<StaffDashboardData> {
    return request<StaffDashboardData>('getStaffDashboardData', { employeeId, month, year });
}

export async function addRule(data: Omit<RuleItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<RuleItem> {
    return request<RuleItem>('addRule', data);
}

export async function updateRule(id: string, updates: Partial<Omit<RuleItem, 'id' | 'createdAt'>>): Promise<RuleItem> {
    return request<RuleItem>('updateRule', { id, updates });
}

export async function deleteRule(id: string): Promise<void> {
    return request<void>('deleteRule', { id });
}

export async function uploadProjectDocument(data: {
    projectId: string;
    title: string;
    description: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    fileContent: string;
    uploadedBy: string;
    uploadedByName: string;
    accessList: string[];
}): Promise<ProjectDocument> {
    return request<ProjectDocument>('uploadProjectDocument', data);
}

export async function updateProjectDocumentAccess(data: {
    projectId: string;
    documentId: string;
    accessList: string[];
}): Promise<ProjectDocument> {
    return request<ProjectDocument>('updateProjectDocumentAccess', data);
}
