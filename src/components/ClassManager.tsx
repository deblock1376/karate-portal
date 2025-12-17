'use client';

import { useState } from 'react';
import { createClassAction, deleteClassAction } from '@/app/actions';

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
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ClassManager({ classes }: ClassManagerProps) {
    const [name, setName] = useState('');
    const [day, setDay] = useState(DAYS[0]);
    const [time, setTime] = useState('18:00');
    const [duration, setDuration] = useState(60);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs uppercase text-gray-400 font-bold mb-1">Day</label>
                    <select
                        value={day}
                        onChange={e => setDay(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:ring-2 focus:ring-blue-500"
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
                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
                >
                    {isSubmitting ? '...' : 'Add Class'}
                </button>
            </form>

            {/* List */}
            <div className="space-y-4">
                {classes.length === 0 && <p className="text-gray-500 text-center py-4">No classes scheduled yet.</p>}

                {classes.map(cls => (
                    <div key={cls.id} className="flex flex-col md:flex-row md:items-center justify-between bg-gray-700 p-4 rounded-lg border border-gray-600 group">
                        <div>
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
                                    {cls.time} ({cls.duration} min)
                                </span>
                            </div>
                        </div>
                        <div className="mt-4 md:mt-0 flex items-center gap-3">
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
        </div>
    );
}
