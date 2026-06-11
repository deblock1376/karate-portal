'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'

export async function markAttendanceAction(userId: string, notes?: string) {
    const session = await auth();
    if (!session || !session.user) {
        return { success: false, message: 'Unauthorized' };
    }

    // Security: Only Sensei OR the user themselves can mark attendance
    const userRole = (session.user as any).role;
    const userIdFromSession = (session.user as any).id;

    if (userRole !== 'sensei' && userIdFromSession !== userId) {
        return { success: false, message: 'Unauthorized: Cannot check in for others.' };
    }

    // Check if already checked in today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await prisma.attendance.findFirst({
        where: {
            userId,
            date: {
                gte: startOfDay,
                lte: endOfDay
            }
        }
    });

    if (existing) {
        return { success: false, message: 'Student already checked in today.' };
    }

    await prisma.attendance.create({
        data: {
            userId,
            notes: notes || (session.user.role === 'student' ? 'Self Check-in' : undefined)
        }
    });

    revalidatePath('/sensei');
    revalidatePath('/student');
    return { success: true };
}

export async function checkTodayAttendanceAction(userId: string) {
    const session = await auth();
    if (!session || !session.user) return false;

    // Only allow checking own attendance or if sensei
    if (session.user.role !== 'sensei' && session.user.id !== userId) {
        return false;
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const count = await prisma.attendance.count({
        where: {
            userId,
            date: {
                gte: startOfDay,
                lte: endOfDay
            }
        }
    });
    return count > 0;
}

export async function fetchUserAttendanceStatsAction(userId: string) {
    const total = await prisma.attendance.count({
        where: { userId }
    });
    return { total };
}

export async function fetchRecentAttendanceAction() {
    // Get check-ins from the last 24 hours (or just today)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return await prisma.attendance.findMany({
        where: {
            date: { gte: startOfDay }
        },
        include: { user: true },
        orderBy: { date: 'desc' }
    });
}

export async function fetchUserAttendanceHistoryAction(userId: string) {
    const session = await auth();
    if (!session || !session.user) return [];

    // Only allow fetching own attendance or if sensei
    if (session.user.role !== 'sensei' && session.user.id !== userId) {
        return [];
    }

    return await prisma.attendance.findMany({
        where: { userId },
        orderBy: { date: 'desc' }
    });
}

export async function markAttendanceForDateAction(userId: string, dateStr: string, notes?: string) {
    const session = await auth();
    if (session?.user?.role !== 'sensei') {
        return { success: false, message: 'Unauthorized' };
    }

    const date = new Date(dateStr);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await prisma.attendance.findFirst({
        where: {
            userId,
            date: { gte: startOfDay, lte: endOfDay }
        }
    });

    if (existing) {
        return { success: false, message: 'Already checked in for this date.' };
    }

    // Set the attendance timestamp to noon on the selected date
    const attendanceDate = new Date(date);
    attendanceDate.setHours(12, 0, 0, 0);

    await prisma.attendance.create({
        data: {
            userId,
            date: attendanceDate,
            notes: notes || 'Retroactive check-in'
        }
    });

    revalidatePath('/sensei');
    revalidatePath('/student');
    return { success: true };
}

export async function removeAttendanceForDateAction(userId: string, dateStr: string) {
    const session = await auth();
    if (session?.user?.role !== 'sensei') {
        return { success: false, message: 'Unauthorized' };
    }

    const date = new Date(dateStr);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    await prisma.attendance.deleteMany({
        where: {
            userId,
            date: { gte: startOfDay, lte: endOfDay }
        }
    });

    revalidatePath('/sensei');
    revalidatePath('/student');
    return { success: true };
}
