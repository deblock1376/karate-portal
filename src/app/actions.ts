'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

// --- User Actions ---

export async function loginUserAction(email: string) {
    const user = await prisma.user.findUnique({
        where: { email },
    })
    if (!user) return null
    // In a real app, check password here. For now, returning user.
    return user
}

export async function fetchUserAction(id: string) {
    return await prisma.user.findUnique({ where: { id } })
}

export async function fetchAllUsersAction(search?: string, beltId?: string) {
    const where: any = { role: 'student' }

    if (search) {
        where.OR = [
            { name: { contains: search } },
            { email: { contains: search } }
        ]
    }

    if (beltId && beltId !== 'all') {
        where.currentBeltId = beltId
    }

    return await prisma.user.findMany({ where })
}

export async function addUserAction(data: any) {
    const formattedData = {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        contractStartDate: data.contractStartDate ? new Date(data.contractStartDate) : undefined,
        role: 'student',
        currentBeltId: '11th-kyu', // Default
        password: data.password || undefined, // Store password if provided
    }
    const user = await prisma.user.create({
        data: formattedData
    })
    revalidatePath('/sensei')
    return user
}

export async function updateUserAction(id: string, data: any) {
    const formattedData = {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        contractStartDate: data.contractStartDate ? new Date(data.contractStartDate) : undefined,
    }
    const user = await prisma.user.update({
        where: { id },
        data: formattedData,
    })
    revalidatePath('/sensei')
    return user
}

export async function updateUserBeltAction(userId: string, newBeltId: string) {
    await prisma.user.update({
        where: { id: userId },
        data: { currentBeltId: newBeltId }
    })
    revalidatePath('/sensei')
}

// --- Belt Actions ---

export async function fetchBeltsAction() {
    return await prisma.belt.findMany({
        orderBy: { order: 'asc' }
    })
}

export async function addBeltAction(name: string, color: string, order: number) {
    const id = name.toLowerCase().replace(/\s+/g, '-')
    await prisma.belt.create({
        data: { id, name, color, order }
    })
    revalidatePath('/sensei')
}

export async function deleteBeltAction(id: string) {
    // Check for users
    const count = await prisma.user.count({ where: { currentBeltId: id } })
    if (count > 0) throw new Error('Cannot delete belt with active students')

    await prisma.belt.delete({ where: { id } })
    revalidatePath('/sensei')
}

// --- Event Actions ---

export async function fetchEventsAction() {
    return await prisma.event.findMany({
        orderBy: { date: 'asc' }
    })
}

export async function addEventAction(title: string, date: string, description: string) {
    await prisma.event.create({
        data: {
            title,
            date: new Date(date),
            description
        }
    })
    revalidatePath('/student')
    revalidatePath('/sensei')
}

export async function deleteEventAction(id: string) {
    await prisma.event.delete({ where: { id } })
    revalidatePath('/student')
    revalidatePath('/sensei')
}

// --- Video Actions ---

export async function fetchVideosByBeltAction(beltId: string) {
    return await prisma.video.findMany({
        where: { beltId }
    })
}

// --- Attendance Actions ---

export async function markAttendanceAction(userId: string, notes?: string) {
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
            notes
        }
    });

    revalidatePath('/sensei');
    return { success: true };
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
