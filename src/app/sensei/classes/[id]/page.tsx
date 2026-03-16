'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
    fetchClassByIdForDateAction,
    markAttendanceForDateAction,
    removeAttendanceForDateAction,
} from '@/app/actions';
import Link from 'next/link';
import { convertToCSV, downloadCSV } from '@/lib/exportUtils';

function todayStr() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
}

export default function ClassDetailView({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user: currentUser, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [cls, setCls] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(todayStr());
    const [loadingStudents, setLoadingStudents] = useState<Record<string, boolean>>({});

    const loadData = useCallback(async (date: string) => {
        setIsLoading(true);
        try {
            const data = await fetchClassByIdForDateAction(id, date);
            setCls(data);
        } catch (error) {
            console.error('Failed to load class data', error);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (!authLoading) {
            if (!currentUser || currentUser.role !== 'sensei') {
                router.push('/login');
            } else {
                loadData(selectedDate);
            }
        }
    }, [currentUser, authLoading, router, loadData, selectedDate]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedDate(e.target.value);
    };

    const handleCheckIn = async (studentId: string) => {
        setLoadingStudents(prev => ({ ...prev, [studentId]: true }));
        await markAttendanceForDateAction(studentId, selectedDate);
        await loadData(selectedDate);
        setLoadingStudents(prev => ({ ...prev, [studentId]: false }));
    };

    const handleRemove = async (studentId: string) => {
        setLoadingStudents(prev => ({ ...prev, [studentId]: true }));
        await removeAttendanceForDateAction(studentId, selectedDate);
        await loadData(selectedDate);
        setLoadingStudents(prev => ({ ...prev, [studentId]: false }));
    };

    const isPastDate = selectedDate < todayStr();
    const isToday = selectedDate === todayStr();

    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center text-white bg-gray-900">Loading...</div>;
    }

    if (!isLoading && !cls) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-white bg-gray-900 gap-4">
                <h1 className="text-2xl font-bold">Class not found</h1>
                <Link href="/sensei" className="text-blue-400 hover:underline">Back to Dashboard</Link>
            </div>
        );
    }

    const presentCount = cls?.students?.filter((s: any) => s.attendance.length > 0).length ?? 0;
    const totalCount = cls?.students?.length ?? 0;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <header className="mb-8">
                <div className="flex items-center gap-4 mb-2">
                    <Link href="/sensei" className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <h1 className="text-3xl font-bold text-yellow-500">{cls?.name ?? '...'}</h1>
                </div>
                {cls && (
                    <div className="flex items-center gap-4 text-gray-400 ml-12">
                        <span className="flex items-center gap-1">
                            <span>📅</span> {cls.days?.join(', ')}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                        <span className="flex items-center gap-1">
                            <span>⏰</span> {cls.time} – {(() => {
                                const [h, m] = cls.time.split(':').map(Number);
                                const end = new Date();
                                end.setHours(h, m + cls.duration);
                                return end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                            })()}
                        </span>
                    </div>
                )}
            </header>

            <div className="max-w-4xl">
                <section className="glass-panel p-6 rounded-2xl border border-white/10">

                    {/* Date picker + summary bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold">Attendance</h2>
                            {!isLoading && (
                                <span className="text-sm text-gray-400">
                                    {presentCount} / {totalCount} present
                                </span>
                            )}
                            {isPastDate && (
                                <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
                                    Past date
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <label className="text-xs text-gray-500 uppercase tracking-widest font-bold">Date</label>
                            <input
                                type="date"
                                value={selectedDate}
                                max={todayStr()}
                                onChange={handleDateChange}
                                className="bg-gray-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                            />
                            {!isToday && (
                                <button
                                    onClick={() => setSelectedDate(todayStr())}
                                    className="text-xs text-gray-400 hover:text-white transition-colors underline underline-offset-2"
                                >
                                    Today
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Export button */}
                    {cls && (
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={() => {
                                    const csv = convertToCSV(cls.students, { name: 'Name', email: 'Email' });
                                    downloadCSV(csv, `${cls.name}-roster.csv`);
                                }}
                                className="text-[10px] font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-3 py-1.5 rounded-lg transition-all border border-white/5 flex items-center gap-1.5"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export Roster
                            </button>
                        </div>
                    )}

                    {/* Table */}
                    <div className="overflow-hidden rounded-xl border border-white/5 bg-gray-800/50">
                        {isLoading ? (
                            <div className="p-8 text-center text-gray-500">Loading attendance...</div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="p-4 text-xs uppercase font-bold text-slate-500">Student</th>
                                        <th className="p-4 text-xs uppercase font-bold text-slate-500">
                                            {isToday ? "Today's Status" : 'Status'}
                                        </th>
                                        <th className="p-4 text-xs uppercase font-bold text-slate-500 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {cls?.students?.map((student: any) => {
                                        const isCheckedIn = student.attendance.length > 0;
                                        const isProcessing = loadingStudents[student.id];

                                        return (
                                            <tr key={student.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="p-4">
                                                    <div className="font-medium">{student.name}</div>
                                                    <div className="text-xs text-gray-500">{student.email}</div>
                                                </td>
                                                <td className="p-4">
                                                    {isCheckedIn ? (
                                                        <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-400 px-2 py-1 rounded text-xs font-bold border border-green-500/10">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                            Present
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-500 italic">Absent</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        {isCheckedIn ? (
                                                            <button
                                                                onClick={() => handleRemove(student.id)}
                                                                disabled={isProcessing}
                                                                className="text-xs text-red-400 hover:text-red-300 font-medium disabled:opacity-40 transition-colors"
                                                            >
                                                                {isProcessing ? '...' : 'Remove'}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleCheckIn(student.id)}
                                                                disabled={isProcessing}
                                                                className="text-xs bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 px-3 py-1 rounded font-medium disabled:opacity-40 transition-colors"
                                                            >
                                                                {isProcessing ? '...' : 'Check In'}
                                                            </button>
                                                        )}
                                                        <Link
                                                            href={`/sensei/students/${student.id}`}
                                                            className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                                                        >
                                                            Profile
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {cls?.students?.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="p-8 text-center text-gray-500 italic">
                                                No students assigned to this class.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
