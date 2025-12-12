
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

    // USERS
    const users = [
        {
            id: 'sensei',
            name: 'Sensei Miyagi',
            email: 'sensei@dojo.com',
            role: 'sensei',
            currentBeltId: 'rokudan',
            password: 'sensei', // Default password
        },
        {
            id: 'student1',
            name: 'Daniel LaRusso',
            email: 'daniel@dojo.com',
            role: 'student',
            currentBeltId: '11th-kyu',
            startDate: new Date('2024-01-15'),
            contractRenewal: 'six_months',
            senseiNotes: 'Shows great promise. Needs to work on stance.',
            address: '123 Dojo Way, Karate City, KC 12345',
            signedContract: 'daniel_larusso_contract.pdf',
            password: 'student',
        },
        {
            id: 'student2',
            name: 'Johnny Lawrence',
            email: 'johnny@dojo.com',
            role: 'student',
            currentBeltId: '10th-kyu',
            startDate: new Date('2024-12-01'),
            contractRenewal: 'yearly',
            senseiNotes: 'Needs to work on discipline.',
            password: 'student',
        }
    ]

    for (const user of users) {
        await prisma.user.upsert({
            where: { email: user.email },
            update: {},
            create: user,
        })
    }

    // EVENTS
    const events = [
        { id: 'e1', title: 'Belt Promotion Testing', date: new Date('2025-12-15'), description: 'Testing for all ranks. Please arrive 30 mins early.' },
        { id: 'e2', title: 'Holiday Dojo Party', date: new Date('2025-12-20'), description: 'Potluck party for all students and families.' },
    ]

    for (const event of events) {
        await prisma.event.upsert({
            where: { id: event.id },
            update: {},
            create: event,
        })
    }
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
