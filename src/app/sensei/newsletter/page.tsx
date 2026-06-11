'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchNewsletterRecipientsAction, sendNewsletterAction } from '@/app/actions';

type SendStatus = 'idle' | 'sending' | 'success' | 'error';

export default function NewsletterPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [recipients, setRecipients] = useState<{ id: string; name: string; email: string }[]>([]);
    const [loadingRecipients, setLoadingRecipients] = useState(true);
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [sendStatus, setSendStatus] = useState<SendStatus>('idle');
    const [result, setResult] = useState<{ sent: number; failed: number; errors: string[] } | null>(null);

    const loadRecipients = useCallback(async () => {
        try {
            const data = await fetchNewsletterRecipientsAction();
            setRecipients(data.map(r => ({ id: r.id, name: r.name ?? '', email: r.email ?? '' })));
        } finally {
            setLoadingRecipients(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.role !== 'sensei') {
                router.push('/login');
            } else {
                loadRecipients();
            }
        }
    }, [user, authLoading, router, loadRecipients]);

    const handleSend = async () => {
        if (!subject.trim() || !body.trim()) return;
        setSendStatus('sending');
        setResult(null);
        try {
            const res = await sendNewsletterAction(subject, body);
            setResult(res);
            setSendStatus(res.failed === 0 ? 'success' : 'error');
        } catch (e: any) {
            setResult({ sent: 0, failed: recipients.length, errors: [e.message] });
            setSendStatus('error');
        }
    };

    const canSend = subject.trim().length > 0 && body.trim().length > 0 && sendStatus !== 'sending' && recipients.length > 0;

    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
    }

    return (
        <div className="min-h-screen text-white p-8">
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/sensei" className="text-gray-500 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-yellow-500">Send Newsletter</h1>
                        <p className="text-gray-400 text-sm mt-0.5">Compose and send an email to all enrolled students</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Compose */}
                <div className="lg:col-span-2 space-y-5">
                    <div className="glass-card p-6 rounded-2xl space-y-5">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">Subject</label>
                            <input
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                placeholder="June Update from Sensei"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">Message</label>
                            <textarea
                                value={body}
                                onChange={e => setBody(e.target.value)}
                                placeholder={"Write your message here...\n\nTip: Line breaks are preserved in the email."}
                                rows={16}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all resize-y font-mono"
                            />
                        </div>

                        {/* Result banner */}
                        {result && (
                            <div className={`rounded-xl px-4 py-3 text-sm font-medium ${sendStatus === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                                {sendStatus === 'success'
                                    ? `Sent to ${result.sent} student${result.sent !== 1 ? 's' : ''}.`
                                    : `${result.sent} sent, ${result.failed} failed.`
                                }
                                {result.errors.length > 0 && (
                                    <ul className="mt-2 space-y-1 text-xs opacity-80 list-disc list-inside">
                                        {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                                    </ul>
                                )}
                            </div>
                        )}

                        <button
                            onClick={handleSend}
                            disabled={!canSend}
                            className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed bg-yellow-500 hover:bg-yellow-400 text-gray-950"
                        >
                            {sendStatus === 'sending'
                                ? `Sending to ${recipients.length} students...`
                                : `Send to ${recipients.length} Student${recipients.length !== 1 ? 's' : ''}`
                            }
                        </button>
                    </div>
                </div>

                {/* Recipients sidebar */}
                <div className="lg:col-span-1">
                    <div className="glass-card p-5 rounded-2xl sticky top-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Recipients</h2>
                            <span className="bg-yellow-500/10 text-yellow-500 text-xs font-bold px-2.5 py-1 rounded-full border border-yellow-500/20">
                                {loadingRecipients ? '…' : recipients.length}
                            </span>
                        </div>
                        {loadingRecipients ? (
                            <p className="text-gray-500 text-sm text-center py-8">Loading...</p>
                        ) : recipients.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-8">No students found.</p>
                        ) : (
                            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                                {recipients.map(r => (
                                    <div key={r.id} className="flex flex-col py-2 border-b border-white/5 last:border-0">
                                        <span className="text-sm text-white font-medium">{r.name}</span>
                                        <span className="text-xs text-gray-500 truncate">{r.email}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
