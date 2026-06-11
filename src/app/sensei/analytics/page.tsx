'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { fetchDojoAnalyticsAction } from '@/app/actions';
import Link from 'next/link';
import { convertToCSV, downloadCSV } from '@/lib/exportUtils';

export default function AnalyticsDashboard() {
    const { user: currentUser, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [analytics, setAnalytics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const data = await fetchDojoAnalyticsAction();
            setAnalytics(data);
        } catch (error) {
            console.error('Failed to load analytics', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading) {
            if (!currentUser || currentUser.role !== 'sensei') {
                router.push('/login');
            } else {
                loadData();
            }
        }
    }, [currentUser, authLoading, router, loadData]);

    if (isLoading || authLoading) {
        return <div className="min-h-screen flex items-center justify-center text-white">Loading Dojo Insights...</div>;
    }

    if (!analytics) return null;

    return (
        <div className="min-h-screen text-white p-8">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <Link href="/sensei" className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </Link>
                        <h1 className="text-3xl font-bold text-yellow-500">Dojo Analytics</h1>
                    </div>
                    <p className="text-gray-400 ml-12">Performance metrics and student retention</p>
                </div>
                <button
                    onClick={loadData}
                    className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"
                    title="Refresh Data"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
            </header>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card title="Total Students" value={analytics.totalStudents} color="blue" icon="👥" />
                <Card title="Active Students" value={analytics.activeStudents} color="green" icon="🔥" subtitle="Last 30 days" />
                <Card title="Lapsed Students" value={analytics.lapsedStudents} color="red" icon="⚠️" subtitle="Inactive > 30 days" />
                <Card title="Retention Rate" value={`${Math.round((analytics.activeStudents / analytics.totalStudents) * 100)}%`} color="purple" icon="📈" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Contract Renewals */}
                <div className="lg:col-span-1 space-y-6">
                    <section className="glass-panel p-6 rounded-2xl border border-white/10 h-full">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span>📅</span> Upcoming Renewals
                            <button
                                onClick={() => {
                                    const csv = convertToCSV(analytics.upcomingRenewals, {
                                        name: 'Name',
                                        date: 'Renewal Date',
                                        daysTo: 'Days Remaining'
                                    });
                                    downloadCSV(csv, 'upcoming-renewals.csv');
                                }}
                                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors ml-2"
                                title="Export CSV"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            </button>
                            <span className="text-xs bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded ml-auto">Next 30 Days</span>
                        </h2>
                        <div className="space-y-3">
                            {analytics.upcomingRenewals.map((r: any) => (
                                <Link key={r.id} href={`/sensei/students/${r.id}`} className="block group">
                                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 group-hover:bg-white/10 group-hover:border-white/20 transition-all">
                                        <div>
                                            <p className="font-bold text-sm group-hover:text-amber-400 transition-colors">{r.name}</p>
                                            <p className="text-[10px] text-gray-500">{new Date(r.date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-bold text-amber-500">In {r.daysTo}d</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                            {analytics.upcomingRenewals.length === 0 && (
                                <p className="text-center text-gray-500 py-8 italic text-sm">No renewals in the next 30 days.</p>
                            )}
                        </div>
                    </section>
                </div>

                {/* At Risk / Lapsed */}
                <div className="lg:col-span-1 space-y-6">
                    <section className="glass-panel p-6 rounded-2xl border border-white/10 h-full">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-red-400">
                            <span>🚨</span> Students At Risk
                            <button
                                onClick={() => {
                                    const csv = convertToCSV(analytics.lapsedList, {
                                        name: 'Name',
                                        lastSeen: 'Last Attendance'
                                    });
                                    downloadCSV(csv, 'at-risk-students.csv');
                                }}
                                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors ml-2"
                                title="Export CSV"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            </button>
                            <span className="text-xs bg-red-500/10 px-2 py-0.5 rounded ml-auto">{analytics.lapsedList.length}</span>
                        </h2>
                        <div className="space-y-3">
                            {analytics.lapsedList.map((s: any) => (
                                <Link key={s.id} href={`/sensei/students/${s.id}`} className="block group">
                                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 group-hover:bg-red-500/10 group-hover:border-red-500/20 transition-all">
                                        <div>
                                            <p className="font-bold text-sm group-hover:text-red-400 transition-colors">{s.name}</p>
                                            <p className="text-[10px] text-gray-500">Last seen: {s.lastSeen === 'Never' ? 'Never' : new Date(s.lastSeen).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-red-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                            {analytics.lapsedList.length === 0 && (
                                <p className="text-center text-gray-500 py-8 italic text-sm">Everyone has been active recently! 🏆</p>
                            )}
                        </div>
                    </section>
                </div>

                {/* Rank Distribution */}
                <div className="lg:col-span-1 space-y-6">
                    <section className="glass-panel p-6 rounded-2xl border border-white/10 h-full">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <span>🥋</span> Rank Distribution
                        </h2>
                        <div className="space-y-4">
                            {analytics.rankDistribution.map((rank: any) => (
                                <div key={rank.name} className="space-y-1">
                                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-gray-500">
                                        <span>{rank.name}</span>
                                        <span>{rank.count} Students</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full transition-all duration-1000 ease-out"
                                            style={{
                                                width: `${(rank.count / analytics.totalStudents) * 100}%`,
                                                backgroundColor: rank.color || '#3b82f6'
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function Card({ title, value, color, icon, subtitle }: any) {
    const colors: any = {
        blue: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
        green: 'text-green-400 bg-green-400/10 border-green-400/20',
        red: 'text-red-400 bg-red-400/10 border-red-400/20',
        purple: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    };

    return (
        <div className={`p-6 rounded-2xl border ${colors[color]} glass-panel`}>
            <div className="flex justify-between items-start mb-4">
                <span className="text-2xl">{icon}</span>
                {subtitle && <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{subtitle}</span>}
            </div>
            <p className="text-xs uppercase font-bold tracking-widest opacity-60 mb-1">{title}</p>
            <h3 className="text-3xl font-black">{value}</h3>
        </div>
    );
}
