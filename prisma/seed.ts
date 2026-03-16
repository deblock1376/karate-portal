
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

    // USERS — passwords hashed with bcrypt
    const senseiPw = await hash('sensei')
    const studentPw = await hash('student')
    const parentPw = await hash('parent')

    const users = [
        // ── Sensei ──────────────────────────────────────────────────────────────
        {
            id: 'sensei',
            name: 'Sensei Miyagi',
            email: 'sensei@dojo.com',
            role: 'sensei',
            currentBeltId: 'rokudan',
            password: senseiPw,
        },

        // ── Guardian (parent of Daniel & Ali) ────────────────────────────────
        {
            id: 'parent1',
            name: 'Lucille LaRusso',
            email: 'lucille@dojo.com',
            role: 'student',           // guardians use the student role
            currentBeltId: '11th-kyu', // required by schema
            password: parentPw,
            address: '123 Dojo Way, Karate City, KC 12345',
        },

        // ── Students ─────────────────────────────────────────────────────────
        {
            id: 'student1',
            name: 'Daniel LaRusso',
            email: 'daniel@dojo.com',
            role: 'student',
            currentBeltId: '3rd-kyu',
            startDate: new Date('2023-01-15'),
            contractRenewal: 'yearly',
            senseiNotes: 'Shows great promise. Tournament contender. Work on breath control in kata.',
            address: '123 Dojo Way, Karate City, KC 12345',
            signedContract: 'daniel_larusso_contract.pdf',
            stripes: 2,
            nextTestDate: new Date('2026-05-01'),
            isSwatTeam: false,
            password: studentPw,
        },
        {
            id: 'student2',
            name: 'Johnny Lawrence',
            email: 'johnny@dojo.com',
            role: 'student',
            currentBeltId: '5th-kyu',
            startDate: new Date('2023-06-01'),
            contractRenewal: 'six_months',
            senseiNotes: 'Natural aggression — channeling it positively. Strong sparring partner.',
            stripes: 1,
            nextTestDate: new Date('2026-06-01'),
            isSwatTeam: false,
            password: studentPw,
        },
        {
            id: 'student3',
            name: 'Ali Mills',
            email: 'ali@dojo.com',
            role: 'student',
            currentBeltId: '7th-kyu',
            startDate: new Date('2024-03-10'),
            contractRenewal: 'yearly',
            senseiNotes: 'Excellent footwork. Ready to advance.',
            address: '456 Valley View Dr, Karate City, KC 12345',
            stripes: 3,
            nextTestDate: new Date('2026-04-15'),
            isSwatTeam: true,
            password: studentPw,
        },
        {
            id: 'student4',
            name: 'Bobby Brown',
            email: 'bobby@dojo.com',
            role: 'student',
            currentBeltId: '11th-kyu',
            startDate: new Date('2026-01-20'),
            contractRenewal: 'monthly',
            senseiNotes: 'Brand new. Eager to learn.',
            stripes: 0,
            nextTestDate: new Date('2026-04-15'),
            isSwatTeam: false,
            password: studentPw,
        },
        {
            id: 'student5',
            name: 'Dutch',
            email: 'dutch@dojo.com',
            role: 'student',
            currentBeltId: '2nd-kyu',
            startDate: new Date('2022-04-01'),
            contractRenewal: 'yearly',
            senseiNotes: 'Powerful and aggressive. Needs to work on composure under pressure.',
            stripes: 1,
            nextTestDate: new Date('2026-09-01'),
            isSwatTeam: true,
            password: studentPw,
        },
    ]

    for (const user of users) {
        await prisma.user.upsert({
            where: { email: user.email },
            update: {
                name: user.name,
                role: user.role,
                currentBeltId: user.currentBeltId,
                password: user.password,
                startDate: (user as any).startDate,
                contractRenewal: (user as any).contractRenewal,
                senseiNotes: (user as any).senseiNotes,
                address: (user as any).address,
                signedContract: (user as any).signedContract,
                stripes: (user as any).stripes ?? 0,
                nextTestDate: (user as any).nextTestDate,
                isSwatTeam: (user as any).isSwatTeam ?? false,
            },
            create: user as any,
        })
    }

    // FAMILY LINKS — guardian ↔ student connections
    // Lucille is the guardian of Daniel and Ali
    await prisma.user.update({
        where: { id: 'parent1' },
        data: {
            students: {
                connect: [
                    { id: 'student1' }, // Daniel LaRusso
                    { id: 'student3' }, // Ali Mills
                ],
            },
        },
    })

    // EVENTS
    const events = [
        { id: 'e1', title: 'Belt Promotion Testing', date: new Date('2026-04-15'), description: 'Testing for all ranks. Please arrive 30 mins early.' },
        { id: 'e2', title: 'Spring Tournament', date: new Date('2026-05-10'), description: 'Regional tournament. Open to 7th-kyu and above.' },
        { id: 'e3', title: 'Summer Dojo Party', date: new Date('2026-06-20'), description: 'Potluck celebration for all students and families.' },
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
    console.log('  sensei@dojo.com     / sensei   (Sensei role)')
    console.log('  daniel@dojo.com     / student  (3rd-kyu student)')
    console.log('  johnny@dojo.com     / student  (5th-kyu student)')
    console.log('  ali@dojo.com        / student  (7th-kyu, SWAT team)')
    console.log('  bobby@dojo.com      / student  (11th-kyu, new student)')
    console.log('  dutch@dojo.com      / student  (2nd-kyu, SWAT team)')
    console.log('  lucille@dojo.com    / parent   (guardian of Daniel & Ali)')
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
