'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { fetchBeltsAction, fetchVideosByBeltAction, fetchEventsAction, fetchUserAttendanceStatsAction, markAttendanceAction, checkTodayAttendanceAction, fetchStudentClassesAction, fetchUserAttendanceHistoryAction } from '@/app/actions';
import { Belt, Video, DojoEvent } from '@/types';
import ProgressBar from '@/components/ProgressBar';
import VideoCard from '@/components/VideoCard';
import CalendarView from '@/components/CalendarView';
import ProfileSwitcher from '@/components/ProfileSwitcher';

interface VideoWithBelt extends Video {
    beltOrder: number;
}

export default function StudentDashboard() {
    const { user, activeProfile, isLoading, logout } = useAuth();
    const subject = activeProfile || user;
    console.log('[StudentDashboard] Component Rendered. User:', user ? user.id : 'N/A', 'Active Profile:', subject ? subject.id : 'N/A', 'isLoading:', isLoading);
    const router = useRouter();
    const [currentBelt, setCurrentBelt] = useState<Belt | undefined>(undefined);
    const [allBelts, setAllBelts] = useState<Belt[]>([]);
    const [events, setEvents] = useState<DojoEvent[]>([]);
    const [videos, setVideos] = useState<VideoWithBelt[]>([]);
    const [attendanceCount, setAttendanceCount] = useState(0);
    const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [myClasses, setMyClasses] = useState<any[]>([]);

    const loadData = useCallback(async () => {
        if (!subject) return;

        const [loadedBelts, loadedEvents, stats, checkedInStatus, loadedClasses, history] = await Promise.all([
            fetchBeltsAction(),
            fetchEventsAction(),
            fetchUserAttendanceStatsAction(subject.id),
            checkTodayAttendanceAction(subject.id),
            fetchStudentClassesAction(subject.id),
            fetchUserAttendanceHistoryAction(subject.id)
        ]);

        setAllBelts(loadedBelts);
        setEvents(loadedEvents as DojoEvent[]);
        setAttendanceCount(stats.total);
        setAttendanceHistory(history);
        setIsCheckedIn(checkedInStatus);
        setMyClasses(loadedClasses);

        const userBelt = loadedBelts.find(b => b.id === subject.currentBeltId);
        setCurrentBelt(userBelt);

        // Load all videos (inefficient but simple for now)
        const allVideos: VideoWithBelt[] = [];
        for (const belt of loadedBelts) {
            const beltVideos = await fetchVideosByBeltAction(belt.id);
            allVideos.push(...beltVideos.map(v => ({ ...v, beltOrder: belt.order })));
        }
        setVideos(allVideos);

    }, [subject]);

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
        if (!subject) return;
        setIsCheckingIn(true);
        try {
            const result = await markAttendanceAction(subject.id);
            if (result.success) {
                setIsCheckedIn(true);
                setAttendanceCount(prev => prev + 1);
                // Refresh history
                const updatedHistory = await fetchUserAttendanceHistoryAction(subject.id);
                setAttendanceHistory(updatedHistory);
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
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-yellow-500">Welcome, {user.name} <span className="text-xs text-gray-600">(v2.0)</span></h1>
                        {(user as any).isSwatTeam && (
                            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse">SWAT</span>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                        <p className="text-gray-400">Current Rank: <span className="text-white font-semibold">{currentBelt.name} Belt</span></p>
                        {(user.stripes ?? 0) > 0 && (
                            <div className="flex gap-1 ml-1 items-center">
                                {[...Array(user.stripes)].map((_, i) => (
                                    <div key={i} className="w-1.5 h-4 bg-yellow-500 rounded-full" title={`${user.stripes} Stripes`}></div>
                                ))}
                            </div>
                        )}
                        <span className="hidden md:inline text-gray-600">|</span>
                        {(user as any).nextTestDate && (
                            <p className="text-amber-500 font-bold text-sm uppercase tracking-wider">
                                🥋 Next Belt Test: {new Date((user as any).nextTestDate).toLocaleDateString()}
                            </p>
                        )}
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
                        <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                            <span>📊</span> Your Progress
                        </h2>
                        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 space-y-6">
                            <ProgressBar currentBelt={currentBelt} allBelts={allBelts} />

                            <div className="pt-4 border-t border-gray-700">
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Stripe Progress</h3>
                                        <p className="text-xs text-gray-500">Master four stripes to qualify for your next belt test.</p>
                                    </div>
                                    <div className="text-2xl font-black text-white">{user.stripes || 0} / 4</div>
                                </div>
                                <div className="flex gap-4">
                                    {[1, 2, 3, 4].map(s => (
                                        <div
                                            key={s}
                                            className={`flex-1 h-8 rounded-md flex items-center justify-center font-bold text-lg transition-all ${(user.stripes || 0) >= s
                                                ? 'bg-yellow-500 text-gray-900 shadow-lg shadow-yellow-500/20 scale-105'
                                                : 'bg-gray-700 text-gray-500 opacity-30 border border-gray-600'
                                                }`}
                                        >
                                            {(user.stripes || 0) >= s ? '★' : s}
                                            {(subject.stripes || 0) >= s ? '★' : s}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {(subject as any).nextTestDate && (
                                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-amber-500/20">
                                            📅
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-amber-500">Upcoming Promotion Test</h3>
                                            <p className="text-sm text-gray-400">Prepare your forms and techniques!</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-white">{new Date((subject as any).nextTestDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</div>
                                        <div className="text-xs font-bold text-gray-500 uppercase">{new Date((subject as any).nextTestDate).getFullYear()}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                    <section className="mb-8 p-4 border border-white/5 rounded-xl">
                        <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                            <span>🗓️</span> Attendance & Schedule
                        </h2>
                        <CalendarView
                            attendance={attendanceHistory}
                            scheduledClasses={myClasses}
                        />
                    </section>

                    <section className="space-y-8">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <span>🎥</span> Training Library
                        </h2>

                        {allBelts.sort((a, b) => a.order - b.order).map(belt => {
                            const beltVideos = videos.filter(v => v.beltId === belt.id);
                            if (beltVideos.length === 0) return null;

                            const isLocked = belt.order > currentBelt.order;
                            const isCurrent = belt.id === currentBelt.id;

                            return (
                                <div key={belt.id} className={`space-y-4 ${isLocked ? 'opacity-75' : ''}`}>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: belt.color }}></div>
                                        {belt.name} {isCurrent && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded ml-2">Current Rank</span>}
                                        {isLocked && <span className="ml-auto text-[10px]">🔒 Locked</span>}
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {beltVideos.map((video) => (
                                            <VideoCard
                                                key={video.id}
                                                video={video}
                                                locked={isLocked}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
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
                                            <span>{cls.days?.join(', ')}</span>
                                            <span>{cls.time} - {(() => {
                                                const [h, m] = cls.time.split(':').map(Number);
                                                const end = new Date();
                                                end.setHours(h, m + cls.duration);
                                                return end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                                            })()}</span>
                                        </div>
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
                                        {event.date ? new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'No date set'}
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
