'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
    fetchUserByIdAction,
    fetchUserAttendanceHistoryAction,
    fetchBeltsAction,
    fetchClassesAction,
    updateUserAction,
} from '@/app/actions';
import { Belt } from '@/types';
import CalendarView from '@/components/CalendarView';
import Link from 'next/link';

export default function StudentDetailView({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user: currentUser, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [student, setStudent] = useState<any>(null);
    const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
    const [belts, setBelts] = useState<Belt[]>([]);
    const [allClasses, setAllClasses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

    // Edit form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [senseiNotes, setSenseiNotes] = useState('');
    const [startDate, setStartDate] = useState('');
    const [contractStartDate, setContractStartDate] = useState('');
    const [contractRenewal, setContractRenewal] = useState('');
    const [currentBeltId, setCurrentBeltId] = useState('');
    const [stripes, setStripes] = useState(0);
    const [isSwatTeam, setIsSwatTeam] = useState(false);
    const [nextTestDate, setNextTestDate] = useState('');
    const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

    const populateForm = (data: any) => {
        setName(data.name || '');
        setEmail(data.email || '');
        setAddress(data.address || '');
        setSenseiNotes(data.senseiNotes || '');
        setStartDate(data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '');
        setContractStartDate(data.contractStartDate ? new Date(data.contractStartDate).toISOString().split('T')[0] : '');
        setContractRenewal(data.contractRenewal || '');
        setCurrentBeltId(data.currentBeltId || '');
        setStripes(data.stripes ?? 0);
        setIsSwatTeam(data.isSwatTeam ?? false);
        setNextTestDate(data.nextTestDate ? new Date(data.nextTestDate).toISOString().split('T')[0] : '');
        setSelectedClassIds((data.classes || []).map((c: any) => c.id));
    };

    const loadData = useCallback(async () => {
        try {
            const [data, history, allBelts, classes] = await Promise.all([
                fetchUserByIdAction(id),
                fetchUserAttendanceHistoryAction(id),
                fetchBeltsAction(),
                fetchClassesAction(),
            ]);
            setStudent(data);
            setAttendanceHistory(history);
            setBelts(allBelts);
            setAllClasses(classes);
            if (data) populateForm(data);
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

    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus('idle');
        try {
            await updateUserAction(id, {
                name,
                email,
                address,
                senseiNotes,
                startDate: startDate || undefined,
                contractStartDate: contractStartDate || undefined,
                contractRenewal: contractRenewal || undefined,
                currentBeltId,
                stripes,
                isSwatTeam,
                nextTestDate: nextTestDate || undefined,
                classIds: selectedClassIds,
            });
            await loadData();
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2500);
        } catch (error: any) {
            console.error('Save failed', error);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading || authLoading) {
        return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
    }

    if (!student) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-white gap-4">
                <h1 className="text-2xl font-bold">Student not found</h1>
                <Link href="/sensei/students" className="text-blue-400 hover:underline">Back to Roster</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white p-8">
            <header className="mb-8 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link href="/sensei/students" className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-yellow-500">{student.name}</h1>
                        <p className="text-gray-400">{student.email}</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Attendance */}
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

                {/* Right: Edit Panel */}
                <div className="lg:col-span-1 space-y-5">

                    {/* Basic Info */}
                    <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Basic Info</h3>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase">Address</label>
                            <input
                                type="text"
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-500"
                            />
                        </div>
                    </div>

                    {/* Contract */}
                    <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Contract</h3>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase">Contract Start</label>
                            <input
                                type="date"
                                value={contractStartDate}
                                onChange={e => setContractStartDate(e.target.value)}
                                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase">Renewal Type</label>
                            <select
                                value={contractRenewal}
                                onChange={e => setContractRenewal(e.target.value)}
                                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-500"
                            >
                                <option value="">None</option>
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                                <option value="six_months">Six Months</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>
                    </div>

                    {/* Rank & Progress */}
                    <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Rank &amp; Progress</h3>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase">Current Belt</label>
                            <select
                                value={currentBeltId}
                                onChange={e => setCurrentBeltId(e.target.value)}
                                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-500"
                            >
                                {belts.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="text-xs text-slate-500 font-bold uppercase">Stripes</label>
                                <select
                                    value={stripes}
                                    onChange={e => setStripes(parseInt(e.target.value))}
                                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-500"
                                >
                                    {[0, 1, 2, 3, 4].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-slate-500 font-bold uppercase">SWAT Team</label>
                                <button
                                    onClick={() => setIsSwatTeam(!isSwatTeam)}
                                    className={`w-full mt-1 h-[38px] rounded-lg text-xs font-bold transition-all border ${isSwatTeam ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
                                >
                                    {isSwatTeam ? 'MEMBER' : 'GENERAL'}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase">Next Belt Test</label>
                            <input
                                type="date"
                                value={nextTestDate}
                                onChange={e => setNextTestDate(e.target.value)}
                                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-500"
                            />
                        </div>
                    </div>

                    {/* Classes */}
                    <div className="glass-panel p-5 rounded-2xl border border-white/10">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">Classes</h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {allClasses.map((cls: any) => (
                                <label key={cls.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 rounded px-1 py-1">
                                    <input
                                        type="checkbox"
                                        checked={selectedClassIds.includes(cls.id)}
                                        onChange={e => {
                                            if (e.target.checked) {
                                                setSelectedClassIds(prev => [...prev, cls.id]);
                                            } else {
                                                setSelectedClassIds(prev => prev.filter(x => x !== cls.id));
                                            }
                                        }}
                                        className="rounded border-white/20 text-yellow-500 bg-slate-800"
                                    />
                                    <span className="text-sm text-gray-300">{cls.name} <span className="text-xs text-gray-500">({cls.days?.join(', ')} {cls.time})</span></span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="glass-panel p-5 rounded-2xl border border-white/10">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">Sensei Notes</h3>
                        <textarea
                            value={senseiNotes}
                            onChange={e => setSenseiNotes(e.target.value)}
                            rows={4}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-500 resize-none"
                            placeholder="Private notes about this student..."
                        />
                    </div>

                    {/* Save */}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`w-full py-3 rounded-xl font-bold text-sm shadow-xl transition-all active:scale-95 disabled:opacity-50 ${
                            saveStatus === 'saved'
                                ? 'bg-green-500 text-white shadow-green-500/20'
                                : saveStatus === 'error'
                                ? 'bg-red-500 text-white shadow-red-500/20'
                                : 'bg-yellow-500 hover:bg-yellow-400 text-gray-950 shadow-yellow-500/10'
                        }`}
                    >
                        {isSaving ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Save Failed — Try Again' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
