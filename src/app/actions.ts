'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'

// --- User Actions ---

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
        stripes: userData.stripes ? parseInt(userData.stripes) : undefined,
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

export async function addVideoAction(title: string, url: string, beltId: string) {
    const session = await auth();
    if (session?.user?.role !== 'sensei') {
        throw new Error('Unauthorized');
    }

    const video = await prisma.video.create({
        data: { title, url, beltId }
    });

    revalidatePath('/student');
    revalidatePath('/sensei/videos');
    return video;
}

export async function deleteVideoAction(id: string) {
    const session = await auth();
    if (session?.user?.role !== 'sensei') {
        throw new Error('Unauthorized');
    }

    await prisma.video.delete({
        where: { id }
    });

    revalidatePath('/student');
    revalidatePath('/sensei/videos');
}

export async function updateVideoAction(id: string, data: { title?: string, url?: string, beltId?: string }) {
    const session = await auth();
    if (session?.user?.role !== 'sensei') {
        throw new Error('Unauthorized');
    }

    const video = await prisma.video.update({
        where: { id },
        data
    });

    revalidatePath('/student');
    revalidatePath('/sensei/videos');
    return video;
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

// --- Class Actions ---

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

export async function fetchDojoAnalyticsAction() {
    const session = await auth();
    if (session?.user?.role !== 'sensei') {
        throw new Error('Unauthorized');
    }

    const students = await prisma.user.findMany({
        where: { role: 'student' },
        include: {
            attendance: {
                orderBy: { date: 'desc' },
                take: 1
            }
        }
    });

    const belts = await prisma.belt.findMany({
        orderBy: { order: 'asc' }
    });

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const analytics = {
        totalStudents: students.length,
        activeStudents: 0,
        lapsedStudents: 0,
        rankDistribution: belts.map(b => ({ name: b.name, count: 0, color: b.color })),
        upcomingRenewals: [] as any[],
        lapsedList: [] as any[]
    };

    students.forEach(student => {
        // Active/Lapsed
        const lastAttendance = student.attendance[0]?.date;
        const isActive = lastAttendance && lastAttendance >= thirtyDaysAgo;

        if (isActive) {
            analytics.activeStudents++;
        } else {
            analytics.lapsedStudents++;
            analytics.lapsedList.push({
                id: student.id,
                name: student.name,
                lastSeen: lastAttendance ? lastAttendance.toISOString() : 'Never'
            });
        }

        // Rank Distribution
        const beltSlot = analytics.rankDistribution.find(b => b.name === belts.find(belt => belt.id === student.currentBeltId)?.name);
        if (beltSlot) beltSlot.count++;

        // Upcoming Renewals (Next 30 days)
        if (student.contractStartDate && student.contractRenewal) {
            const startDate = new Date(student.contractStartDate);
            let renewalDate = new Date(startDate);

            const monthsToAdd = {
                'monthly': 1,
                'quarterly': 3,
                'six_months': 6,
                'yearly': 12
            }[student.contractRenewal as string] || 0;

            renewalDate.setMonth(startDate.getMonth() + monthsToAdd);

            // Advance renewal date to the next one if it's in the past
            while (renewalDate < now) {
                renewalDate.setMonth(renewalDate.getMonth() + monthsToAdd);
            }

            const daysToRenewal = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
            if (daysToRenewal <= 30) {
                analytics.upcomingRenewals.push({
                    id: student.id,
                    name: student.name,
                    date: renewalDate.toISOString(),
                    daysTo: daysToRenewal
                });
            }
        }
    });

    // Sort renewals by date
    analytics.upcomingRenewals.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    // Sort lapsed by last seen (oldest first)
    analytics.lapsedList.sort((a, b) => {
        if (a.lastSeen === 'Never') return -1;
        if (b.lastSeen === 'Never') return 1;
        return new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime();
    });

    return analytics;
}
