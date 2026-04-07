'use client';

import { RuleItem, UserRole } from '@/types';
import { CalendarDays, FileText, PencilLine, Trash2 } from 'lucide-react';

interface RulesListProps {
    rules: RuleItem[];
    canManage: boolean;
    currentRole?: UserRole;
    onEdit?: (rule: RuleItem) => void;
    onDelete?: (rule: RuleItem) => void;
}

function getRoleLabel(role: RuleItem['targetRole']) {
    if (role === 'all') return 'All Roles';
    if (role === 'admin') return 'Admin';
    if (role === 'hr') return 'HR';
    if (role === 'manager') return 'Manager';
    if (role === 'lead') return 'Lead';
    return 'Employee';
}

export default function RulesList({ rules, canManage, currentRole, onEdit, onDelete }: RulesListProps) {
    return (
        <div className="space-y-4">
            {rules.length === 0 ? (
                <div className="card text-center py-10">
                    <FileText size={42} className="mx-auto mb-3" style={{ color: 'var(--text-secondary)' }} />
                    <p className="font-medium">No rules available yet.</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        HR or admin can add the first rule from the rules page.
                    </p>
                </div>
            ) : (
                rules.map((rule) => (
                    <div key={rule.id} className="card">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="badge-pending">{getRoleLabel(rule.targetRole)}</span>
                                    {rule.active ? <span className="badge-paid">Active</span> : <span className="badge-unpaid">Inactive</span>}
                                    {currentRole && (rule.targetRole === 'all' || rule.targetRole === currentRole) ? (
                                        <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>Visible to you</span>
                                    ) : null}
                                </div>
                                <h3 className="text-lg font-semibold">{rule.title}</h3>
                                <p className="whitespace-pre-wrap text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
                                    {rule.content}
                                </p>
                                <div className="flex flex-wrap gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                    <span className="inline-flex items-center gap-1">
                                        <CalendarDays size={14} />
                                        Updated {new Date(rule.updatedAt || rule.createdAt).toLocaleString()}
                                    </span>
                                    <span>Sort order: {rule.sortOrder}</span>
                                    <span>By {rule.updatedByName || rule.createdByName || 'System'}</span>
                                </div>
                            </div>

                            {canManage && (onEdit || onDelete) ? (
                                <div className="flex gap-2 shrink-0">
                                    {onEdit ? (
                                        <button className="btn-secondary" onClick={() => onEdit(rule)}>
                                            <PencilLine size={14} />
                                            Edit
                                        </button>
                                    ) : null}
                                    {onDelete ? (
                                        <button className="btn-secondary" style={{ color: 'var(--danger)' }} onClick={() => onDelete(rule)}>
                                            <Trash2 size={14} />
                                            Delete
                                        </button>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}