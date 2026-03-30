'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { getHomePathByRole } from '@/lib/roleAccess';
import toast from 'react-hot-toast';

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: {
                        client_id: string;
                        callback: (res: { credential?: string }) => void;
                    }) => void;
                    renderButton: (container: HTMLElement, options: { theme: string; size: string; width?: number; text?: string }) => void;
                    prompt: () => void;
                };
            };
        };
    }
}

export default function LoginPage() {
    const { login, loginWithGoogleToken } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    const [googleLoading, setGoogleLoading] = useState(Boolean(googleClientId));
    const googleButtonRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!googleClientId || !googleButtonRef.current) {
            return;
        }

        const scriptId = 'google-identity-services';
        const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

        const initialize = () => {
            if (!window.google || !googleButtonRef.current) {
                setGoogleLoading(false);
                return;
            }

            window.google.accounts.id.initialize({
                client_id: googleClientId,
                callback: async (res: { credential?: string }) => {
                    if (!res?.credential) {
                        toast.error('Google sign-in failed.');
                        return;
                    }
                    setLoading(true);
                    const result = await loginWithGoogleToken(res.credential);
                    setLoading(false);
                    if (result.success) {
                        toast.success('Welcome back!');
                        const stored = localStorage.getItem('fine_portal_user');
                        const parsed = stored ? JSON.parse(stored) : null;
                        router.push(getHomePathByRole(parsed?.role));
                    } else {
                        toast.error(result.error || 'Login failed.');
                    }
                },
            });

            googleButtonRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleButtonRef.current, {
                theme: 'outline',
                size: 'large',
                width: 340,
                text: 'continue_with',
            });
            window.google.accounts.id.prompt();
            setGoogleLoading(false);
        };

        if (existingScript) {
            initialize();
            return;
        }

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initialize;
        script.onerror = () => setGoogleLoading(false);
        document.head.appendChild(script);
    }, [googleClientId, loginWithGoogleToken, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) { toast.error('Please enter your email.'); return; }

        setLoading(true);
        const result = await login(email);
        setLoading(false);

        if (result.success) {
            toast.success('Welcome back!');
            const stored = localStorage.getItem('fine_portal_user');
            const parsed = stored ? JSON.parse(stored) : null;
            router.push(getHomePathByRole(parsed?.role));
        } else {
            toast.error(result.error || 'Login failed.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4"
            style={{ background: 'radial-gradient(circle at 20% 10%, rgba(91,116,222,0.12) 0%, transparent 45%), radial-gradient(circle at 85% 85%, rgba(69,211,156,0.12) 0%, transparent 45%), #ffffff' }}>

            {/* Background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div style={{
                    position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
                    width: 600, height: 600,
                    background: 'radial-gradient(circle, rgba(33,201,211,0.10) 0%, transparent 70%)',
                    borderRadius: '50%',
                }} />
            </div>

            <div className="w-full max-w-md relative">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                        style={{ background: 'linear-gradient(135deg, rgba(91,116,222,0.15) 0%, rgba(33,201,211,0.15) 65%, rgba(69,211,156,0.15) 100%)', border: '1px solid rgba(91,116,222,0.24)' }}>
                        <ShieldCheck size={32} style={{ color: 'var(--brand-blue)' }} />
                    </div>
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Devsinn Team Management Portal</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Role Based Access Portal</p>
                </div>

                {/* Card */}
                <div className="card" style={{ borderRadius: 16 }}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label">Email Address</label>
                            <input type="email" className="input" placeholder="you@company.com"
                                value={email} onChange={e => setEmail(e.target.value)} />
                        </div>

                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            Only users registered by HR/Admin can access this portal.
                        </p>

                        <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
                            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                            {loading ? 'Signing in...' : 'Continue with Registered Email'}
                        </button>
                    </form>

                    <div className="my-4 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>or</div>

                    <div className="w-full flex justify-center">
                        {googleLoading ? (
                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Loading Google Sign-In...</div>
                        ) : (
                            <div ref={googleButtonRef} />
                        )}
                    </div>

                    {!googleClientId && (
                        <p className="mt-3 text-xs text-center" style={{ color: 'var(--warning)' }}>
                            Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local to enable OAuth login.
                        </p>
                    )}

                    <div className="mt-6 pt-4 border-t text-center" style={{ borderColor: 'var(--border)' }}>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            Devsinn Team Management Portal &copy; {new Date().getFullYear()} - Secure Role Based Access
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
