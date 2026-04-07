import { PermissionKey, UserRole } from '@/types';

type RoleLike = UserRole | 'higher-management' | string | undefined | null;

export function normalizeRole(role?: RoleLike): UserRole {
    const value = String(role || '').trim().toLowerCase();
    if (value === 'higher-management') return 'admin';
    if (value === 'admin' || value === 'hr' || value === 'manager' || value === 'lead' || value === 'employee') {
        return value;
    }
    return 'employee';
}

export function parseRoleList(role: RoleLike | RoleLike[]): UserRole[] {
    const source = Array.isArray(role) ? role : [role];
    const normalized = source
        .flatMap((entry) => String(entry || '').split(','))
        .map((entry) => normalizeRole(entry))
        .filter(Boolean);

    return Array.from(new Set(normalized));
}

export function isFullAccessRole(role?: RoleLike): boolean {
    const normalized = normalizeRole(role);
    return normalized === 'hr' || normalized === 'admin' || normalized === 'manager';
}

export function hasAnyRole(roles: RoleLike | RoleLike[], expected: UserRole[]): boolean {
    const assigned = parseRoleList(roles);
    return expected.some((role) => assigned.includes(role));
}

export function canViewTeam(role?: RoleLike | RoleLike[]): boolean {
    return hasAnyRole(role, ['lead', 'manager', 'hr', 'admin']);
}

export function canManageEmployees(role?: RoleLike | RoleLike[]): boolean {
    return hasAnyRole(role, ['manager', 'hr', 'admin']);
}

export function canEditWeeklyPerformance(role?: RoleLike | RoleLike[]): boolean {
    return hasAnyRole(role, ['lead', 'manager']);
}

export function canEditFinalPerformanceReview(role?: RoleLike | RoleLike[]): boolean {
    return hasAnyRole(role, ['hr', 'admin']);
}

export function canManageRules(role?: RoleLike | RoleLike[]): boolean {
    return hasAnyRole(role, ['hr', 'admin']);
}

export function canBypassRulesGate(role?: RoleLike | RoleLike[]): boolean {
    return hasAnyRole(role, ['admin']);
}

export function getHomePathByRole(role?: RoleLike): string {
    if (!role) return '/login';
    return isFullAccessRole(role) ? '/admin/dashboard' : '/employee/dashboard';
}

export function getHomePathByRoles(roles?: RoleLike | RoleLike[]): string {
    const assigned = parseRoleList(roles);
    if (assigned.length === 0) return '/login';
    return assigned.some((role) => isFullAccessRole(role)) ? '/admin/dashboard' : '/employee/dashboard';
}

export function hasPermission(userPermissions: string[] | undefined, permission: PermissionKey): boolean {
    const permissions = (userPermissions || []).map((item) => String(item || '').trim());
    return permissions.includes(permission);
}
