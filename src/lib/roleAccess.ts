import { UserRole } from '@/types';

export function isFullAccessRole(role?: UserRole): boolean {
    return role === 'hr' || role === 'higher-management' || role === 'manager';
}

export function canViewTeam(role?: UserRole): boolean {
    return role === 'lead' || isFullAccessRole(role);
}

export function canManageEmployees(role?: UserRole): boolean {
    return isFullAccessRole(role);
}

export function canEditWeeklyPerformance(role?: UserRole): boolean {
    return role === 'lead' || role === 'manager';
}

export function canEditFinalPerformanceReview(role?: UserRole): boolean {
    return role === 'hr' || role === 'higher-management';
}

export function getHomePathByRole(role?: UserRole): string {
    if (!role) return '/login';
    return isFullAccessRole(role) ? '/admin/dashboard' : '/employee/dashboard';
}
