'use client';

import { useState } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    getDay,
    parseISO
} from 'date-fns';
import Link from 'next/link';

interface CalendarViewProps {
    attendance: any[];
    scheduledClasses: any[];
    classLinkPrefix?: string;
}

export default function CalendarView({ attendance = [], scheduledClasses = [], classLinkPrefix }: CalendarViewProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>📅</span> {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={prevMonth}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return (
            <div className="grid grid-cols-7 mb-2">
                {days.map((day, index) => (
                    <div key={index} className="text-center text-xs font-bold uppercase text-slate-500 tracking-wider">
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = '';

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, 'd');
                const cloneDay = day;

                // Check if this day has a scheduled class
                const dayName = format(day, 'EEEE');
                const classesToday = scheduledClasses.filter(c => c.days?.includes(dayName));

                // Check if student attended on this day
                const hasAttended = attendance.some(a => isSameDay(new Date(a.date), cloneDay));

                days.push(
                    <div
                        key={day.toString()}
                        className={`min-h-[80px] p-2 border border-white/5 flex flex-col gap-1 transition-colors ${!isSameMonth(day, monthStart) ? 'bg-white/[0.02] text-slate-700' : 'text-slate-300'
                            } ${isSameDay(day, new Date()) ? 'bg-amber-500/5 ring-1 ring-inset ring-amber-500/20' : ''}`}
                    >
                        <span className={`text-xs font-medium ${isSameDay(day, new Date()) ? 'text-amber-500 font-bold' : ''}`}>
                            {formattedDate}
                        </span>

                        <div className="flex flex-col gap-1">
                            {classesToday.map(cls => {
                                const content = (
                                    <div key={cls.id} className={`text-[10px] p-1 rounded leading-tight border transition-colors ${classLinkPrefix ? 'hover:bg-blue-500/20' : ''} bg-blue-500/10 text-blue-400 border-blue-500/10`}>
                                        {cls.name}
                                    </div>
                                );

                                if (classLinkPrefix) {
                                    return (
                                        <Link key={cls.id} href={`${classLinkPrefix}/${cls.id}`}>
                                            {content}
                                        </Link>
                                    );
                                }
                                return content;
                            })}

                            {hasAttended && (
                                <div className="text-[10px] bg-green-500/20 text-green-400 p-1 rounded leading-tight border border-green-500/20 flex items-center gap-1 font-bold">
                                    <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    Attended
                                </div>
                            )}
                        </div>
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="grid grid-cols-7" key={day.toString()}>
                    {days}
                </div>
            );
            days = [];
        }

        return <div className="rounded-xl overflow-hidden border border-white/10">{rows}</div>;
    };

    return (
        <div className="glass-panel p-6 rounded-2xl">
            {renderHeader()}
            {renderDays()}
            {renderCells()}

            <div className="mt-6 flex flex-wrap gap-4 text-xs font-medium text-slate-400">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-blue-500/10 border border-blue-500/20"></span>
                    Scheduled Class
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-green-500/20 border border-green-500/20 flex items-center justify-center">
                        <svg className="w-2 h-2 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </span>
                    Actual Attendance
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-amber-500/5 ring-1 ring-inset ring-amber-500/20"></span>
                    Today
                </div>
            </div>
        </div>
    );
}
