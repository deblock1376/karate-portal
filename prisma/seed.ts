
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function hash(pw: string) {
    return bcrypt.hash(pw, 10)
}

async function main() {
    // BELTS
    const belts = [
        { id: '11th-kyu', name: '11th Kyu - Yellow', color: '#ffc107', order: 0 },
        { id: '10th-kyu', name: '10th Kyu - Orange', color: '#fd7e14', order: 1 },
        { id: '9th-kyu', name: '9th Kyu - Green', color: '#28a745', order: 2 },
        { id: '8th-kyu', name: '8th Kyu - Green-Black', color: '#1e7e34', order: 3 },
        { id: '7th-kyu', name: '7th Kyu - Blue', color: '#007bff', order: 4 },
        { id: '6th-kyu', name: '6th Kyu - Blue-Black', color: '#0056b3', order: 5 },
        { id: '5th-kyu', name: '5th Kyu - Purple', color: '#6f42c1', order: 6 },
        { id: '4th-kyu', name: '4th Kyu - Purple-Black', color: '#5a32a3', order: 7 },
        { id: '3rd-kyu', name: '3rd Kyu - Brown', color: '#795548', order: 8 },
        { id: '2nd-kyu', name: '2nd Kyu - Brown', color: '#5d4037', order: 9 },
        { id: '1st-kyu', name: '1st Kyu - Brown', color: '#3e2723', order: 10 },
        { id: 'jr-black-1', name: 'Junior Black Belt - Level 1', color: '#343a40', order: 11 },
        { id: 'jr-black-2', name: 'Junior Black Belt - Level 2', color: '#343a40', order: 12 },
        { id: 'jr-black-3', name: 'Junior Black Belt - Level 3', color: '#343a40', order: 13 },
        { id: 'jr-black-4', name: 'Junior Black Belt - Level 4', color: '#343a40', order: 14 },
        { id: 'shodan', name: 'Shodan', color: '#000000', order: 15 },
        { id: 'nidan', name: 'Nidan', color: '#000000', order: 16 },
        { id: 'sandan', name: 'Sandan', color: '#000000', order: 17 },
        { id: 'yondan', name: 'Yondan', color: '#000000', order: 18 },
        { id: 'rokudan', name: 'Rokudan', color: '#000000', order: 19 },
    ]

    for (const belt of belts) {
        await prisma.belt.upsert({
            where: { id: belt.id },
            update: {},
            create: belt,
        })
    }

    // VIDEOS
    const videos = [
        { id: 'v1', title: '11th Kyu: Stance Basics', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', beltId: '11th-kyu' },
        { id: 'v2', title: '11th Kyu: First Punch', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', beltId: '11th-kyu' },
        { id: 'v3', title: '10th Kyu Kata', url: 'https://www.youtube.com/embed/xyz789', beltId: '10th-kyu' },
        { id: 'v4', title: '9th Kyu: Sparring Drills', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', beltId: '9th-kyu' },
    ]

    for (const video of videos) {
        await prisma.video.upsert({
            where: { id: video.id },
            update: {},
            create: video,
        })
    }

    // CLASSES
    const classes = [
        { id: 'class-beginners', name: 'Beginners', days: ['Monday', 'Wednesday'], time: '4:00 PM', duration: 45 },
        { id: 'class-intermediate', name: 'Intermediate', days: ['Monday', 'Wednesday', 'Friday'], time: '5:00 PM', duration: 60 },
        { id: 'class-advanced', name: 'Advanced', days: ['Tuesday', 'Thursday'], time: '6:00 PM', duration: 75 },
        { id: 'class-swat', name: 'SWAT Team', days: ['Saturday'], time: '10:00 AM', duration: 90 },
    ]

    for (const cls of classes) {
        await prisma.class.upsert({
            where: { id: cls.id },
            update: {},
            create: cls,
        })
    }

    // USERS — passwords hashed with bcrypt
    const senseiPw = await hash('sensei')
    const studentPw = await hash('student')
    const parentPw = await hash('parent')

    // ── Sensei ──────────────────────────────────────────────────────────────
    await prisma.user.upsert({
        where: { id: 'sensei' },
        update: {},
        create: {
            id: 'sensei',
            name: 'Sensei Miyagi',
            email: 'sensei@dojo.com',
            role: 'sensei',
            currentBeltId: 'rokudan',
            password: senseiPw,
        },
    })

    // ── Guardians ───────────────────────────────────────────────────────────
    await prisma.user.upsert({
        where: { id: 'parent1' },
        update: {},
        create: {
            id: 'parent1',
            name: 'Maria Santos',
            email: 'maria.santos@email.com',
            role: 'student',
            currentBeltId: '11th-kyu',
            password: parentPw,
            address: '742 Maple St, Portland, OR 97205',
        },
    })

    await prisma.user.upsert({
        where: { id: 'parent2' },
        update: {},
        create: {
            id: 'parent2',
            name: 'Kevin Nguyen',
            email: 'kevin.nguyen@email.com',
            role: 'student',
            currentBeltId: '11th-kyu',
            password: parentPw,
            address: '1580 Oak Ave, Portland, OR 97214',
        },
    })

    // ── Students ─────────────────────────────────────────────────────────────
    const students = [
        // --- Beginners (11th & 10th kyu) — joined recently ---
        {
            id: 'student1',
            name: 'Mia Chen',
            email: 'mia.chen@email.com',
            currentBeltId: '11th-kyu',
            startDate: new Date('2026-03-01'),
            contractStartDate: new Date('2026-05-18'),
            contractRenewal: 'monthly',
            senseiNotes: 'Brand new, age 8. Very enthusiastic. Mom watches from the lobby.',
            address: '215 Birch Ln, Portland, OR 97209',
            stripes: 0,
            nextTestDate: new Date('2026-07-15'),
            isSwatTeam: false,
            classIds: ['class-beginners'],
        },
        {
            id: 'student2',
            name: 'Jayden Brooks',
            email: 'jayden.brooks@email.com',
            currentBeltId: '11th-kyu',
            startDate: new Date('2026-02-10'),
            contractStartDate: new Date('2026-03-15'),
            contractRenewal: 'quarterly',
            senseiNotes: 'Age 10. Transferred from a TKD school. Adjusting to new stances.',
            address: '88 Cedar Ct, Portland, OR 97211',
            stripes: 1,
            nextTestDate: new Date('2026-07-15'),
            isSwatTeam: false,
            classIds: ['class-beginners'],
        },
        {
            id: 'student3',
            name: 'Sofia Santos',
            email: 'sofia.santos@email.com',
            currentBeltId: '10th-kyu',
            startDate: new Date('2025-09-15'),
            contractStartDate: new Date('2025-09-15'),
            contractRenewal: 'six_months',
            senseiNotes: 'Age 9. Quiet but precise. Nailing her kata early.',
            address: '742 Maple St, Portland, OR 97205',
            stripes: 2,
            nextTestDate: new Date('2026-06-15'),
            isSwatTeam: false,
            classIds: ['class-beginners'],
        },
        {
            id: 'student4',
            name: 'Liam O\'Brien',
            email: 'liam.obrien@email.com',
            currentBeltId: '10th-kyu',
            startDate: new Date('2025-11-01'),
            contractStartDate: new Date('2026-05-22'),
            contractRenewal: 'monthly',
            senseiNotes: 'Age 11. Comes with his older brother Marcus. Competitive but respectful.',
            address: '330 Division St, Portland, OR 97202',
            stripes: 1,
            nextTestDate: new Date('2026-06-15'),
            isSwatTeam: false,
            classIds: ['class-beginners'],
        },

        // --- Lower intermediate (9th & 8th kyu) ---
        {
            id: 'student5',
            name: 'Aisha Johnson',
            email: 'aisha.johnson@email.com',
            currentBeltId: '9th-kyu',
            startDate: new Date('2025-05-20'),
            contractStartDate: new Date('2025-05-20'),
            contractRenewal: 'yearly',
            senseiNotes: 'Age 12. Natural athlete — also runs track. Great kicks.',
            address: '1702 Hawthorne Blvd, Portland, OR 97214',
            stripes: 2,
            nextTestDate: new Date('2026-06-20'),
            isSwatTeam: false,
            classIds: ['class-intermediate'],
        },
        {
            id: 'student6',
            name: 'Marcus O\'Brien',
            email: 'marcus.obrien@email.com',
            currentBeltId: '8th-kyu',
            startDate: new Date('2025-01-10'),
            contractStartDate: new Date('2025-01-10'),
            contractRenewal: 'yearly',
            senseiNotes: 'Age 14. Liam\'s older brother. Quietly dedicated, never misses class.',
            address: '330 Division St, Portland, OR 97202',
            stripes: 3,
            nextTestDate: new Date('2026-06-20'),
            isSwatTeam: false,
            classIds: ['class-intermediate'],
        },

        // --- Upper intermediate (7th & 6th kyu) ---
        {
            id: 'student7',
            name: 'Emma Nguyen',
            email: 'emma.nguyen@email.com',
            currentBeltId: '7th-kyu',
            startDate: new Date('2024-08-15'),
            contractStartDate: new Date('2025-06-25'),
            contractRenewal: 'yearly',
            senseiNotes: 'Age 13. SWAT candidate. Excellent focus and self-discipline.',
            address: '1580 Oak Ave, Portland, OR 97214',
            stripes: 2,
            nextTestDate: new Date('2026-06-21'),
            isSwatTeam: true,
            classIds: ['class-intermediate', 'class-swat'],
        },
        {
            id: 'student8',
            name: 'Tyler Washington',
            email: 'tyler.washington@email.com',
            currentBeltId: '7th-kyu',
            startDate: new Date('2024-06-01'),
            contractStartDate: new Date('2024-06-01'),
            contractRenewal: 'six_months',
            senseiNotes: 'Age 15. Strong sparring instincts. Needs to slow down on kata.',
            address: '4415 SE Belmont, Portland, OR 97215',
            stripes: 1,
            nextTestDate: new Date('2026-08-01'),
            isSwatTeam: false,
            classIds: ['class-intermediate'],
        },
        {
            id: 'student9',
            name: 'Isabella Reyes',
            email: 'isabella.reyes@email.com',
            currentBeltId: '6th-kyu',
            startDate: new Date('2024-03-10'),
            contractStartDate: new Date('2024-03-10'),
            contractRenewal: 'yearly',
            senseiNotes: 'Age 14. Tournament competitor — placed 2nd at regionals in 2025. Smooth kata.',
            address: '912 NE Alberta St, Portland, OR 97211',
            stripes: 3,
            nextTestDate: new Date('2026-06-21'),
            isSwatTeam: true,
            classIds: ['class-intermediate', 'class-swat'],
        },

        // --- Advanced (5th through 3rd kyu) ---
        {
            id: 'student10',
            name: 'Ethan Park',
            email: 'ethan.park@email.com',
            currentBeltId: '5th-kyu',
            startDate: new Date('2023-09-01'),
            contractStartDate: new Date('2023-09-01'),
            contractRenewal: 'yearly',
            senseiNotes: 'Age 16. Assistant instructor potential. Helps with beginners on Wednesdays.',
            address: '2250 NW Glisan St, Portland, OR 97210',
            stripes: 2,
            nextTestDate: new Date('2026-06-28'),
            isSwatTeam: true,
            classIds: ['class-advanced', 'class-swat'],
        },
        {
            id: 'student11',
            name: 'Olivia Martinez',
            email: 'olivia.martinez@email.com',
            currentBeltId: '4th-kyu',
            startDate: new Date('2023-06-15'),
            contractStartDate: new Date('2023-06-15'),
            contractRenewal: 'yearly',
            senseiNotes: 'Age 15. One of our most consistent students. 3x/week attendance.',
            address: '607 SE Morrison St, Portland, OR 97214',
            stripes: 1,
            nextTestDate: new Date('2026-09-01'),
            isSwatTeam: true,
            classIds: ['class-advanced', 'class-swat'],
        },
        {
            id: 'student12',
            name: 'Noah Kim',
            email: 'noah.kim@email.com',
            currentBeltId: '3rd-kyu',
            startDate: new Date('2023-01-15'),
            contractStartDate: new Date('2023-01-15'),
            contractRenewal: 'yearly',
            senseiNotes: 'Age 17. Tournament contender. Working on breath control in kata. Testing for 2nd kyu soon.',
            address: '1133 SW Jefferson St, Portland, OR 97201',
            signedContract: 'noah_kim_contract.pdf',
            stripes: 2,
            nextTestDate: new Date('2026-06-28'),
            isSwatTeam: true,
            classIds: ['class-advanced', 'class-swat'],
        },

        // --- Senior students (2nd & 1st kyu, approaching black belt) ---
        {
            id: 'student13',
            name: 'Ava Thompson',
            email: 'ava.thompson@email.com',
            currentBeltId: '2nd-kyu',
            startDate: new Date('2022-08-01'),
            contractStartDate: new Date('2022-08-01'),
            contractRenewal: 'yearly',
            senseiNotes: 'Age 16. Strong leader. Helps run warm-ups. Black belt candidate by end of year.',
            address: '4820 N Williams Ave, Portland, OR 97217',
            signedContract: 'ava_thompson_contract.pdf',
            stripes: 3,
            nextTestDate: new Date('2026-09-01'),
            isSwatTeam: true,
            classIds: ['class-advanced', 'class-swat'],
        },
        {
            id: 'student14',
            name: 'Daniel Kowalski',
            email: 'daniel.kowalski@email.com',
            currentBeltId: '1st-kyu',
            startDate: new Date('2022-01-10'),
            contractStartDate: new Date('2022-01-10'),
            contractRenewal: 'yearly',
            senseiNotes: 'Age 17. Our most senior student. Preparing for Shodan test. Excellent role model.',
            address: '735 SE Grand Ave, Portland, OR 97214',
            signedContract: 'daniel_kowalski_contract.pdf',
            stripes: 3,
            nextTestDate: new Date('2026-08-01'),
            isSwatTeam: true,
            classIds: ['class-advanced', 'class-swat'],
        },

        // --- Junior black belt ---
        {
            id: 'student15',
            name: 'Ryan Nakamura',
            email: 'ryan.nakamura@email.com',
            currentBeltId: 'jr-black-1',
            startDate: new Date('2021-06-01'),
            contractStartDate: new Date('2021-06-01'),
            contractRenewal: 'yearly',
            senseiNotes: 'Age 15. Junior black belt. Assists with Saturday SWAT class. Mature beyond his years.',
            address: '2901 NE Broadway, Portland, OR 97232',
            signedContract: 'ryan_nakamura_contract.pdf',
            stripes: 0,
            nextTestDate: new Date('2026-12-01'),
            isSwatTeam: true,
            classIds: ['class-advanced', 'class-swat'],
        },

        // --- A lapsed student (no recent attendance) ---
        {
            id: 'student16',
            name: 'Grace Liu',
            email: 'grace.liu@email.com',
            currentBeltId: '6th-kyu',
            startDate: new Date('2024-01-15'),
            contractStartDate: new Date('2024-01-15'),
            contractRenewal: 'quarterly',
            senseiNotes: 'Age 13. Hasn\'t been in since February — school sports conflict. Follow up with family.',
            address: '510 NW 23rd Ave, Portland, OR 97210',
            stripes: 1,
            nextTestDate: new Date('2026-09-01'),
            isSwatTeam: false,
            classIds: ['class-intermediate'],
        },

        // --- An adult student ---
        {
            id: 'student17',
            name: 'James Fletcher',
            email: 'james.fletcher@email.com',
            currentBeltId: '9th-kyu',
            startDate: new Date('2025-08-01'),
            contractStartDate: new Date('2025-08-01'),
            contractRenewal: 'six_months',
            senseiNotes: 'Adult student, age 34. Started for fitness. Really enjoying kata. Trains in the advanced slot since he works during the day.',
            address: '1420 SE Ankeny St, Portland, OR 97214',
            stripes: 2,
            nextTestDate: new Date('2026-06-01'),
            isSwatTeam: false,
            classIds: ['class-advanced'],
        },

        // --- Another new beginner ---
        {
            id: 'student18',
            name: 'Zoe Patel',
            email: 'zoe.patel@email.com',
            currentBeltId: '11th-kyu',
            startDate: new Date('2026-04-15'),
            contractStartDate: new Date('2026-04-15'),
            contractRenewal: 'monthly',
            senseiNotes: 'Age 7. Youngest student. Trial month — parents deciding on longer commitment.',
            address: '3305 SE Hawthorne, Portland, OR 97214',
            stripes: 0,
            nextTestDate: new Date('2026-10-01'),
            isSwatTeam: false,
            classIds: ['class-beginners'],
        },
    ]

    for (const student of students) {
        const { classIds, ...userData } = student
        await prisma.user.upsert({
            where: { id: userData.id },
            update: {
                name: userData.name,
                email: userData.email,
                password: studentPw,
                currentBeltId: userData.currentBeltId,
                startDate: userData.startDate,
                contractStartDate: userData.contractStartDate,
                contractRenewal: userData.contractRenewal,
                senseiNotes: userData.senseiNotes,
                address: userData.address,
                signedContract: userData.signedContract,
                stripes: userData.stripes,
                nextTestDate: userData.nextTestDate,
                isSwatTeam: userData.isSwatTeam,
            },
            create: {
                ...userData,
                role: 'student',
                password: studentPw,
                classes: {
                    connect: classIds.map(id => ({ id })),
                },
            },
        })
    }

    // FAMILY LINKS — guardian ↔ student connections
    // Maria Santos is guardian of Sofia Santos
    await prisma.user.update({
        where: { id: 'parent1' },
        data: {
            students: {
                set: [{ id: 'student3' }], // Sofia Santos
            },
        },
    })

    // Kevin Nguyen is guardian of Emma Nguyen
    await prisma.user.update({
        where: { id: 'parent2' },
        data: {
            students: {
                set: [{ id: 'student7' }], // Emma Nguyen
            },
        },
    })

    // ATTENDANCE — seed realistic history
    // Helper: generate attendance records for a student over a date range
    function attendanceDates(startStr: string, endStr: string, daysPerWeek: number): Date[] {
        const dates: Date[] = []
        const start = new Date(startStr)
        const end = new Date(endStr)
        const current = new Date(start)

        // Pick consistent weekdays based on daysPerWeek
        const weekdays = daysPerWeek >= 3
            ? [1, 3, 5] // Mon, Wed, Fri
            : daysPerWeek === 2
                ? [1, 4] // Mon, Thu
                : [3]    // Wed only

        while (current <= end) {
            if (weekdays.includes(current.getDay())) {
                // Skip ~15% randomly to simulate missed classes
                if (Math.random() > 0.15) {
                    const d = new Date(current)
                    d.setHours(17, 0, 0, 0) // 5 PM
                    dates.push(d)
                }
            }
            current.setDate(current.getDate() + 1)
        }
        return dates
    }

    // Use a fixed seed-like approach: deterministic-ish by resetting random
    // (not truly deterministic, but good enough for dev data)
    const attendanceRecords: { userId: string, dates: Date[] }[] = [
        // Active students — recent attendance
        { userId: 'student1',  dates: attendanceDates('2026-03-03', '2026-06-09', 2) },    // Mia - new, 2x/week
        { userId: 'student2',  dates: attendanceDates('2026-02-11', '2026-06-09', 2) },    // Jayden
        { userId: 'student3',  dates: attendanceDates('2025-09-17', '2026-06-09', 2) },    // Sofia
        { userId: 'student4',  dates: attendanceDates('2025-11-03', '2026-06-09', 2) },    // Liam
        { userId: 'student5',  dates: attendanceDates('2025-05-21', '2026-06-09', 3) },    // Aisha - 3x/week
        { userId: 'student6',  dates: attendanceDates('2025-01-13', '2026-06-09', 3) },    // Marcus
        { userId: 'student7',  dates: attendanceDates('2024-08-19', '2026-06-09', 3) },    // Emma
        { userId: 'student8',  dates: attendanceDates('2024-06-03', '2026-06-09', 2) },    // Tyler
        { userId: 'student9',  dates: attendanceDates('2024-03-11', '2026-06-09', 3) },    // Isabella
        { userId: 'student10', dates: attendanceDates('2023-09-04', '2026-06-09', 3) },    // Ethan
        { userId: 'student11', dates: attendanceDates('2023-06-19', '2026-06-09', 3) },    // Olivia
        { userId: 'student12', dates: attendanceDates('2023-01-16', '2026-06-09', 3) },    // Noah
        { userId: 'student13', dates: attendanceDates('2022-08-01', '2026-06-09', 3) },    // Ava
        { userId: 'student14', dates: attendanceDates('2022-01-10', '2026-06-09', 3) },    // Daniel K
        { userId: 'student15', dates: attendanceDates('2021-06-01', '2026-06-09', 2) },    // Ryan
        // Grace — lapsed, last attended in February
        { userId: 'student16', dates: attendanceDates('2024-01-15', '2026-02-15', 2) },    // Grace - stopped
        { userId: 'student17', dates: attendanceDates('2025-08-04', '2026-06-09', 2) },    // James
        { userId: 'student18', dates: attendanceDates('2026-04-16', '2026-06-09', 2) },    // Zoe - very new
    ]

    // Limit attendance to last ~6 months to keep the DB size reasonable
    const sixMonthsAgo = new Date('2025-12-10')

    for (const record of attendanceRecords) {
        const recentDates = record.dates.filter(d => d >= sixMonthsAgo)

        // Delete existing attendance for this user to avoid duplicates on re-seed
        await prisma.attendance.deleteMany({ where: { userId: record.userId } })

        if (recentDates.length > 0) {
            await prisma.attendance.createMany({
                data: recentDates.map(date => ({
                    userId: record.userId,
                    date,
                })),
            })
        }
    }

    // EVENTS
    const events = [
        { id: 'e1', title: 'Belt Promotion Testing', date: new Date('2026-06-28'), description: 'Testing for all ranks. Please arrive 30 mins early.' },
        { id: 'e2', title: 'Summer Tournament', date: new Date('2026-07-12'), description: 'Regional tournament at Portland Convention Center. Open to 7th-kyu and above.' },
        { id: 'e3', title: 'Summer Dojo Party', date: new Date('2026-08-16'), description: 'Annual BBQ and potluck for all students and families. Laurelhurst Park shelter B.' },
    ]

    for (const event of events) {
        await prisma.event.upsert({
            where: { id: event.id },
            update: {},
            create: event,
        })
    }

    console.log('Seed complete.')
    console.log('')
    console.log('Test accounts:')
    console.log('  sensei@dojo.com              / sensei   (Sensei - Rokudan)')
    console.log('  mia.chen@email.com           / student  (11th-kyu, beginner)')
    console.log('  noah.kim@email.com            / student  (3rd-kyu, tournament)')
    console.log('  ava.thompson@email.com        / student  (2nd-kyu, SWAT)')
    console.log('  daniel.kowalski@email.com     / student  (1st-kyu, near black belt)')
    console.log('  ryan.nakamura@email.com       / student  (Jr Black Belt)')
    console.log('  grace.liu@email.com           / student  (6th-kyu, lapsed)')
    console.log('  james.fletcher@email.com      / student  (9th-kyu, adult)')
    console.log('  maria.santos@email.com        / parent   (guardian of Sofia)')
    console.log('  kevin.nguyen@email.com        / parent   (guardian of Emma)')
    console.log('')
    console.log(`  ${students.length} students across ${classes.length} classes with attendance history`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
