'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';
import { getEmployees, addEmployee, deleteEmployee } from '@/lib/googleSheets';
import { Employee } from '@/types';
import { UserPlus, Trash2, Search, Loader2, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [adding, setAdding] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Employee | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getEmployees();
            setEmployees(data);
        } catch {
            toast.error('Failed to load employees.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = employees.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.email.toLowerCase().includes(search.toLowerCase())
    );

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim()) { toast.error('Name and email required.'); return; }
        setAdding(true);
        try {
            const emp = await addEmployee(name.trim(), email.trim().toLowerCase());
            setEmployees(prev => [...prev, emp]);
            setName(''); setEmail(''); setShowForm(false);
            toast.success('Employee added successfully!');
        } catch {
            toast.error('Failed to add employee.');
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (emp: Employee) => {
        setDeleting(emp.id);
        try {
            await deleteEmployee(emp.id);
            setEmployees(prev => prev.filter(e => e.id !== emp.id));
            setConfirmDelete(null);
            toast.success('Employee deleted.');
        } catch {
            toast.error('Failed to delete employee.');
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className="page-enter flex flex-col h-full">
            <Header title="Employees" subtitle="Manage your team members" />

            <div className="p-8 space-y-6 flex-1">
                {/* Actions bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
                        <input className="input pl-9" placeholder="Search employees..." value={search}
                            onChange={e => setSearch(e.target.value)} />
                    </div>
                    <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                        <UserPlus size={16} /> Add Employee
                    </button>
                </div>

                {/* Add Form */}
                {showForm && (
                    <div className="card">
                        <h3 className="font-semibold mb-4">Add New Employee</h3>
                        <form onSubmit={handleAdd} className="grid sm:grid-cols-3 gap-4">
                            <div>
                                <label className="label">Full Name</label>
                                <input className="input" placeholder="John Doe" value={name}
                                    onChange={e => setName(e.target.value)} />
                            </div>
                            <div>
                                <label className="label">Email Address</label>
                                <input type="email" className="input" placeholder="john@company.com" value={email}
                                    onChange={e => setEmail(e.target.value)} />
                            </div>
                            <div className="flex items-end gap-2">
                                <button type="submit" className="btn-primary" disabled={adding}>
                                    {adding ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                                    {adding ? 'Adding...' : 'Add'}
                                </button>
                                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Table */}
                <div className="card" style={{ padding: 0 }}>
                    <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
                        <Users size={18} style={{ color: 'var(--accent)' }} />
                        <h2 className="font-semibold">All Employees ({filtered.length})</h2>
                    </div>

                    {loading ? (
                        <div className="p-8 flex justify-center"><div className="spinner" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="p-8 text-center">
                            <Users size={40} className="mx-auto mb-3" style={{ color: 'var(--border)' }} />
                            <p style={{ color: 'var(--text-secondary)' }}>{search ? 'No results found.' : 'No employees yet. Add one above.'}</p>
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table>
                                <thead><tr>
                                    <th>Name</th><th>Email</th><th>Registered</th><th>Actions</th>
                                </tr></thead>
                                <tbody>
                                    {filtered.map(emp => (
                                        <tr key={emp.id}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm"
                                                        style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                                                        {emp.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium">{emp.name}</span>
                                                </div>
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{emp.email}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>
                                                {new Date(emp.createdAt).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <button onClick={() => setConfirmDelete(emp)} className="btn-danger" style={{ padding: '0.4rem 0.8rem' }}>
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {confirmDelete && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                            style={{ background: 'rgba(248,81,73,0.15)' }}>
                            <Trash2 size={24} style={{ color: 'var(--danger)' }} />
                        </div>
                        <h3 className="text-lg font-bold text-center mb-2">Delete Employee?</h3>
                        <p className="text-center text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                            This will permanently delete <strong>{confirmDelete.name}</strong> and all associated data.
                        </p>
                        <div className="flex gap-3">
                            <button className="btn-secondary flex-1" onClick={() => setConfirmDelete(null)}>Cancel</button>
                            <button className="btn-danger flex-1 justify-center" onClick={() => handleDelete(confirmDelete)} disabled={!!deleting}>
                                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
