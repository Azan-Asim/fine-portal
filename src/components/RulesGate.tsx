'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getRules } from '@/lib/googleSheets';
import { canBypassRulesGate, parseRoleList } from '@/lib/roleAccess';
import { RuleItem } from '@/types';
import RulesList from '@/components/rules/RulesList';
import { Loader2, ShieldAlert, CheckCircle2, LogOut } from 'lucide-react';

interface RulesGateProps {
    children: ReactNode;
}

interface CachedRulesState {
    rules: RuleItem[];
    latestUpdatedAt: string;
}

const RULES_CACHE_KEY = 'fine_portal_rules_cache';
const ENABLE_RULES_API = false;

function getAcceptanceKey(userId: string) {
    return `fine_portal_rules_accepted:${userId}`;
}

function readCachedRules(): CachedRulesState | null {
    if (typeof window === 'undefined') {
        return null;
    }

    const stored = localStorage.getItem(RULES_CACHE_KEY);
    if (!stored) {
        return null;
    }

    try {
        const parsed = JSON.parse(stored) as CachedRulesState;
        return {
            rules: Array.isArray(parsed.rules) ? parsed.rules : [],
            latestUpdatedAt: typeof parsed.latestUpdatedAt === 'string' ? parsed.latestUpdatedAt : '',
        };
    } catch {
        localStorage.removeItem(RULES_CACHE_KEY);
        return null;
    }
}

function saveCachedRules(state: CachedRulesState) {
    if (typeof window === 'undefined') {
        return;
    }

    localStorage.setItem(RULES_CACHE_KEY, JSON.stringify(state));
}

function readAcceptanceVersion(userId: string) {
    if (typeof window === 'undefined') {
        return '';
    }

    const stored = localStorage.getItem(getAcceptanceKey(userId));
    if (!stored) {
        return '';
    }

    try {
        const parsed = JSON.parse(stored) as { version?: string };
        return parsed.version || '';
    } catch {
        return '';
    }
}

function getRelevantRules(rules: RuleItem[], roles?: string | string[]) {
    const assignedRoles = parseRoleList(roles);
    if (assignedRoles.length === 0) {
        return [];
    }

    return rules
        .filter((rule) => rule.active && (rule.targetRole === 'all' || assignedRoles.includes(rule.targetRole)))
        .sort((a, b) => {
            const orderDiff = Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
            if (orderDiff !== 0) return orderDiff;
            return String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || ''));
        });
}

export default function RulesGate({ children }: RulesGateProps) {
    const { user, logout } = useAuth();
    const cachedRules = useMemo(() => readCachedRules(), []);
    const assignedRoles = parseRoleList(user?.roles && user.roles.length > 0 ? user.roles : user?.role);
    const [rules, setRules] = useState<RuleItem[]>(cachedRules?.rules || []);
    const [latestUpdatedAt, setLatestUpdatedAt] = useState(cachedRules?.latestUpdatedAt || '');
    const [loading, setLoading] = useState(() => Boolean(user && !canBypassRulesGate(assignedRoles) && !cachedRules));
    const [accepted, setAccepted] = useState(() => {
        if (!user) return true;
        if (canBypassRulesGate(assignedRoles)) return true;

        const relevant = getRelevantRules(cachedRules?.rules || [], assignedRoles);
        if (relevant.length === 0) return true;

        return readAcceptanceVersion(user.id) === (cachedRules?.latestUpdatedAt || '');
    });

    const relevantRules = useMemo(() => {
        if (!user) return [];
        return getRelevantRules(rules, assignedRoles);
    }, [rules, user, assignedRoles]);

    useEffect(() => {
        let cancelled = false;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        const load = async () => {
            if (!user) {
                setLoading(false);
                setAccepted(true);
                return;
            }

            if (!ENABLE_RULES_API) {
                setLoading(false);
                setAccepted(true);
                return;
            }

            if (canBypassRulesGate(assignedRoles)) {
                setLoading(false);
                setAccepted(true);
                return;
            }

            setLoading(true);
            timeoutId = setTimeout(() => {
                if (!cancelled) {
                    // Fail-safe: do not block portal forever if rules API is slow/unavailable.
                    setLoading(false);
                    setAccepted(true);
                    console.warn('Rules service timeout. Continuing without blocking access.');
                }
            }, 8000);

            try {
                const response = await getRules();
                if (cancelled) return;

                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }

                setRules(response.rules);
                setLatestUpdatedAt(response.latestUpdatedAt || '');
                saveCachedRules({ rules: response.rules, latestUpdatedAt: response.latestUpdatedAt || '' });

                const nextRelevantRules = getRelevantRules(response.rules, assignedRoles);

                if (nextRelevantRules.length === 0) {
                    setAccepted(true);
                    return;
                }

                setAccepted(readAcceptanceVersion(user.id) === (response.latestUpdatedAt || ''));
            } catch (error) {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                const message = error instanceof Error ? error.message : 'Failed to load rules.';
                console.warn(message);
                // Fail-open to avoid locking users on a loading screen when rules endpoint fails.
                setAccepted(true);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            cancelled = true;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [user, assignedRoles]);

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
                            Your access is paused until you accept the active rules for your role. Admin can enter without this step.
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