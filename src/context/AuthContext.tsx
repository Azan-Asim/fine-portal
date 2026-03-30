'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, UserRole } from '@/types';

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    login: (email: string) => Promise<{ success: boolean; error?: string }>;
    loginWithGoogleToken: (credential: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('fine_portal_user');
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch {
                localStorage.removeItem('fine_portal_user');
            }
        }
        setIsLoading(false);
    }, []);

    const findRegisteredUser = async (email: string): Promise<AuthUser | null> => {
        const normalizedEmail = email.trim().toLowerCase();
        const { getEmployees } = await import('@/lib/googleSheets');
        const employees = await getEmployees();
        const emp = employees.find((e) => e.email.toLowerCase() === normalizedEmail);
        if (!emp) return null;
        const role = (emp.role || 'employee') as UserRole;
        return {
            id: emp.id,
            name: emp.name,
            email: emp.email,
            role,
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

    return (
        <AuthContext.Provider value={{ user, isLoading, login, loginWithGoogleToken, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
