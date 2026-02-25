import { Employee, Penalty, PenaltyStatus, PaymentType } from '@/types';

const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL as string;

async function request<T>(action: string, data?: object): Promise<T> {
    // Use GET with query params — avoids CORS preflight & Apps Script redirect issues
    const url = new URL(APPS_SCRIPT_URL);
    url.searchParams.set('action', action);
    if (data) {
        url.searchParams.set('payload', JSON.stringify(data));
    }
    const res = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'follow',
    });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data as T;
}

// ============ EMPLOYEES ============

export async function getEmployees(): Promise<Employee[]> {
    return request<Employee[]>('getEmployees');
}

export async function addEmployee(name: string, email: string): Promise<Employee> {
    return request<Employee>('addEmployee', { name, email });
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
