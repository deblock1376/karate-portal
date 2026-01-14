'use client';

import { useState } from 'react';
import { createClassAction, deleteClassAction, markAttendanceAction, assignStudentToClassAction, removeStudentFromClassAction } from '@/app/actions';
import { User } from '@/types';

interface ClassData {
    id: string;
    name: string;
    day: string;
    time: string;
    duration: number;
    students: any[];
}

interface ClassManagerProps {
    classes: ClassData[];
    allStudents: User[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ClassManager({ classes, allStudents }: ClassManagerProps) {
    const [name, setName] = useState('');
    const [day, setDay] = useState(DAYS[0]);
    const [time, setTime] = useState('18:00');
    const [duration, setDuration] = useState(60);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [attendanceLoading, setAttendanceLoading] = useState<Record<string, boolean>>({});
    const [checkedInState, setCheckedInState] = useState<Record<string, boolean>>({});
    const [showManageStudents, setShowManageStudents] = useState(false);
    const [searchRoster, setSearchRoster] = useState('');

    const handleAssign = async (cid: string, sid: string) => {
        try {
            await assignStudentToClassAction(cid, sid);
        } catch (error) {
            console.error(error);
        }
    };

    const handleUnassign = async (cid: string, sid: string) => {
        try {
            await removeStudentFromClassAction(cid, sid);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createClassAction(name, day, time, duration);
            setName('');
            setDay(DAYS[0]);
            setTime('18:00');
        } catch (error) {
            console.error(error);
            alert('Failed to create class');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This will remove all student assignments to this class.')) return;
        try {
            await deleteClassAction(id);
        } catch (error) {
            alert('Failed to delete class');
        }
    };

    const handleCheckIn = async (studentId: string) => {
        setAttendanceLoading(prev => ({ ...prev, [studentId]: true }));
        try {
            const result = await markAttendanceAction(studentId);
            if (result.success || result.message?.includes('already')) {
                setCheckedInState(prev => ({ ...prev, [studentId]: true }));
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Failed to check in', error);
        } finally {
            setAttendanceLoading(prev => ({ ...prev, [studentId]: false }));
        }
    };

    const selectedClass = classes.find(c => c.id === selectedClassId);

    const filteredStudents = allStudents.filter(s => 
        s.name.toLowerCase().includes(searchRoster.toLowerCase()) ||
        s.email.toLowerCase().includes(searchRoster.toLowerCase())
    );

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-white">
                <span>🗓️</span> Class Schedule
            </h2>

            {/* Create Form */}
            <form onSubmit={handleCreate} className="mb-8 grid grid-cols-1 md:grid-cols-5 gap-4 items-end bg-gray-700/50 p-4 rounded-lg">
                <div className="md:col-span-2">
                    <label className="block text-xs uppercase text-gray-400 font-bold mb-1">Class Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Beginners"
                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs uppercase text-gray-400 font-bold mb-1">Day</label>
                    <select
                        value={day}
                        onChange={e => setDay(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs uppercase text-gray-400 font-bold mb-1">Time</label>
                    <input
                        type="time"
                        value={time}
                        onChange={e => setTime(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded transition-all disabled:opacity-50 active:scale-95"
                >
                    {isSubmitting ? '...' : 'Add Class'}
                </button>
            </form>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* List of Classes */}
                <div className="space-y-4">
                    {classes.length === 0 && <p className="text-gray-500 text-center py-4">No classes scheduled yet.</p>}

                    {classes.map(cls => (
                        <div 
                            key={cls.id} 
                            className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border transition-all cursor-pointer ${
                                selectedClassId === cls.id 
                                ? 'bg-blue-600/10 border-blue-500/50 ring-1 ring-blue-500/50' 
                                : 'bg-gray-700 border-gray-600 hover:border-gray-500 group'
                            }`}
                            onClick={() => {
                                setSelectedClassId(cls.id === selectedClassId ? null : cls.id);
                                setShowManageStudents(false);
                            }}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-bold text-lg text-white">{cls.name}</h3>
                                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                                        {cls.students.length} Students
                                    </span>
                                </div>
                                <div className="text-sm text-gray-400 flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        {cls.day}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {cls.time}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 md:mt-0 flex items-center gap-3" onClick={e => e.stopPropagation()}>
                                <button
                                    onClick={() => {
                                        setSelectedClassId(cls.id === selectedClassId ? null : cls.id);
                                        setShowManageStudents(false);
                                    }}
                                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                                        selectedClassId === cls.id ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                    }`}
                                >
                                    {selectedClassId === cls.id ? 'Close Roster' : 'View Roster'}
                                </button>
                                <button
                                    onClick={() => handleDelete(cls.id)}
                                    className="text-gray-400 hover:text-red-400 transition-colors p-2"
                                    title="Delete Class"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Class Roster / Attendance View */}
                <div className="bg-gray-900/50 rounded-lg border border-gray-700 p-4 min-h-[400px]">
                    {selectedClass ? (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Roster: {selectedClass.name}</h3>
                                    <p className="text-xs text-blue-400 font-medium">{selectedClass.day}s at {selectedClass.time}</p>
                                </div>
                                <button 
                                    onClick={() => setShowManageStudents(!showManageStudents)}
                                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                                        showManageStudents ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {showManageStudents ? 'Back to Attendance' : 'Manage Students'}
                                </button>
                            </div>

                            {showManageStudents ? (
                                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="relative">
                                        <input 
                                            type="text"
                                            placeholder="Search students to add..."
                                            value={searchRoster}
                                            onChange={e => setSearchRoster(e.target.value)}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                                        />
                                        <svg className="w-4 h-4 absolute right-3 top-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </div>

                                    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                        {filteredStudents.map(student => {
                                            const isInClass = selectedClass.students.some((s: any) => s.id === student.id);
                                            return (
                                                <div key={student.id} className="flex items-center justify-between bg-gray-800/50 p-3 rounded border border-gray-700/50">
                                                    <div>
                                                        <p className="text-sm font-bold text-white leading-none mb-1">{student.name}</p>
                                                        <p className="text-[10px] text-gray-500">{student.email}</p>
                                                    </div>
                                                    {isInClass ? (
                                                        <button 
                                                            onClick={() => handleUnassign(selectedClass.id, student.id)}
                                                            className="text-red-400 hover:text-red-300 p-1 transition-colors"
                                                            title="Remove from class"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleAssign(selectedClass.id, student.id)}
                                                            className="text-green-400 hover:text-green-300 p-1 transition-colors"
                                                            title="Add to class"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end mb-4">
                                        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Today's Attendance</div>
                                        <div className="text-right">
                                            <span className="text-2xl font-bold text-white">
                                                {Object.values(checkedInState).filter(v => v).length} / {selectedClass.students.length}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                        {selectedClass.students.length === 0 ? (
                                            <p className="text-gray-500 text-center py-8 italic">No students assigned to this class.</p>
                                        ) : (
                                            selectedClass.students.map((student: any) => (
                                                <div key={student.id} className="flex items-center justify-between bg-gray-800 p-3 rounded border border-gray-700 group hover:border-gray-500 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 font-bold text-xs uppercase">
                                                            {student.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-white leading-none mb-1">{student.name}</p>
                                                            <p className="text-[10px] text-gray-500">{student.email}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    {checkedInState[student.id] ? (
                                                        <div className="flex items-center gap-1.5 text-green-400 font-bold text-[10px] uppercase bg-green-400/10 px-2 py-1 rounded">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                            Present
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleCheckIn(student.id)}
                                                            disabled={attendanceLoading[student.id]}
                                                            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-900 text-[10px] font-black uppercase rounded transition-all active:scale-90 disabled:opacity-50"
                                                        >
                                                            {attendanceLoading[student.id] ? "..." : "Check In"}
                                                        </button>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center py-12 text-gray-600 uppercase tracking-widest text-xs font-bold">
                            <svg className="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                            Select a class to view roster
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
