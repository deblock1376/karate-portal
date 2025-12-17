'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'

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

    return await prisma.user.findMany({
        where,
        include: {
            classes: true
        }
    })
}

export async function addUserAction(data: any) {
    const { classIds, ...userData } = data;

    const formattedData = {
        ...userData,
        startDate: userData.startDate ? new Date(userData.startDate) : undefined,
        contractStartDate: userData.contractStartDate ? new Date(userData.contractStartDate) : undefined,
        role: 'student',
        currentBeltId: '11th-kyu', // Default
        password: userData.password ? await bcrypt.hash(userData.password, 10) : undefined,
        classes: classIds ? {
            connect: classIds.map((id: string) => ({ id }))
        } : undefined
    }
    const user = await prisma.user.create({
        data: formattedData
    })
    revalidatePath('/sensei')
    revalidatePath('/student') // Revalidate student dashboard too as they might check schedule
    return user
}

export async function updateUserAction(id: string, data: any) {
    const { classIds, ...userData } = data;

    const formattedData = {
        ...userData,
        startDate: userData.startDate ? new Date(userData.startDate) : undefined,
        contractStartDate: userData.contractStartDate ? new Date(userData.contractStartDate) : undefined,
        password: userData.password ? await bcrypt.hash(userData.password, 10) : undefined,
        classes: classIds ? {
            set: classIds.map((cid: string) => ({ id: cid }))
        } : undefined
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

// --- Class Actions ---

export async function fetchClassesAction() {
    return await prisma.class.findMany({
        orderBy: [
            { day: 'asc' }, // Needs custom sort for days if string, but simple for now
            { time: 'asc' }
        ],
        include: {
            students: {
                select: { id: true, name: true, email: true }
            }
        }
    });
}

export async function createClassAction(name: string, day: string, time: string, duration: number = 60) {
    const session = await auth();
    if (session?.user?.role !== 'sensei') {
        throw new Error('Unauthorized');
    }

    await prisma.class.create({
        data: { name, day, time, duration }
    });
    revalidatePath('/sensei');
}

export async function deleteClassAction(id: string) {
    const session = await auth();
    if (session?.user?.role !== 'sensei') {
        throw new Error('Unauthorized');
    }

    await prisma.class.delete({ where: { id } });
    revalidatePath('/sensei');
}

export async function assignStudentToClassAction(classId: string, studentId: string) {
    const session = await auth();
    if (session?.user?.role !== 'sensei') {
        throw new Error('Unauthorized');
    }

    await prisma.class.update({
        where: { id: classId },
        data: {
            students: {
                connect: { id: studentId }
            }
        }
    });
    revalidatePath('/sensei');
}

export async function removeStudentFromClassAction(classId: string, studentId: string) {
    const session = await auth();
    if (session?.user?.role !== 'sensei') {
        throw new Error('Unauthorized');
    }

    await prisma.class.update({
        where: { id: classId },
        data: {
            students: {
                disconnect: { id: studentId }
            }
        }
    });
    revalidatePath('/sensei');
}

export async function fetchStudentClassesAction(studentId: string) {
    // Return classes for a specific student
    return await prisma.class.findMany({
        where: {
            students: {
                some: { id: studentId }
            }
        },
        orderBy: [
            { day: 'asc' },
            { time: 'asc' }
        ]
    });
}
