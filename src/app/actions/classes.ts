'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'

export async function fetchClassesAction() {
    return await prisma.class.findMany({
        orderBy: [
            { time: 'asc' }
        ],
        include: {
            students: {
                select: { id: true, name: true, email: true }
            }
        }
    });
}

export async function createClassAction(name: string, days: string[], time: string, duration: number = 60) {
    const session = await auth();
    if (session?.user?.role !== 'sensei') {
        throw new Error('Unauthorized');
    }

    await prisma.class.create({
        data: { name, days, time, duration }
    });
    revalidatePath('/sensei');
    revalidatePath('/sensei/classes');
}

export async function deleteClassAction(id: string) {
    const session = await auth();
    if (session?.user?.role !== 'sensei') {
        throw new Error('Unauthorized');
    }

    await prisma.class.delete({ where: { id } });
    revalidatePath('/sensei');
    revalidatePath('/sensei/classes');
}

export async function updateClassAction(id: string, data: { name?: string, days?: string[], time?: string, duration?: number }) {
    const session = await auth();
    if (session?.user?.role !== 'sensei') {
        throw new Error('Unauthorized');
    }

    const updated = await prisma.class.update({
        where: { id },
        data
    });

    revalidatePath('/sensei');
    revalidatePath('/sensei/classes');
    revalidatePath(`/sensei/classes/${id}`);
    return updated;
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
            { time: 'asc' }
        ]
    });
}

export async function fetchClassByIdAction(id: string) {
    const session = await auth();
    if (session?.user?.role !== 'sensei') {
        throw new Error('Unauthorized');
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return await prisma.class.findUnique({
        where: { id },
        include: {
            students: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    attendance: {
                        where: {
                            date: { gte: startOfDay }
                        }
                    }
                }
            }
        }
    });
}

export async function fetchClassByIdForDateAction(id: string, dateStr: string) {
    const session = await auth();
    if (session?.user?.role !== 'sensei') {
        throw new Error('Unauthorized');
    }

    const date = new Date(dateStr);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await prisma.class.findUnique({
        where: { id },
        include: {
            students: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    attendance: {
                        where: {
                            date: { gte: startOfDay, lte: endOfDay }
                        }
                    }
                }
            }
        }
    });
}
