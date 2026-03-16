'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';

export default function ProfileSwitcher() {
    const { user, activeProfile, linkedStudents, switchProfile } = useAuth();

    if (!user || (linkedStudents.length === 0 && user.role !== 'sensei')) return null;

    // For Sensei, they might not have linked students in the "Guardian" sense, 
    // but we might want them to be able to switch to any student for debugging? 
    // No, the requirement is specifically for parents and student accounts.

    if (linkedStudents.length === 0) return null;

    return (
        <div className="flex items-center space-x-2 bg-gray-900/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
            <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Profile:</span>
            <select
                value={activeProfile?.id || user.id}
                onChange={(e) => switchProfile(e.target.value)}
                className="bg-transparent text-white text-sm font-semibold focus:outline-none cursor-pointer hover:text-blue-400 transition-colors"
            >
                <option value={user.id} className="bg-gray-900">{user.name} (Me)</option>
                {linkedStudents.map((student) => (
                    <option key={student.id} value={student.id} className="bg-gray-900">
                        {student.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
