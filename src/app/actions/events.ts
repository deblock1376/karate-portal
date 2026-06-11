'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

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
