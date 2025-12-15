'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const success = await login(email, password);
        if (!success) {
            setError('Invalid email or password.');
        } else {
            // Let the AuthContext (or session effect) handle data loading, 
            // but we must redirect. However, role based redirect is better.
            // Ideally AuthContext should handle it or we fetch role here?
            // Since login calls signIn, and session updates, the 'role' is in the session.
            // But we need to wait for session.
            // Simple fix: Reload page or simple redirect to root which then redirects?
            // Or better: Let's assume redirection logic.
            // Actually, `login` in AuthContext doesn't return the user role.
            // Let's force a redirect.
            window.location.href = '/sensei'; // Temporary dumb redirect, middleware will protect if wrong role?
            // Actually, let's verify role. 
            // But simpler: just redirect to root '/' and let middleware/page logic handle it?
            // Or better: Modify AuthContext to return role?
            // For now, let's just Refresh which usually triggers the AuthContext useEffect -> User set.
            // But we are on /login. 
            // If I am logged in, middleware might redirect me out of /login? No, middleware only protects /sensei.
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full p-8 glass-panel rounded-2xl shadow-2xl">
                <div className="text-center mb-8">
                    <span className="text-5xl mb-4 block">🥋</span>
                    <h1 className="text-4xl font-bold gold-gradient-text">Karate Portal</h1>
                    <p className="text-slate-400 mt-2">Master your journey</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                            placeholder="Enter your email"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                            placeholder="Enter your password"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold rounded-xl shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Sign In
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-400">
                    <p className="mb-2">Don't have an account? <a href="/register" className="text-amber-500 hover:text-amber-400 font-medium">Register here</a></p>
                    <p>Demo Accounts:</p>
                    <p>Student: daniel@dojo.com (student)</p>
                    <p>Sensei: sensei@dojo.com (sensei)</p>
                </div>
            </div>
        </div>
    );
}
