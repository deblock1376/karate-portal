'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { fetchBeltsAction, fetchVideosByBeltAction, fetchEventsAction, fetchUserAttendanceStatsAction, markAttendanceAction, checkTodayAttendanceAction, fetchStudentClassesAction } from '@/app/actions';
import { Belt, Video, DojoEvent } from '@/types';
import ProgressBar from '@/components/ProgressBar';
import VideoCard from '@/components/VideoCard';

interface VideoWithBelt extends Video {
    beltOrder: number;
}

export default function StudentDashboard() {
    const { user, isLoading, logout } = useAuth();
    const router = useRouter();
    const [currentBelt, setCurrentBelt] = useState<Belt | undefined>(undefined);
    const [allBelts, setAllBelts] = useState<Belt[]>([]);
    const [events, setEvents] = useState<DojoEvent[]>([]);
    const [videos, setVideos] = useState<VideoWithBelt[]>([]);
    const [attendanceCount, setAttendanceCount] = useState(0);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [myClasses, setMyClasses] = useState<any[]>([]);

    const loadData = useCallback(async () => {
        if (!user) return;

        const [loadedBelts, loadedEvents, stats, checkedInStatus, loadedClasses] = await Promise.all([
            fetchBeltsAction(),
            fetchEventsAction(),
            fetchUserAttendanceStatsAction(user.id),
            checkTodayAttendanceAction(user.id),
            fetchStudentClassesAction(user.id)
        ]);

        setAllBelts(loadedBelts);
        setEvents(loadedEvents.map(e => ({ ...e, date: e.date.toISOString() })));
        setAttendanceCount(stats.total);
        setIsCheckedIn(checkedInStatus);
        setMyClasses(loadedClasses);

        const userBelt = loadedBelts.find(b => b.id === user.currentBeltId);
        setCurrentBelt(userBelt);

        // Load all videos (inefficient but simple for now)
        const allVideos: VideoWithBelt[] = [];
        for (const belt of loadedBelts) {
            const beltVideos = await fetchVideosByBeltAction(belt.id);
            allVideos.push(...beltVideos.map(v => ({ ...v, beltOrder: belt.order })));
        }
        setVideos(allVideos);

    }, [user]);

    useEffect(() => {
        if (!isLoading) {
            if (!user || user.role !== 'student') {
                router.push('/login');
            } else {
                loadData();
            }
        }
    }, [user, isLoading, router, loadData]);

    const handleCheckIn = async () => {
        if (!user) return;
        setIsCheckingIn(true);
        try {
            const result = await markAttendanceAction(user.id);
            if (result.success) {
                setIsCheckedIn(true);
                setAttendanceCount(prev => prev + 1);
            } else {
                console.log(result.message);
                if (result.message?.includes('already checked in')) {
                    setIsCheckedIn(true);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsCheckingIn(false);
        }
    };

    if (isLoading || !user || !currentBelt) {
        return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
            <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-yellow-500">Welcome, {user.name} <span className="text-xs text-gray-600">(v2.0)</span></h1>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                        <p className="text-gray-400">Current Rank: <span className="text-white font-semibold">{currentBelt.name} Belt</span></p>
                        <span className="hidden md:inline text-gray-600">|</span>
                        <p className="text-gray-400">Classes Attended: <span className="text-green-400 font-bold">{attendanceCount}</span></p>

                        {/* Check In Button */}
                        <div className="ml-2">
                            {isCheckedIn ? (
                                <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-400 px-3 py-1.5 rounded-full text-sm font-semibold border border-green-500/20">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Checked In Today
                                </span>
                            ) : (
                                <button
                                    onClick={handleCheckIn}
                                    disabled={isCheckingIn}
                                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500 text-gray-900 rounded-full text-sm font-bold hover:bg-amber-400 transition-colors disabled:opacity-50 shadow-lg shadow-amber-500/20"
                                >
                                    {isCheckingIn ? '...' : 'Check In to Class'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors"
                >
                    Sign Out
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">Your Progress</h2>
                        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                            <ProgressBar currentBelt={currentBelt} allBelts={allBelts} />
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-6">Training Videos</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {videos.map((video) => {
                                const isLocked = video.beltOrder > currentBelt.order;
                                return (
                                    <VideoCard
                                        key={video.id}
                                        video={video}
                                        locked={isLocked}
                                    />
                                );
                            })}
                        </div>
                    </section>
                </div>

                <div className="lg:col-span-1 space-y-8">
                    <section>
                        <h2 className="text-xl font-semibold mb-6">My Class Schedule</h2>
                        <div className="space-y-4">
                            {myClasses.length === 0 && (
                                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center text-gray-500">
                                    No assigned classes.
                                </div>
                            )}
                            {myClasses.map((cls) => (
                                <div key={cls.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-md flex justify-between items-center group hover:border-blue-500 transition-colors">
                                    <div>
                                        <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">{cls.name}</h3>
                                        <div className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                                            <span>{cls.day}s</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                                            <span>{cls.time}</span>
                                        </div>
                                    </div>
                                    <div className="text-xs font-mono bg-gray-700 px-2 py-1 rounded text-gray-300">
                                        {cls.duration} min
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-6">Upcoming Events</h2>
                        <div className="space-y-4">
                            {events.map((event) => (
                                <div key={event.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-md hover:border-purple-500 transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                        <h3 className="font-bold text-lg text-white">{event.title}</h3>
                                    </div>
                                    <div className="text-sm text-purple-400 mb-2 font-medium">
                                        {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </div>
                                    <p className="text-gray-400 text-sm leading-relaxed">{event.description}</p>
                                </div>
                            ))}
                            {events.length === 0 && (
                                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center text-gray-500">
                                    No upcoming events.
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div >
        </div >
    );
}
