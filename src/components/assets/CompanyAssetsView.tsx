'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { addCompanyAsset, deleteCompanyAsset, getCompanyAssets, getEmployees, updateCompanyAsset } from '@/lib/googleSheets';
import { CompanyAsset, Employee, UserRole } from '@/types';
import { formatDate } from '@/lib/utils';
import { Package2, Plus, Search, Pencil, Trash2, X, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface CompanyAssetsViewProps {
    basePath: string;
    userId: string;
    userRole: UserRole;
    canManage: boolean;
}

type AssetFormState = {
    assetName: string;
    allocatedResourceId: string;
    issuanceDate: string;
    returnDate: string;
    conditionAtIssuance: string;
    notes: string;
};

const EMPTY_FORM: AssetFormState = {
    assetName: '',
    allocatedResourceId: '',
    issuanceDate: new Date().toISOString().split('T')[0],
    returnDate: '',
    conditionAtIssuance: '',
    notes: '',
};

function allocationLabel(asset: CompanyAsset) {
    if (!asset.allocatedResourceId) return 'None';
    return asset.allocatedResourceRole ? `${asset.allocatedResourceName} (${asset.allocatedResourceRole})` : asset.allocatedResourceName;
}

export default function CompanyAssetsView({ basePath, userId, userRole, canManage }: CompanyAssetsViewProps) {
    const [assets, setAssets] = useState<CompanyAsset[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingAsset, setEditingAsset] = useState<CompanyAsset | null>(null);
    const [form, setForm] = useState<AssetFormState>(EMPTY_FORM);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [assetItems, employeeItems] = await Promise.all([getCompanyAssets(), getEmployees()]);
                setAssets(assetItems);
                setEmployees(employeeItems);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to load company assets.';
                toast.error(message);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const visibleAssets = useMemo(() => {
        const scoped = canManage ? assets : assets.filter((asset) => asset.allocatedResourceId === userId);
        const term = search.trim().toLowerCase();
        if (!term) return scoped;

        return scoped.filter((asset) => {
            const haystack = [
                asset.id,
                asset.assetName,
                asset.allocatedResourceName,
                asset.allocatedResourceRole,
                asset.issuanceDate,
                asset.returnDate,
                asset.conditionAtIssuance,
                asset.notes,
            ].join(' ').toLowerCase();
            return haystack.includes(term);
        });
    }, [assets, canManage, search, userId]);

    const sortedEmployees = useMemo(() => {
        return [...employees].sort((a, b) => a.name.localeCompare(b.name));
    }, [employees]);

    const assetStats = useMemo(() => {
        const assigned = assets.filter((asset) => asset.allocatedResourceId).length;
        const unassigned = assets.length - assigned;
        return { total: assets.length, assigned, unassigned };
    }, [assets]);

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditingAsset(null);
        setShowForm(false);
    };

    const openAddForm = () => {
        setEditingAsset(null);
        setForm(EMPTY_FORM);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const openEditForm = (asset: CompanyAsset) => {
        setEditingAsset(asset);
        setForm({
            assetName: asset.assetName,
            allocatedResourceId: asset.allocatedResourceId || '',
            issuanceDate: asset.issuanceDate || new Date().toISOString().split('T')[0],
            returnDate: asset.returnDate || '',
            conditionAtIssuance: asset.conditionAtIssuance || '',
            notes: asset.notes || '',
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = event.target;
        setForm((previous) => ({ ...previous, [name]: value }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!canManage) return;
        if (!form.assetName.trim() || !form.issuanceDate || !form.conditionAtIssuance.trim()) {
            toast.error('Asset name, issuance date, and condition are required.');
            return;
        }

        setSaving(true);
        try {
            const selectedEmployee = employees.find((employee) => employee.id === form.allocatedResourceId);
            const payload = {
                assetName: form.assetName.trim(),
                allocatedResourceId: form.allocatedResourceId,
                allocatedResourceName: selectedEmployee?.name || 'None',
                allocatedResourceRole: (selectedEmployee?.role as UserRole) || '',
                issuanceDate: form.issuanceDate,
                returnDate: form.returnDate,
                conditionAtIssuance: form.conditionAtIssuance.trim(),
                notes: form.notes.trim(),
            };

            if (editingAsset) {
                const updated = await updateCompanyAsset(editingAsset.id, payload);
                setAssets((previous) => previous.map((asset) => (asset.id === updated.id ? updated : asset)));
                toast.success('Asset updated successfully.');
            } else {
                const created = await addCompanyAsset(payload);
                setAssets((previous) => [created, ...previous]);
                toast.success('Asset added successfully.');
            }

            resetForm();
        } catch (error) {
            const message = error instanceof Error ? error.message : editingAsset ? 'Failed to update asset.' : 'Failed to add asset.';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (asset: CompanyAsset) => {
        if (!canManage) return;
        const confirmed = window.confirm(`Delete asset "${asset.assetName}"?`);
        if (!confirmed) return;

        try {
            await deleteCompanyAsset(asset.id);
            setAssets((previous) => previous.filter((item) => item.id !== asset.id));
            toast.success('Asset deleted successfully.');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete asset.';
            toast.error(message);
        }
    };

        const handleDownloadIds = () => {
                const sourceAssets = canManage ? assets : visibleAssets;
                const ids = sourceAssets.map((asset) => String(asset.id || '').trim()).filter(Boolean);

                if (ids.length === 0) {
                        toast.error('No asset IDs available to print.');
                        return;
                }

                const popup = window.open('', '_blank');
                if (!popup) {
                        toast.error('Unable to open print window. Please allow popups for this site.');
                        return;
                }

                const columns = 4;
                const rows = Math.max(1, Math.ceil(ids.length / columns));
                const fontSizePx = rows <= 8 ? 14 : rows <= 12 ? 12 : rows <= 16 ? 10 : 9;
                const compactClass = rows > 16 ? 'compact' : '';
                const idsHtml = ids.map((id) => `<div class="id-item">${id}</div>`).join('');

                popup.document.open();
                popup.document.write(`
<!doctype html>
<html>
<head>
    <meta charset="utf-8" />
    <title>Asset IDs Print</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 10mm;
        }
        * { box-sizing: border-box; }
        html, body {
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background: #fff;
            color: #111;
        }
        .sheet {
            width: 190mm;
            height: 277mm;
            margin: 10mm;
            display: grid;
            grid-template-rows: auto 1fr;
            gap: 4mm;
        }
        .title {
            font-size: 14px;
            font-weight: 700;
            text-align: center;
        }
        .ids-grid {
            display: grid;
            grid-template-columns: repeat(${columns}, 1fr);
            grid-template-rows: repeat(${rows}, 1fr);
            gap: 2mm;
            overflow: hidden;
        }
        .ids-grid.compact {
            gap: 1mm;
        }
        .id-item {
            border: 1px solid #222;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1mm;
            font-size: ${fontSizePx}px;
            font-weight: 700;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="sheet">
        <div class="title">ASSET IDS</div>
        <div class="ids-grid ${compactClass}">${idsHtml}</div>
    </div>
</body>
</html>
                `);
                popup.document.close();
                popup.focus();
                popup.print();
        };

    return (
        <div className="page-enter flex flex-col h-full">
            <Header title="Company Assets" subtitle="Track company-issued assets and who is currently holding them." />

            <div className="p-8 space-y-6 flex-1 overflow-y-auto">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <Link href={basePath} className="btn-secondary w-fit">
                        Back to Dashboard
                    </Link>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                            Total: {assetStats.total} | Assigned: {assetStats.assigned} | Unassigned: {assetStats.unassigned}
                        </div>
                        <div className="relative w-full lg:w-80">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
                            <input
                                className="input pl-9"
                                placeholder="Search assets"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                            />
                        </div>
                        <button onClick={handleDownloadIds} className="btn-secondary">
                            <Download size={16} /> Download IDs
                        </button>
                        {canManage ? (
                            <button onClick={openAddForm} className="btn-primary">
                                <Plus size={16} /> Add Asset
                            </button>
                        ) : null}
                    </div>
                </div>

                {!canManage ? (
                    <div className="rounded-lg p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Showing assets assigned to your {userRole} account only.
                        </p>
                    </div>
                ) : null}

                {showForm && canManage ? (
                    <div className="card">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold">{editingAsset ? 'Edit Asset' : 'Add New Asset'}</h3>
                            <button onClick={resetForm} className="p-2 hover:bg-white/5 rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Asset Name *</label>
                                    <input
                                        className="input"
                                        name="assetName"
                                        value={form.assetName}
                                        onChange={handleChange}
                                        placeholder="Laptop, Mobile, Monitor"
                                    />
                                </div>
                                <div>
                                    <label className="label">Allocated Resource</label>
                                    <select
                                        className="input"
                                        name="allocatedResourceId"
                                        value={form.allocatedResourceId}
                                        onChange={handleChange}
                                    >
                                        <option value="">None</option>
                                        {sortedEmployees.map((employee) => (
                                            <option key={employee.id} value={employee.id}>
                                                {employee.name} ({employee.role || 'employee'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Issuance Date *</label>
                                    <input
                                        type="date"
                                        className="input"
                                        name="issuanceDate"
                                        value={form.issuanceDate}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="label">Return Date</label>
                                    <input
                                        type="date"
                                        className="input"
                                        name="returnDate"
                                        value={form.returnDate}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="label">Condition at Issuance *</label>
                                    <input
                                        className="input"
                                        name="conditionAtIssuance"
                                        value={form.conditionAtIssuance}
                                        onChange={handleChange}
                                        placeholder="Good, New, Used, Damaged"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="label">Notes</label>
                                    <textarea
                                        className="input"
                                        name="notes"
                                        value={form.notes}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Optional notes"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                                <button type="button" className="btn-secondary flex-1" onClick={resetForm}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
                                    {saving ? 'Saving...' : editingAsset ? 'Save Changes' : 'Add Asset'}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : null}

                <div className="card" style={{ padding: 0 }}>
                    <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
                        <Package2 size={18} style={{ color: 'var(--accent)' }} />
                        <h2 className="font-semibold">All Assets ({visibleAssets.length})</h2>
                    </div>

                    {loading ? (
                        <div className="p-8 flex justify-center"><div className="spinner" /></div>
                    ) : visibleAssets.length === 0 ? (
                        <div className="p-8 text-center">
                            <Package2 size={40} className="mx-auto mb-3" style={{ color: 'var(--border)' }} />
                            <p style={{ color: 'var(--text-secondary)' }}>
                                {search ? 'No matching assets found.' : canManage ? 'No assets yet.' : 'You do not have any assigned assets.'}
                            </p>
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Asset ID</th>
                                        <th>Asset Name</th>
                                        <th>Allocated Resource</th>
                                        <th>Issuance Date</th>
                                        <th>Return Date</th>
                                        <th>Condition at Issuance</th>
                                        <th>Notes</th>
                                        {canManage ? <th>Actions</th> : null}
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleAssets.map((asset) => (
                                        <tr key={asset.id}>
                                            <td style={{ color: 'var(--text-secondary)' }}>{asset.id}</td>
                                            <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{asset.assetName}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>
                                                <div>
                                                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{allocationLabel(asset)}</p>
                                                    {asset.allocatedResourceRole ? (
                                                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                            {asset.allocatedResourceRole}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{formatDate(asset.issuanceDate)}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{asset.returnDate ? formatDate(asset.returnDate) : '—'}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{asset.conditionAtIssuance}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>
                                                <p className="max-w-xs truncate">{asset.notes || '—'}</p>
                                            </td>
                                            {canManage ? (
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => openEditForm(asset)} className="btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>
                                                            <Pencil size={14} /> Edit
                                                        </button>
                                                        <button onClick={() => handleDelete(asset)} className="btn-danger" style={{ padding: '0.4rem 0.8rem' }}>
                                                            <Trash2 size={14} /> Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            ) : null}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
