'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { fetchAllUsersAction, fetchBeltsAction } from '@/app/actions';
import { User, Belt } from '@/types';
import Link from 'next/link';
import CsvImportModal from '@/components/CsvImportModal';

export default function StudentRoster() {
    const { user: currentUser, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [students, setStudents] = useState<User[]>([]);
    const [belts, setBelts] = useState<Belt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterBelt, setFilterBelt] = useState('all');
    const [filterSwat, setFilterSwat] = useState('all');
    const [showImport, setShowImport] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [loadedStudents, loadedBelts] = await Promise.all([
                fetchAllUsersAction(searchQuery, filterBelt),
                fetchBeltsAction()
            ]);

            let mappedStudents: User[] = loadedStudents.map(s => ({
                ...s,
                name: s.name || '',
                email: s.email || '',
                role: s.role as any,
                contractRenewal: (s.contractRenewal as any) || undefined,
                senseiNotes: s.senseiNotes || undefined,
                address: s.address || undefined,
                signedContract: s.signedContract || undefined,
                password: s.password || undefined,
                stripes: (s as any).stripes,
                isSwatTeam: (s as any).isSwatTeam,
            }));

            if (filterSwat === 'swat') {
                mappedStudents = mappedStudents.filter(s => s.isSwatTeam);
            } else if (filterSwat === 'non-swat') {
                mappedStudents = mappedStudents.filter(s => !s.isSwatTeam);
            }

            setStudents(mappedStudents);
            setBelts(loadedBelts);
        } catch (error) {
            console.error('Failed to load roster', error);
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, filterBelt, filterSwat]);

    useEffect(() => {
        if (!authLoading) {
            if (!currentUser || currentUser.role !== 'sensei') {
                router.push('/login');
            } else {
                loadData();
            }
        }
    }, [currentUser, authLoading, router, loadData]);

    if (authLoading) return <div className="min-h-screen flex items-center justify-center text-white bg-gray-900">Authenticating...</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
            {showImport && (
                <CsvImportModal
                    onClose={() => setShowImport(false)}
                    onImported={() => { loadData(); }}
                />
            )}

            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <Link href="/sensei" className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </Link>
                        <h1 className="text-3xl font-bold text-yellow-500">Student Roster</h1>
                    </div>
                    <p className="text-gray-400 ml-12">Manage student profiles, belts, and stripes</p>
                </div>

                <div className="flex flex-wrap gap-2 md:gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full md:w-64 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                    </div>
                    <select
                        value={filterBelt}
                        onChange={(e) => setFilterBelt(e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                        <option value="all">All Belts</option>
                        {belts.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <select
                        value={filterSwat}
                        onChange={(e) => setFilterSwat(e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                        <option value="all">All Students</option>
                        <option value="swat">SWAT Team</option>
                        <option value="non-swat">General Students</option>
                    </select>
                    <button
                        onClick={() => setShowImport(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-lg text-sm font-medium transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Import CSV
                    </button>
                </div>
            </header>

            <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 shadow-xl">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-750/50 border-b border-gray-700">
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">Student</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">Rank & Progress</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">Specialty</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {isLoading && students.length === 0 ? (
                            <tr><td colSpan={4} className="p-12 text-center text-gray-500 italic">Finding practitioners...</td></tr>
                        ) : students.length === 0 ? (
                            <tr><td colSpan={4} className="p-12 text-center text-gray-500 italic">No students found matching your filters.</td></tr>
                        ) : (
                            students.map(student => (
                                <tr key={student.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-xl shadow-inner font-bold text-gray-300">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white group-hover:text-yellow-500 transition-colors">{student.name}</p>
                                                <p className="text-xs text-gray-500">{student.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-900 border border-gray-700 text-gray-300">
                                                    {belts.find(b => b.id === student.currentBeltId)?.name}
                                                </span>
                                                {student.stripes ? (
                                                    <div className="flex gap-1">
                                                        {[...Array(student.stripes)].map((_, i) => (
                                                            <div key={i} className="w-1 h-3 bg-yellow-500 rounded-full shadow-[0_0_5px_rgba(234,179,8,0.5)]"></div>
                                                        ))}
                                                    </div>
                                                ) : null}
                                            </div>
                                            {student.nextTestDate && (
                                                <p className="text-[10px] text-amber-500 font-bold uppercase">
                                                    Test: {new Date(student.nextTestDate).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {student.isSwatTeam && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                                                SWAT Team
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <Link
                                            href={`/sensei/students/${student.id}`}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-950 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-lg shadow-yellow-500/10"
                                        >
                                            Manage Profile
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
