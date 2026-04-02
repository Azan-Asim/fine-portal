'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getRules } from '@/lib/googleSheets';
import { canBypassRulesGate } from '@/lib/roleAccess';
import { RuleItem } from '@/types';
import RulesList from '@/components/rules/RulesList';
import { Loader2, ShieldAlert, CheckCircle2, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

interface RulesGateProps {
    children: ReactNode;
}

function getAcceptanceKey(userId: string) {
    return `fine_portal_rules_accepted:${userId}`;
}

export default function RulesGate({ children }: RulesGateProps) {
    const { user, logout } = useAuth();
    const [rules, setRules] = useState<RuleItem[]>([]);
    const [latestUpdatedAt, setLatestUpdatedAt] = useState('');
    const [loading, setLoading] = useState(true);
    const [accepted, setAccepted] = useState(false);

    const relevantRules = useMemo(() => {
        if (!user) return [];
        return rules
            .filter((rule) => rule.active && (rule.targetRole === 'all' || rule.targetRole === user.role))
            .sort((a, b) => {
                const orderDiff = Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
                if (orderDiff !== 0) return orderDiff;
                return String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || ''));
            });
    }, [rules, user]);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            if (!user) {
                setLoading(false);
                setAccepted(true);
                return;
            }

            if (canBypassRulesGate(user.role)) {
                setLoading(false);
                setAccepted(true);
                return;
            }

            setLoading(true);
            try {
                const response = await getRules();
                if (cancelled) return;

                setRules(response.rules);
                setLatestUpdatedAt(response.latestUpdatedAt || '');

                const nextRelevantRules = response.rules.filter(
                    (rule) => rule.active && (rule.targetRole === 'all' || rule.targetRole === user.role)
                );

                if (nextRelevantRules.length === 0) {
                    setAccepted(true);
                    return;
                }

                const stored = localStorage.getItem(getAcceptanceKey(user.id));
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored) as { version?: string };
                        setAccepted(parsed.version === (response.latestUpdatedAt || ''));
                    } catch {
                        setAccepted(false);
                    }
                } else {
                    setAccepted(false);
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to load rules.';
                toast.error(message);
                setAccepted(false);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [user]);

    const handleAccept = () => {
        if (!user) return;
        localStorage.setItem(
            getAcceptanceKey(user.id),
            JSON.stringify({ version: latestUpdatedAt, acceptedAt: new Date().toISOString() })
        );
        setAccepted(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <div className="spinner" style={{ width: 36, height: 36 }} />
            </div>
        );
    }

    if (accepted) {
        return <>{children}</>;
    }

    return (
        <>
            {children}
            <div className="modal-overlay" style={{ zIndex: 90 }}>
                <div className="modal" style={{ maxWidth: 900 }}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(33,201,211,0.14)' }}>
                            <ShieldAlert size={22} style={{ color: 'var(--warning)' }} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Portal Rules Acceptance</h2>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                Read and accept the current rules before continuing.
                            </p>
                        </div>
                    </div>

                    <div className="mb-5 rounded-lg p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Your access is paused until you accept the active rules for your role. Higher management can enter without this step.
                        </p>
                    </div>

                    <div className="max-h-[55vh] overflow-y-auto pr-1">
                        <RulesList rules={relevantRules} canManage={false} currentRole={user?.role} />
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
                        <button className="btn-secondary" onClick={logout}>
                            <LogOut size={14} />
                            Logout
                        </button>
                        <button className="btn-primary" onClick={handleAccept} disabled={relevantRules.length === 0}>
                            <CheckCircle2 size={14} />
                            {relevantRules.length === 0 ? 'No active rules' : 'Accept Rules and Continue'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}