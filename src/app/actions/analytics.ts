'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/auth'

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
