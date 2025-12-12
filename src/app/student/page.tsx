'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getBelts, getUserById, getVideosByBelt, getEvents } from '@/lib/data';
import { Belt, Video, DojoEvent } from '@/types';
import ProgressBar from '@/components/ProgressBar';
import VideoCard from '@/components/VideoCard';

export default function StudentDashboard() {
    const { user, isLoading, logout } = useAuth();
    const router = useRouter();
    const [currentBelt, setCurrentBelt] = useState<Belt | undefined>(undefined);
    const [allBelts, setAllBelts] = useState<Belt[]>([]);
    const [events, setEvents] = useState<DojoEvent[]>([]);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== 'student')) {
            router.push('/login');
        } else if (user) {
            const belts = getBelts();
            setAllBelts(belts);
            const userBelt = belts.find(b => b.id === user.currentBeltId);
            setCurrentBelt(userBelt);

            setEvents(getEvents());
        }
    }, [user, isLoading, router]);

    if (isLoading || !user || !currentBelt) {
        return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-yellow-500">Welcome, {user.name}</h1>
                    <p className="text-gray-400">Current Rank: <span className="text-white font-semibold">{currentBelt.name} Belt</span></p>
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
                            {allBelts.map((belt) => {
                                const beltVideos = getVideosByBelt(belt.id);
                                if (beltVideos.length === 0) return null;

                                const isLocked = belt.order > currentBelt.order;

                                return beltVideos.map((video) => (
                                    <VideoCard
                                        key={video.id}
                                        video={video}
                                        locked={isLocked}
                                    />
                                ));
                            })}
                        </div>
                    </section>
                </div>

                <div className="lg:col-span-1">
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
