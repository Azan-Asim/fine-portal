'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import RulesList from '@/components/rules/RulesList';
import { useAuth } from '@/context/AuthContext';
import { addRule, deleteRule, getRules, updateRule } from '@/lib/googleSheets';
import { canManageRules } from '@/lib/roleAccess';
import { RuleItem, RuleTargetRole } from '@/types';
import { ArrowLeft, Loader2, Plus, Save, X } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface RulesPageViewProps {
    basePath: string;
    title: string;
    subtitle: string;
}

const ROLE_OPTIONS: Array<{ value: RuleTargetRole; label: string }> = [
    { value: 'all', label: 'All Roles' },
    { value: 'employee', label: 'Employee' },
    { value: 'lead', label: 'Lead' },
    { value: 'manager', label: 'Manager' },
    { value: 'hr', label: 'HR' },
    { value: 'admin', label: 'Admin' },
];

type RuleFormState = {
    targetRole: RuleTargetRole;
    title: string;
    content: string;
    active: boolean;
    sortOrder: number;
};

const EMPTY_FORM: RuleFormState = {
    targetRole: 'all',
    title: '',
    content: '',
    active: true,
    sortOrder: 0,
};

const ENABLE_RULES_API = false;

export default function RulesPageView({ basePath, title, subtitle }: RulesPageViewProps) {
    const { user } = useAuth();
    const canManage = canManageRules(user?.role);
    const [rules, setRules] = useState<RuleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingRule, setEditingRule] = useState<RuleItem | null>(null);
    const [filterRole, setFilterRole] = useState<RuleTargetRole | 'all'>(canManage ? 'all' : (user?.role || 'all'));
    const [form, setForm] = useState<RuleFormState>(EMPTY_FORM);

    const loadRules = useCallback(async () => {
        if (!ENABLE_RULES_API) {
            setRules([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const response = await getRules();
            setRules(response.rules);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to load rules.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRules();
    }, [loadRules]);

    useEffect(() => {
        setFilterRole(canManage ? 'all' : (user?.role || 'all'));
    }, [canManage, user?.role]);

    const visibleRules = useMemo(() => {
        const sorted = [...rules].sort((a, b) => {
            const orderDiff = Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
            if (orderDiff !== 0) return orderDiff;
            return String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || ''));
        });

        const filtered = filterRole === 'all'
            ? sorted
            : sorted.filter((rule) => rule.targetRole === 'all' || rule.targetRole === filterRole);

        if (canManage) return filtered;

        return filtered.filter((rule) => rule.active);
    }, [rules, filterRole]);

    const resetForm = () => {
        setEditingRule(null);
        setForm(canManage ? { ...EMPTY_FORM, targetRole: filterRole === 'all' ? 'all' : filterRole } : EMPTY_FORM);
    };

    const handleEdit = (rule: RuleItem) => {
        setEditingRule(rule);
        setForm({
            targetRole: rule.targetRole,
            title: rule.title,
            content: rule.content,
            active: rule.active,
            sortOrder: rule.sortOrder,
        });
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!user || !canManage) return;
        if (!form.title.trim() || !form.content.trim()) {
            toast.error('Title and content are required.');
            return;
        }

        setSaving(true);
        try {
            if (editingRule) {
                await updateRule(editingRule.id, {
                    targetRole: form.targetRole,
                    title: form.title.trim(),
                    content: form.content.trim(),
                    active: form.active,
                    sortOrder: form.sortOrder,
                    updatedBy: user.id,
                    updatedByName: user.name,
                });
                toast.success('Rule updated.');
            } else {
                await addRule({
                    targetRole: form.targetRole,
                    title: form.title.trim(),
                    content: form.content.trim(),
                    active: form.active,
                    sortOrder: form.sortOrder,
                    createdBy: user.id,
                    createdByName: user.name,
                    updatedBy: user.id,
                    updatedByName: user.name,
                });
                toast.success('Rule added.');
            }

            resetForm();
            await loadRules();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to save rule.';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (rule: RuleItem) => {
        if (!canManage) return;
        const confirmed = window.confirm(`Delete rule "${rule.title}"?`);
        if (!confirmed) return;

        try {
            await deleteRule(rule.id);
            toast.success('Rule deleted.');
            if (editingRule?.id === rule.id) {
                resetForm();
            }
            await loadRules();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete rule.';
            toast.error(message);
        }
    };

    return (
        <div className="page-enter flex flex-col h-full">
            <Header title={title} subtitle={subtitle} />

            <div className="p-8 space-y-6 flex-1 overflow-y-auto">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <Link href={basePath} className="btn-secondary w-fit">
                        <ArrowLeft size={14} />
                        Back to Dashboard
                    </Link>

                    <div className="flex flex-wrap gap-2">
                        {canManage ? (
                            ROLE_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    className={filterRole === option.value ? 'btn-primary' : 'btn-secondary'}
                                    onClick={() => setFilterRole(option.value)}
                                >
                                    {option.label}
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                                Showing rules for your role
                            </div>
                        )}
                    </div>
                </div>

                {canManage ? (
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-lg">{editingRule ? 'Edit Rule' : 'Add Rule'}</h2>
                            {editingRule ? (
                                <button className="btn-secondary" onClick={resetForm}>
                                    <X size={14} />
                                    Cancel Edit
                                </button>
                            ) : null}
                        </div>

                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Target Role *</label>
                                    <select
                                        className="select"
                                        value={form.targetRole}
                                        onChange={(event) => setForm((previous) => ({ ...previous, targetRole: event.target.value as RuleTargetRole }))}
                                    >
                                        {ROLE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Sort Order</label>
                                    <input
                                        className="input"
                                        type="number"
                                        value={form.sortOrder}
                                        onChange={(event) => setForm((previous) => ({ ...previous, sortOrder: Number(event.target.value || 0) }))}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="label">Rule Title *</label>
                                <input
                                    className="input"
                                    value={form.title}
                                    onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))}
                                    placeholder="Example: Attendance policy"
                                />
                            </div>

                            <div>
                                <label className="label">Rule Content *</label>
                                <textarea
                                    className="input min-h-32"
                                    value={form.content}
                                    onChange={(event) => setForm((previous) => ({ ...previous, content: event.target.value }))}
                                    placeholder="Write the rule details one by one..."
                                />
                            </div>

                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={form.active}
                                    onChange={(event) => setForm((previous) => ({ ...previous, active: event.target.checked }))}
                                />
                                Active rule
                            </label>

                            <button className="btn-primary" type="submit" disabled={saving}>
                                {saving ? <Loader2 size={16} className="animate-spin" /> : editingRule ? <Save size={16} /> : <Plus size={16} />}
                                {saving ? 'Saving...' : editingRule ? 'Update Rule' : 'Add Rule'}
                            </button>
                        </form>
                    </div>
                ) : null}

                <div className="card" style={{ padding: 0 }}>
                    <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                        <h2 className="font-semibold">Rules ({visibleRules.length})</h2>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {canManage ? 'Manage rules for each role one by one.' : 'Read the rules that apply to your role.'}
                        </p>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <div className="spinner" />
                            </div>
                        ) : (
                            <RulesList
                                rules={visibleRules}
                                canManage={canManage}
                                currentRole={user?.role}
                                onEdit={canManage ? handleEdit : undefined}
                                onDelete={canManage ? handleDelete : undefined}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}