// TypeScript types for Fine Portal

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
