'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { fetchClassesAction, fetchAllUsersAction } from '@/app/actions';
import ClassManager from '@/components/ClassManager';
import Link from 'next/link';

export default function ClassesManagementPage() {
    const { user: currentUser, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [classes, setClasses] = useState<any[]>([]);
    const [allStudents, setAllStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const [loadedClasses, loadedUsers] = await Promise.all([
                fetchClassesAction(),
                fetchAllUsersAction()
            ]);
            setClasses(loadedClasses);
            setAllStudents(loadedUsers.filter((u: any) => u.role === 'student'));
        } catch (error) {
            console.error('Failed to load classes data', error);
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
        return <div className="min-h-screen flex items-center justify-center text-white bg-gray-900">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <Link href="/sensei" className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </Link>
                        <h1 className="text-3xl font-bold text-yellow-500">Class Management</h1>
                    </div>
                    <p className="text-gray-400 ml-12">Manage your dojo's schedule and rosters</p>
                </div>
            </header>

            <div className="max-w-6xl mx-auto">
                <ClassManager classes={classes} allStudents={allStudents} onRefresh={loadData} />
            </div>
        </div>
    );
}
