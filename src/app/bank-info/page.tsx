'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Building2, CreditCard, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

const bankDetails = [
    { label: 'Account Name', value: 'Azan Asim' },
    { label: 'Payment Service', value: 'JazzCash' },
    { label: 'Account Number', value: '03221475219' },
];

function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => toast.success('Copied!')).catch(() => { });
}

function BankInfoContent() {
    return (
        <div className="flex flex-col h-full">
            <header className="px-8 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
                <h1 className="text-xl font-bold">Bank Information</h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Payment details for fine submissions</p>
            </header>

            <div className="p-8 flex-1 flex items-start justify-center">
                <div className="w-full max-w-lg space-y-6">
                    {/* Card */}
                    <div className="rounded-2xl overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #0D2D1F 0%, #0A3828 50%, #0D2D1F 100%)', border: '1px solid rgba(59,245,196,0.3)' }}>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                                    style={{ background: 'rgba(59,245,196,0.15)' }}>
                                    <Building2 size={24} style={{ color: 'var(--accent)' }} />
                                </div>
                                <div>
                                    <p className="font-bold text-lg" style={{ color: 'var(--accent)' }}>JazzCash Payment</p>
                                    <p className="text-sm" style={{ color: 'rgba(59,245,196,0.6)' }}>Official penalty payment account</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {bankDetails.map(({ label, value }) => (
                                    <div key={label} className="flex items-center justify-between p-4 rounded-xl"
                                        style={{ background: 'rgba(0,0,0,0.3)' }}>
                                        <div>
                                            <p className="text-xs font-medium mb-1" style={{ color: 'rgba(59,245,196,0.6)' }}>{label}</p>
                                            <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{value}</p>
                                        </div>
                                        <button onClick={() => copy(value)}
                                            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                                            style={{ background: 'rgba(59,245,196,0.1)' }}
                                            title="Copy">
                                            <Copy size={16} style={{ color: 'var(--accent)' }} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bottom strip */}
                        <div className="px-6 py-4" style={{ background: 'rgba(59,245,196,0.08)', borderTop: '1px solid rgba(59,245,196,0.15)' }}>
                            <div className="flex items-center gap-2">
                                <CreditCard size={16} style={{ color: 'var(--accent)' }} />
                                <p className="text-sm" style={{ color: 'rgba(59,245,196,0.7)' }}>
                                    After payment, submit your screenshot in the portal for verification.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="card">
                        <h3 className="font-semibold mb-4">How to Pay</h3>
                        <ol className="space-y-3">
                            {[
                                'Open your JazzCash app or visit jazzcash.com.pk',
                                'Select "Send Money" and enter the account number: 03221475219',
                                'Enter the exact penalty amount and complete the payment',
                                'Take a screenshot of the successful transaction',
                                'Upload the screenshot in the portal under your penalty',
                            ].map((step, i) => (
                                <li key={i} className="flex gap-3 text-sm">
                                    <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs"
                                        style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                                        {i + 1}
                                    </span>
                                    <span style={{ color: 'var(--text-secondary)' }}>{step}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function BankInfoPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) router.push('/login');
    }, [user, isLoading, router]);

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <div className="spinner" style={{ width: 36, height: 36 }} />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 min-h-screen">
                <BankInfoContent />
            </main>
        </div>
    );
}
