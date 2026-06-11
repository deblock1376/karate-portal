'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'

export async function loginUserAction(email: string) {
    const normalizedEmail = email.toLowerCase();
    const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
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
        nextTestDate: userData.nextTestDate ? new Date(userData.nextTestDate) : undefined,
        stripes: userData.stripes ? parseInt(userData.stripes) : 0,
        isSwatTeam: userData.isSwatTeam === true || userData.isSwatTeam === 'true',
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
        nextTestDate: userData.nextTestDate ? new Date(userData.nextTestDate) : undefined,
        stripes: userData.stripes !== undefined && userData.stripes !== null ? parseInt(userData.stripes) : undefined,
        isSwatTeam: typeof userData.isSwatTeam === 'boolean' ? userData.isSwatTeam : (userData.isSwatTeam === 'true'),
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
    revalidatePath('/sensei/students')
    revalidatePath(`/sensei/students/${id}`)
    return user
}

export async function updateUserBeltAction(userId: string, newBeltId: string) {
    await prisma.user.update({
        where: { id: userId },
        data: { currentBeltId: newBeltId }
    })
    revalidatePath('/sensei')
}

export async function linkStudentAction(guardianId: string, studentId: string) {
    const session = await auth();
    if (session?.user?.role !== 'sensei') {
        throw new Error('Unauthorized');
    }

    await prisma.user.update({
        where: { id: guardianId },
        data: {
            students: {
                connect: { id: studentId }
            }
        }
    })
    revalidatePath('/sensei')
}

export async function fetchLinkedStudentsAction(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            students: {
                include: {
                    classes: true
                }
            }
        }
    })
    return user?.students || []
}

export async function fetchUserByIdAction(id: string) {
    const session = await auth();
    if (session?.user?.role !== 'sensei') {
        throw new Error('Unauthorized');
    }

    return await prisma.user.findUnique({
        where: { id },
        include: {
            classes: true
        }
    });
}

export async function updateStudentContactAction(data: {
    name?: string
    email?: string
    phone?: string
    address?: string
    birthday?: string
    school?: string
    guardianName?: string
    guardianPhone?: string
    guardianEmail?: string
    secondaryName?: string
    secondaryPhone?: string
    secondaryEmail?: string
}) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            name: data.name || undefined,
            email: data.email || undefined,
            phone: data.phone ?? undefined,
            address: data.address ?? undefined,
            birthday: data.birthday ? new Date(data.birthday) : undefined,
            school: data.school ?? undefined,
            guardianName: data.guardianName ?? undefined,
            guardianPhone: data.guardianPhone ?? undefined,
            guardianEmail: data.guardianEmail ?? undefined,
            secondaryName: data.secondaryName ?? undefined,
            secondaryPhone: data.secondaryPhone ?? undefined,
            secondaryEmail: data.secondaryEmail ?? undefined,
        },
    })
    revalidatePath('/student')
}

export async function fetchStudentContactAction() {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    return await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            name: true,
            email: true,
            phone: true,
            address: true,
            birthday: true,
            school: true,
            guardianName: true,
            guardianPhone: true,
            guardianEmail: true,
            secondaryName: true,
            secondaryPhone: true,
            secondaryEmail: true,
        },
    })
}

export async function importStudentsFromCsvAction(rows: {
    name: string;
    email: string;
    password?: string;
    currentBeltId?: string;
    startDate?: string;
    contractStartDate?: string;
    contractRenewal?: string;
    address?: string;
    stripes?: number;
    isSwatTeam?: boolean;
    senseiNotes?: string;
    nextTestDate?: string;
}[]) {
    const session = await auth();
    if (session?.user?.role !== 'sensei') {
        throw new Error('Unauthorized');
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
        if (!row.name || !row.email) {
            errors.push(`Skipped row — missing name or email: ${JSON.stringify(row)}`);
            skipped++;
            continue;
        }

        const normalizedEmail = row.email.toLowerCase().trim();

        const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existing) {
            skipped++;
            continue;
        }

        try {
            await prisma.user.create({
                data: {
                    name: row.name.trim(),
                    email: normalizedEmail,
                    password: row.password ? await bcrypt.hash(row.password, 10) : undefined,
                    role: 'student',
                    currentBeltId: row.currentBeltId || '11th-kyu',
                    startDate: row.startDate ? new Date(row.startDate) : undefined,
                    contractStartDate: row.contractStartDate ? new Date(row.contractStartDate) : undefined,
                    contractRenewal: row.contractRenewal || undefined,
                    address: row.address || undefined,
                    stripes: row.stripes ?? 0,
                    isSwatTeam: row.isSwatTeam ?? false,
                    senseiNotes: row.senseiNotes || undefined,
                    nextTestDate: row.nextTestDate ? new Date(row.nextTestDate) : undefined,
                }
            });
            imported++;
        } catch (e: any) {
            errors.push(`Failed to import ${row.email}: ${e.message}`);
            skipped++;
        }
    }

    revalidatePath('/sensei');
    revalidatePath('/sensei/students');
    return { imported, skipped, errors };
}
