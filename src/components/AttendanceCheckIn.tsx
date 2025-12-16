'use client';

import { useState } from 'react';
import { User } from '@/types';
import { markAttendanceAction } from '@/app/actions';

interface AttendanceCheckInProps {
    students: User[];
}

export default function AttendanceCheckIn({ students }: AttendanceCheckInProps) {
    const [checkedInState, setCheckedInState] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

    const handleCheckIn = async (studentId: string) => {
        setIsLoading(prev => ({ ...prev, [studentId]: true }));
        try {
            const result = await markAttendanceAction(studentId);
            if (result.success) {
                setCheckedInState(prev => ({ ...prev, [studentId]: true }));
            } else {
                // Ideally show toast, but console for now if already checked in
                console.log(result.message);
                // Mark visually as checked in anyway if that's the error
                if (result.message?.includes('already checked in')) {
                    setCheckedInState(prev => ({ ...prev, [studentId]: true }));
                }
            }
        } catch (error) {
            console.error('Failed to check in', error);
        } finally {
            setIsLoading(prev => ({ ...prev, [studentId]: false }));
        }
    };

    return (
        <div className="glass-panel p-6 rounded-2xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span>📝</span> Class Check-in
            </h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="py-3 px-4 text-slate-400 font-medium">Student</th>
                            <th className="py-3 px-4 text-slate-400 font-medium">Belt</th>
                            <th className="py-3 px-4 text-right text-slate-400 font-medium">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {students.map((student) => (
                            <tr key={student.id} className="hover:bg-white/5 transition-colors">
                                <td className="py-3 px-4 text-white font-medium">
                                    {student.name}
                                    <div className="text-xs text-slate-500">{student.email}</div>
                                </td>
                                <td className="py-3 px-4 text-slate-300 capitalize">
                                    {student.currentBeltId.replace('-', ' ')}
                                </td>
                                <td className="py-3 px-4 text-right">
                                    {checkedInState[student.id] ? (
                                        <span className="inline-flex items-center gap-1 text-green-400 font-bold text-sm bg-green-400/10 px-3 py-1 rounded-full">
                                            ✓ Present
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleCheckIn(student.id)}
                                            disabled={isLoading[student.id]}
                                            className="px-4 py-1.5 bg-amber-500 text-slate-900 font-bold rounded-lg hover:bg-amber-400 transition-all disabled:opacity-50 text-sm"
                                        >
                                            {isLoading[student.id] ? "..." : "Check In"}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {students.length === 0 && (
                            <tr>
                                <td colSpan={3} className="py-8 text-center text-slate-500">
                                    No students found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
