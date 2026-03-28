'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [tab, setTab] = useState<'admin' | 'employee'>('employee');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) { toast.error('Please enter your email.'); return; }
        if (tab === 'admin' && !password) { toast.error('Please enter your password.'); return; }

        setLoading(true);
        const result = await login(email, tab === 'admin' ? password : undefined);
        setLoading(false);

        if (result.success) {
            toast.success('Welcome back!');
            router.push(tab === 'admin' ? '/admin/dashboard' : '/employee/dashboard');
        } else {
            toast.error(result.error || 'Login failed.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4"
            style={{ background: 'linear-gradient(135deg, #0D1117 0%, #161B22 50%, #0D1117 100%)' }}>

            {/* Background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div style={{
                    position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
                    width: 600, height: 600,
                    background: 'radial-gradient(circle, rgba(59,245,196,0.05) 0%, transparent 70%)',
                    borderRadius: '50%',
                }} />
            </div>

            <div className="w-full max-w-md relative">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                        style={{ background: 'var(--accent-dim)', border: '1px solid rgba(59,245,196,0.3)' }}>
                        <ShieldCheck size={32} style={{ color: 'var(--accent)' }} />
                    </div>
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Devsinn Team Management Portal</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Penalty Management System</p>
                </div>

                {/* Card */}
                <div className="card" style={{ borderRadius: 16 }}>
                    {/* Tabs */}
                    <div className="flex rounded-lg p-1 mb-6 gap-1" style={{ background: 'var(--bg-secondary)' }}>
                        {(['employee', 'admin'] as const).map((t) => (
                            <button key={t} onClick={() => setTab(t)}
                                className="flex-1 py-2.5 rounded-md text-sm font-semibold capitalize transition-all"
                                style={{
                                    background: tab === t ? 'var(--accent)' : 'transparent',
                                    color: tab === t ? 'var(--bg-primary)' : 'var(--text-secondary)',
                                }}>
                                {t === 'admin' ? '🛡️ Admin' : '👤 Employee'}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label">Email Address</label>
                            <input type="email" className="input" placeholder="you@company.com"
                                value={email} onChange={e => setEmail(e.target.value)} />
                        </div>

                        {tab === 'admin' && (
                            <div>
                                <label className="label">Password</label>
                                <div className="relative">
                                    <input type={showPwd ? 'text' : 'password'} className="input pr-10"
                                        placeholder="Enter admin password" value={password}
                                        onChange={e => setPassword(e.target.value)} />
                                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2"
                                        style={{ color: 'var(--text-secondary)' }}>
                                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {tab === 'employee' && (
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                Employees log in using their registered email address only.
                            </p>
                        )}

                        <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
                            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 pt-4 border-t text-center" style={{ borderColor: 'var(--border)' }}>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            Devsinn Team Management Portal &copy; {new Date().getFullYear()} — Penalty Management System
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
