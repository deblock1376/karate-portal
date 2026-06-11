'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { fetchUserByIdAction, fetchUserAttendanceHistoryAction, fetchBeltsAction, updateUserAction } from '@/app/actions';
import { User, Belt } from '@/types';
import CalendarView from '@/components/CalendarView';
import Link from 'next/link';

export default function StudentDetailView({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user: currentUser, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [student, setStudent] = useState<any>(null);
    const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
    const [belts, setBelts] = useState<Belt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    // Management states
    const [rank, setRank] = useState('');
    const [stripes, setStripes] = useState(0);
    const [isSwat, setIsSwat] = useState(false);
    const [testDate, setTestDate] = useState('');

    const handleQuickUpdate = async () => {
        setIsUpdating(true);
        try {
            await updateUserAction(id, {
                currentBeltId: rank,
                stripes: stripes,
                isSwatTeam: isSwat,
                nextTestDate: testDate || undefined
            });
            // Toast or visual feedback would be nice, but simple reload for now
            loadData();
        } catch (error) {
            console.error('Update failed', error);
            alert('Failed to update student profile.');
        } finally {
            setIsUpdating(false);
        }
    };

    const loadData = useCallback(async () => {
        try {
            const [data, history, allBelts] = await Promise.all([
                fetchUserByIdAction(id),
                fetchUserAttendanceHistoryAction(id),
                fetchBeltsAction()
            ]);
            setStudent(data);
            setAttendanceHistory(history);
            setBelts(allBelts);

            // Init management states
            if (data) {
                setRank(data.currentBeltId);
                setStripes((data as any).stripes || 0);
                setIsSwat((data as any).isSwatTeam || false);
                setTestDate((data as any).nextTestDate ? (data as any).nextTestDate.toISOString().split('T')[0] : '');
            }
        } catch (error) {
            console.error('Failed to load student data', error);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

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
        return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
    }

    if (!student) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-white gap-4">
                <h1 className="text-2xl font-bold">Student not found</h1>
                <Link href="/sensei" className="text-blue-400 hover:underline">Back to Dashboard</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white p-8">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <Link href="/sensei/students" className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </Link>
                        <h1 className="text-3xl font-bold text-yellow-500">{student.name}'s Profile</h1>
                    </div>
                    <p className="text-gray-400 ml-12">{student.email}</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                            <span>🗓️</span> Attendance & Schedule
                        </h2>
                        <CalendarView
                            attendance={attendanceHistory}
                            scheduledClasses={student.classes || []}
                            classLinkPrefix="/sensei/classes"
                        />
                    </section>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-panel p-6 rounded-2xl border border-white/10">
                        <h3 className="text-lg font-bold mb-4">Student Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs uppercase text-slate-500 font-bold">Contract Status</label>
                                <p className="text-sm">{student.contractRenewal || 'None'}</p>
                            </div>
                            <div>
                                <label className="text-xs uppercase text-slate-500 font-bold">Start Date</label>
                                <p className="text-sm">{student.startDate ? new Date(student.startDate).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-xs uppercase text-slate-500 font-bold">Notes</label>
                                <p className="text-sm text-slate-400 italic">{student.senseiNotes || 'No notes'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-yellow-500/5 to-transparent">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span>🥋</span> Management Suite
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs uppercase text-slate-500 font-bold mb-1 block">Current Rank</label>
                                <select
                                    value={rank}
                                    onChange={(e) => setRank(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-500"
                                >
                                    {belts.map(b => <option key={b.id} value={b.id}>{b.name} Belt</option>)}
                                </select>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs uppercase text-slate-500 font-bold mb-1 block">Stripes</label>
                                    <select
                                        value={stripes}
                                        onChange={(e) => setStripes(parseInt(e.target.value))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-500"
                                    >
                                        {[0, 1, 2, 3, 4].map(s => <option key={s} value={s}>{s} Stripes</option>)}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs uppercase text-slate-500 font-bold mb-1 block">SWAT Team</label>
                                    <button
                                        onClick={() => setIsSwat(!isSwat)}
                                        className={`w-full h-[38px] rounded-lg text-xs font-bold transition-all border ${isSwat ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
                                    >
                                        {isSwat ? 'MEMBER' : 'GENERAL'}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs uppercase text-slate-500 font-bold mb-1 block">Next Belt Test</label>
                                <input
                                    type="date"
                                    value={testDate}
                                    onChange={(e) => setTestDate(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-500"
                                />
                            </div>

                            <button
                                onClick={handleQuickUpdate}
                                disabled={isUpdating}
                                className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-950 rounded-xl font-bold text-sm shadow-xl shadow-yellow-500/10 transition-all active:scale-95 disabled:opacity-50 mt-2"
                            >
                                {isUpdating ? 'Saving Changes...' : 'Save Management Settings'}
                            </button>
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl border border-white/10">
                        <h3 className="text-lg font-bold mb-4">Scheduled Classes</h3>
                        <div className="space-y-2">
                            {student.classes?.length === 0 && <p className="text-xs text-slate-500">Not assigned to any classes.</p>}
                            {student.classes?.map((cls: any) => (
                                <div key={cls.id} className="text-sm bg-blue-500/10 text-blue-400 p-2 rounded border border-blue-500/10">
                                    {cls.name} ({cls.days?.join(', ')} at {cls.time})
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
