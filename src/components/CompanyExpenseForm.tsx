'use client';

import { useState } from 'react';
import { CompanyExpense, PaymentMethod } from '@/types';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Employee } from '@/types';

interface CompanyExpenseFormProps {
    onSubmit: (expense: Omit<CompanyExpense, 'id' | 'createdAt'>) => Promise<void>;
    onClose: () => void;
    approvers: Employee[];
}

const paymentMethods: PaymentMethod[] = ['Cash', 'Bank Transfer', 'JazzCash', 'Check'];

export default function CompanyExpenseForm({ onSubmit, onClose, approvers }: CompanyExpenseFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        paidBy: '',
        approvedBy: '',
        paymentMethod: 'Cash' as PaymentMethod,
        receiptUrl: '',
        notes: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // For now, store the file name. In production, upload to cloud storage
            setFormData(prev => ({ ...prev, receiptUrl: file.name }));
            toast.success('File selected: ' + file.name);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.date || !formData.description || !formData.amount || !formData.paidBy || !formData.approvedBy) {
            toast.error('Please fill all required fields');
            return;
        }

        try {
            setLoading(true);
            await onSubmit({
                date: formData.date,
                description: formData.description,
                amount: parseFloat(formData.amount),
                paidBy: formData.paidBy,
                approvedBy: formData.approvedBy,
                paymentMethod: formData.paymentMethod,
                receiptUrl: formData.receiptUrl,
                notes: formData.notes,
            });
            toast.success('Expense added successfully');
            onClose();
        } catch (error) {
            toast.error('Failed to add expense');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg my-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Add Company Expense</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter expense description"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Paid By <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="paidBy"
                                value={formData.paidBy}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Name"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Approved By <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="approvedBy"
                                value={formData.approvedBy}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select approver</option>
                                {approvers.map((emp) => (
                                    <option key={emp.id} value={emp.name}>
                                        {emp.name} ({emp.jobPosition || 'No Designation'})
                                    </option>
                                ))}
                            </select>
                            {approvers.length === 0 && (
                                <p className="text-xs text-amber-600 mt-1">No authorized approvers configured yet.</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Method <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="paymentMethod"
                            value={formData.paymentMethod}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {paymentMethods.map(method => (
                                <option key={method} value={method}>{method}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Receipt/Document
                        </label>
                        <input
                            type="file"
                            onChange={handleFileUpload}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            accept="image/*,.pdf,.doc,.docx"
                        />
                        {formData.receiptUrl && (
                            <p className="text-xs text-green-600 mt-1">✓ {formData.receiptUrl}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Additional notes (optional)"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Adding...' : 'Add Expense'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
