'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, PermissionKey, UserRole } from '@/types';
import { normalizeRole, parseRoleList } from '@/lib/roleAccess';

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    login: (email: string) => Promise<{ success: boolean; error?: string }>;
    loginWithGoogleToken: (credential: string) => Promise<{ success: boolean; error?: string }>;
    switchActiveRole: (role: UserRole) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parsePermissions(rawPermissions: unknown): PermissionKey[] {
    if (!rawPermissions) return [];
    const values = Array.isArray(rawPermissions)
        ? rawPermissions.map((item) => String(item || '').trim())
        : String(rawPermissions)
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean);

    const allowed: PermissionKey[] = [
        'module.company-expenses.view',
        'module.company-expenses.edit',
        'module.expenses.manage-approvers',
        'module.employees.manage-permissions',
    ];

    return Array.from(new Set(values.filter((item): item is PermissionKey => allowed.includes(item as PermissionKey))));
}

function normalizeAuthUser(user: Partial<AuthUser> & { role?: string; roles?: unknown; permissions?: unknown }): AuthUser | null {
    if (!user.id || !user.email || !user.name) {
        return null;
    }

    const roles = parseRoleList(Array.isArray(user.roles) && user.roles.length > 0 ? (user.roles as string[]) : user.role || 'employee');
    const activeRole = roles.includes(normalizeRole(user.activeRole || user.role))
        ? normalizeRole(user.activeRole || user.role)
        : roles[0] || 'employee';

    return {
        id: String(user.id),
        name: String(user.name),
        email: String(user.email),
        role: activeRole,
        roles,
        activeRole,
        permissions: parsePermissions(user.permissions),
        department: user.department,
        leadId: user.leadId,
    };
}

function readStoredUser(): AuthUser | null {
    if (typeof window === 'undefined') {
        return null;
    }

    const stored = localStorage.getItem('fine_portal_user');
    if (!stored) {
        return null;
    }

    try {
        const parsed = JSON.parse(stored) as Partial<AuthUser> & { role?: string; roles?: unknown; permissions?: unknown };
        const normalized = normalizeAuthUser(parsed);
        if (!normalized) {
            localStorage.removeItem('fine_portal_user');
            return null;
        }
        return normalized;
    } catch {
        localStorage.removeItem('fine_portal_user');
        return null;
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedUser = readStoredUser();
        setUser(storedUser);
        setIsLoading(false);
    }, []);

    const findRegisteredUser = async (email: string): Promise<AuthUser | null> => {
        const normalizedEmail = email.trim().toLowerCase();
        const { getEmployees } = await import('@/lib/googleSheets');
        const employees = await getEmployees();
        const emp = employees.find((e) => e.email.toLowerCase() === normalizedEmail);
        if (!emp) return null;

        const roles = parseRoleList(emp.role || 'employee');
        const activeRole = roles[0] || 'employee';
        return {
            id: emp.id,
            name: emp.name,
            email: emp.email,
            role: activeRole,
            roles,
            activeRole,
            permissions: parsePermissions(emp.permissions),
            department: emp.department,
            leadId: emp.leadId,
        };
    };

    const completeLogin = (nextUser: AuthUser) => {
        setUser(nextUser);
        localStorage.setItem('fine_portal_user', JSON.stringify(nextUser));
    };

    const login = async (email: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const registered = await findRegisteredUser(email);
            if (!registered) {
                return { success: false, error: 'This email is not registered by admin.' };
            }
            completeLogin(registered);
            return { success: true };
        } catch {
            return { success: false, error: 'Failed to verify registered user.' };
        }
    };

    const loginWithGoogleToken = async (credential: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const parts = String(credential || '').split('.');
            if (parts.length < 2) return { success: false, error: 'Invalid Google token.' };
            const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(atob(base64));
            const email = String(payload?.email || '').trim().toLowerCase();
            const verified = Boolean(payload?.email_verified);

            if (!email || !verified) {
                return { success: false, error: 'Unable to verify Google account email.' };
            }

            const registered = await findRegisteredUser(email);
            if (!registered) {
                return { success: false, error: 'Your email is not registered by admin.' };
            }

            completeLogin(registered);
            return { success: true };
        } catch {
            return { success: false, error: 'Google login failed.' };
        }

        return { success: false, error: 'Invalid credentials.' };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('fine_portal_user');
    };

    const switchActiveRole = (nextRole: UserRole) => {
        setUser((previous) => {
            if (!previous) return previous;
            if (!previous.roles.includes(nextRole)) return previous;

            const nextUser: AuthUser = {
                ...previous,
                role: nextRole,
                activeRole: nextRole,
            };
            localStorage.setItem('fine_portal_user', JSON.stringify(nextUser));
            return nextUser;
        });
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, loginWithGoogleToken, switchActiveRole, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
