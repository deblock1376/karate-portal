import React from 'react';
import { Belt } from '@/types';

interface ProgressBarProps {
    currentBelt: Belt;
    allBelts: Belt[];
}

export default function ProgressBar({ currentBelt, allBelts }: ProgressBarProps) {
    const currentIndex = allBelts.findIndex(b => b.id === currentBelt.id);
    const progress = ((currentIndex + 1) / allBelts.length) * 100;

    return (
        <div className="w-full bg-gray-700 rounded-full h-4 mb-6 relative overflow-hidden">
            <div
                className="bg-yellow-500 h-4 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
            ></div>
            <div className="absolute top-0 left-0 w-full h-full flex justify-between px-2 items-center text-xs font-bold text-gray-900 pointer-events-none">
                {allBelts.map((belt, index) => (
                    <div key={belt.id} className={`z-10 ${index <= currentIndex ? 'text-gray-900' : 'text-gray-400'}`}>
                        {index === currentIndex && '🥋'}
                    </div>
                ))}
            </div>
        </div>
    );
}
