'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { fetchBeltsAction, fetchVideosByBeltAction, addVideoAction, deleteVideoAction } from '@/app/actions';
import Link from 'next/link';

export default function SenseiVideoManagement() {
    const { user: currentUser, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [belts, setBelts] = useState<any[]>([]);
    const [videosByBelt, setVideosByBelt] = useState<Record<string, any[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [selectedBeltId, setSelectedBeltId] = useState('');

    const loadData = useCallback(async () => {
        try {
            const loadedBelts = await fetchBeltsAction();
            setBelts(loadedBelts);
            if (loadedBelts.length > 0 && !selectedBeltId) {
                setSelectedBeltId(loadedBelts[0].id);
            }

            const videoGroups: Record<string, any[]> = {};
            await Promise.all(loadedBelts.map(async (belt) => {
                const videos = await fetchVideosByBeltAction(belt.id);
                videoGroups[belt.id] = videos;
            }));
            setVideosByBelt(videoGroups);
        } catch (error) {
            console.error('Failed to load video data', error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedBeltId]);

    useEffect(() => {
        if (!authLoading) {
            if (!currentUser || currentUser.role !== 'sensei') {
                router.push('/login');
            } else {
                loadData();
            }
        }
    }, [currentUser, authLoading, router, loadData]);

    const handleAddVideo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !url || !selectedBeltId) return;

        // Basic URL normalization for YouTube (simplified)
        let normalizedUrl = url;
        if (url.includes('youtube.com/watch?v=')) {
            normalizedUrl = url.replace('watch?v=', 'embed/');
        } else if (url.includes('youtu.be/')) {
            normalizedUrl = url.replace('youtu.be/', 'youtube.com/embed/');
        }

        setIsSubmitting(true);
        try {
            await addVideoAction(title, normalizedUrl, selectedBeltId);
            setTitle('');
            setUrl('');
            loadData();
        } catch (error) {
            alert('Failed to add video');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteVideo = async (id: string) => {
        if (!confirm('Are you sure you want to delete this video?')) return;
        try {
            await deleteVideoAction(id);
            loadData();
        } catch (error) {
            alert('Failed to delete video');
        }
    };

    if (isLoading || authLoading) {
        return <div className="min-h-screen flex items-center justify-center text-white bg-gray-900">Loading Video Manager...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <header className="mb-8">
                <div className="flex items-center gap-4 mb-2">
                    <Link href="/sensei" className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </Link>
                    <h1 className="text-3xl font-bold text-yellow-500">Video Management</h1>
                </div>
                <p className="text-gray-400 ml-12">Curate training content for your students</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {/* Add Video Form */}
                <div className="lg:col-span-1">
                    <section className="glass-panel p-6 rounded-2xl border border-white/10 sticky top-8">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <span>➕</span> Add New Video
                        </h2>
                        <form onSubmit={handleAddVideo} className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase text-gray-400 font-bold mb-1">Video Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="e.g. Basic Front Kick"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-gray-400 font-bold mb-1">YouTube/Vimeo URL</label>
                                <input
                                    type="url"
                                    value={url}
                                    onChange={e => setUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-gray-400 font-bold mb-1">Assign to Belt</label>
                                <select
                                    value={selectedBeltId}
                                    onChange={e => setSelectedBeltId(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                                    required
                                >
                                    {belts.map(belt => (
                                        <option key={belt.id} value={belt.id}>{belt.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-yellow-900/20"
                            >
                                {isSubmitting ? 'Adding...' : 'Add Video to Library'}
                            </button>
                        </form>
                    </section>
                </div>

                {/* Video List */}
                <div className="lg:col-span-2 space-y-8">
                    {belts.map(belt => {
                        const beltVideos = videosByBelt[belt.id] || [];
                        return (
                            <section key={belt.id} className="glass-panel p-6 rounded-2xl border border-white/10">
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: belt.color }}></div>
                                    {belt.name}
                                    <span className="text-xs bg-white/5 text-gray-400 px-2 py-1 rounded-full text-normal">
                                        {beltVideos.length} Videos
                                    </span>
                                </h2>

                                {beltVideos.length === 0 ? (
                                    <p className="text-gray-500 italic text-sm py-4 border-2 border-dashed border-white/5 rounded-xl text-center">
                                        No videos uploaded for this rank.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {beltVideos.map(video => (
                                            <div key={video.id} className="bg-gray-800/50 border border-white/5 rounded-xl overflow-hidden group">
                                                <div className="aspect-video bg-black relative">
                                                    <iframe
                                                        className="absolute inset-0 w-full h-full"
                                                        src={video.url}
                                                        title={video.title}
                                                        frameBorder="0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                    ></iframe>
                                                </div>
                                                <div className="p-3 flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-bold text-sm text-white">{video.title}</h3>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteVideo(video.id)}
                                                        className="text-gray-500 hover:text-red-400 transition-colors p-1"
                                                        title="Delete Video"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
