'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Header from '@/components/Header';
import { getEmployees, addEmployee, updateEmployee, deleteEmployee } from '@/lib/googleSheets';
import { Department, Employee, UserRole } from '@/types';
import { UserPlus, Trash2, Search, Loader2, Users, Edit, Image as ImageIcon, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImage } from '@/lib/uploadImage';

type EmployeeFormData = {
    name: string;
    email: string;
    fatherName: string;
    cnic: string;
    picture: string;
    bankName: string;
    bankTitle: string;
    bankAccountNumber: string;
    address: string;
    jobPosition: string;
    role: UserRole;
    department: Department;
    leadId: string;
    status: string;
    joiningDate: string;
    contactNumber: string;
};

const initialForm: EmployeeFormData = {
    name: '', email: '', fatherName: '', cnic: '', picture: '',
    bankName: '', bankTitle: '', bankAccountNumber: '', address: '',
    jobPosition: '', role: 'employee', department: '', leadId: '', status: 'Currently Working', joiningDate: '', contactNumber: ''
};

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    
    // Form state
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<EmployeeFormData>(initialForm);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const [deleting, setDeleting] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Employee | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        e.email.toLowerCase().includes(search.toLowerCase()) ||
        e.jobPosition?.toLowerCase().includes(search.toLowerCase()) ||
        e.contactNumber?.toLowerCase().includes(search.toLowerCase())
    );

    const leads = employees.filter((e) => e.role === 'lead' && e.status !== 'Left');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'role') {
            setFormData((prev) => ({ ...prev, role: value as UserRole }));
            return;
        }
        if (name === 'department') {
            setFormData((prev) => ({ ...prev, department: value as Department }));
            return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setUploadingImage(true);
        try {
            const url = await uploadImage(file);
            setFormData(prev => ({ ...prev, picture: url }));
            toast.success('Picture uploaded');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to upload picture';
            toast.error(message);
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleOpenAdd = () => {
        setFormData(initialForm);
        setEditingId(null);
        setShowForm(true);
    };

    const handleOpenEdit = (emp: Employee) => {
        setFormData({
            name: emp.name || '', email: emp.email || '', fatherName: emp.fatherName || '',
            cnic: emp.cnic || '', picture: emp.picture || '', bankName: emp.bankName || '',
            bankTitle: emp.bankTitle || '', bankAccountNumber: emp.bankAccountNumber || '',
            address: emp.address || '', jobPosition: emp.jobPosition || '',
            role: emp.role || 'employee', department: emp.department || '', leadId: emp.leadId || '',
            status: emp.status || 'Currently Working', joiningDate: emp.joiningDate || '',
            contactNumber: emp.contactNumber || ''
        });
        setEditingId(emp.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.email.trim()) { 
            toast.error('Name and email are required.'); return; 
        }
        if (formData.role === 'lead' && !formData.department) {
            toast.error('Department is required for lead role.');
            return;
        }
        setSaving(true);
        try {
            if (editingId) {
                const updated = await updateEmployee(editingId, formData);
                setEmployees(prev => prev.map(emp => emp.id === editingId ? { ...emp, ...updated } : emp));
                toast.success('Employee updated.');
            } else {
                const emp = await addEmployee(formData);
                setEmployees(prev => [...prev, emp]);
                toast.success('Employee added.');
            }
            setShowForm(false);
            setFormData(initialForm);
            setEditingId(null);
        } catch {
            toast.error(`Failed to ${editingId ? 'update' : 'add'} employee.`);
        } finally {
            setSaving(false);
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
                        <input className="input pl-9" placeholder="Search employees, job positions..." value={search}
                            onChange={e => setSearch(e.target.value)} />
                    </div>
                    {!showForm && (
                        <button onClick={handleOpenAdd} className="btn-primary">
                            <UserPlus size={16} /> Add Employee
                        </button>
                    )}
                </div>

                {/* Form */}
                {showForm && (
                    <div className="card">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold">
                                {editingId ? 'Edit Employee' : 'Add New Employee'}
                            </h3>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/5 rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Personal Information */}
                            <div>
                                <h4 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Personal Information</h4>
                                <div className="grid sm:grid-cols-3 gap-4">
                                    <div className="sm:col-span-3 lg:col-span-1 flex flex-col justify-center">
                                        <label className="label">Profile Picture</label>
                                        <div className="flex items-center gap-4 mt-2">
                                            <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center shrink-0 border" style={{ borderColor: 'var(--border)', background: 'var(--surface-light)' }}>
                                                {formData.picture ? (
                                                    <img src={formData.picture} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon size={24} style={{ color: 'var(--text-secondary)' }} />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                                                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} className="btn-secondary text-sm w-full justify-center">
                                                    {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                                                    {uploadingImage ? 'Uploading...' : 'Choose Image'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="sm:col-span-3 lg:col-span-2 grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">Full Name *</label>
                                            <input className="input" name="name" placeholder="John Doe" value={formData.name} onChange={handleInputChange} required />
                                        </div>
                                        <div>
                                            <label className="label">Father&apos;s Name</label>
                                            <input className="input" name="fatherName" placeholder="Richard Doe" value={formData.fatherName} onChange={handleInputChange} />
                                        </div>
                                        <div>
                                            <label className="label">CNIC</label>
                                            <input className="input" name="cnic" placeholder="12345-6789012-3" value={formData.cnic} onChange={handleInputChange} />
                                        </div>
                                    </div>

                                    <div className="sm:col-span-3 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="label">Contact Number</label>
                                            <input className="input" name="contactNumber" placeholder="+123456789" value={formData.contactNumber} onChange={handleInputChange} />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="label">Residential Address</label>
                                            <input className="input" name="address" placeholder="123 Main St, City" value={formData.address} onChange={handleInputChange} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Employment Details */}
                            <div>
                                <h4 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Employment Details</h4>
                                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="label">Email Address *</label>
                                        <input type="email" className="input" name="email" placeholder="john@company.com" value={formData.email} onChange={handleInputChange} required />
                                    </div>
                                    <div>
                                        <label className="label">Job Position</label>
                                        <input className="input" name="jobPosition" placeholder="Software Engineer" value={formData.jobPosition} onChange={handleInputChange} />
                                    </div>
                                    <div>
                                        <label className="label">Role</label>
                                        <select className="input" name="role" value={formData.role} onChange={handleInputChange}>
                                            <option value="employee">Employee</option>
                                            <option value="lead">Lead</option>
                                            <option value="manager">Manager</option>
                                            <option value="hr">HR</option>
                                            <option value="higher-management">Higher Management</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Joining Date</label>
                                        <input type="date" className="input" name="joiningDate" value={formData.joiningDate} onChange={handleInputChange} />
                                    </div>
                                    {formData.role === 'lead' && (
                                        <div>
                                            <label className="label">Department</label>
                                            <select className="input" name="department" value={formData.department} onChange={handleInputChange} required>
                                                <option value="">Select Department</option>
                                                <option value="web">Web</option>
                                                <option value="app">App</option>
                                                <option value="backend">Backend</option>
                                                <option value="overall">Overall</option>
                                            </select>
                                        </div>
                                    )}
                                    {formData.role !== 'lead' && formData.role !== 'higher-management' && formData.role !== 'hr' && (
                                        <div>
                                            <label className="label">Reporting Lead</label>
                                            <select className="input" name="leadId" value={formData.leadId} onChange={handleInputChange}>
                                                <option value="">None</option>
                                                {leads.map((lead) => (
                                                    <option key={lead.id} value={lead.id}>{lead.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    <div className="sm:col-span-2 md:col-span-4">
                                        <label className="label">Status</label>
                                        <select className="input" name="status" value={formData.status} onChange={handleInputChange}>
                                            <option value="Currently Working">Currently Working</option>
                                            <option value="Left">Left</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Banking Information */}
                            <div>
                                <h4 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Banking Information</h4>
                                <div className="grid sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="label">Bank Name</label>
                                        <input className="input" name="bankName" placeholder="Bank of America" value={formData.bankName} onChange={handleInputChange} />
                                    </div>
                                    <div>
                                        <label className="label">Account Title</label>
                                        <input className="input" name="bankTitle" placeholder="John Doe" value={formData.bankTitle} onChange={handleInputChange} />
                                    </div>
                                    <div>
                                        <label className="label">Account Number</label>
                                        <input className="input" name="bankAccountNumber" placeholder="1234567890" value={formData.bankAccountNumber} onChange={handleInputChange} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                                <button type="button" className="btn-secondary flex-1" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : (editingId ? <Edit size={16} /> : <UserPlus size={16} />)}
                                    {saving ? 'Saving...' : (editingId ? 'Save Changes' : 'Add Employee')}
                                </button>
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
                            <p style={{ color: 'var(--text-secondary)' }}>{search ? 'No results found.' : 'No employees yet.'}</p>
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table>
                                <thead><tr>
                                    <th>Employee</th><th>Role / Department</th><th>Contact</th><th>Status</th><th>Actions</th>
                                </tr></thead>
                                <tbody>
                                    {filtered.map(emp => (
                                        <tr key={emp.id}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 overflow-hidden"
                                                        style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--border)' }}>
                                                        {emp.picture ? (
                                                            <img src={emp.picture} alt={emp.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            emp.name.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{emp.name}</div>
                                                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{emp.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)' }}>
                                                {(emp.role || 'employee').toUpperCase()} {emp.department ? `(${emp.department})` : ''}
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)' }}>
                                                {emp.contactNumber || '—'}
                                            </td>
                                            <td>
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${emp.status === 'Left' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                                    {emp.status || 'Currently Working'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleOpenEdit(emp)} className="btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>
                                                        <Edit size={14} /> Edit
                                                    </button>
                                                    <button onClick={() => setConfirmDelete(emp)} className="btn-danger" style={{ padding: '0.4rem 0.8rem' }}>
                                                        <Trash2 size={14} /> Delete
                                                    </button>
                                                </div>
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
