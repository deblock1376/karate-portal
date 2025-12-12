import React from 'react';
import { Video } from '@/types';

interface VideoCardProps {
    video: Video;
    locked: boolean;
}

export default function VideoCard({ video, locked }: VideoCardProps) {
    return (
        <div className={`bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105 ${locked ? 'opacity-50 grayscale' : ''}`}>
            <div className="relative pb-[56.25%] bg-black">
                {locked ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl">🔒</span>
                    </div>
                ) : (
                    <iframe
                        className="absolute top-0 left-0 w-full h-full"
                        src={video.url}
                        title={video.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                )}
            </div>
            <div className="p-4">
                <h3 className="text-lg font-semibold text-white truncate">{video.title}</h3>
                <p className="text-sm text-gray-400 mt-1">
                    {locked ? 'Unlock this video by advancing your belt.' : 'Master this technique to advance.'}
                </p>
            </div>
        </div>
    );
}
