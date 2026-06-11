'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

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
