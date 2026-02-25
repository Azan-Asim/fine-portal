'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, UserRole } from '@/types';

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
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

    const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
        const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

        // Admin login
        if (email === adminEmail && password === adminPassword) {
            const adminUser: AuthUser = {
                id: 'admin-001',
                name: 'Admin',
                email: adminEmail!,
                role: 'admin',
            };
            setUser(adminUser);
            localStorage.setItem('fine_portal_user', JSON.stringify(adminUser));
            return { success: true };
        }

        // Employee login (email only)
        if (!password) {
            try {
                const { getEmployees } = await import('@/lib/googleSheets');
                const employees = await getEmployees();
                const emp = employees.find((e) => e.email.toLowerCase() === email.toLowerCase());
                if (emp) {
                    const empUser: AuthUser = {
                        id: emp.id,
                        name: emp.name,
                        email: emp.email,
                        role: 'employee',
                    };
                    setUser(empUser);
                    localStorage.setItem('fine_portal_user', JSON.stringify(empUser));
                    return { success: true };
                }
                return { success: false, error: 'No employee found with that email.' };
            } catch {
                return { success: false, error: 'Failed to verify employee. Please try again.' };
            }
        }

        return { success: false, error: 'Invalid credentials.' };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('fine_portal_user');
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
