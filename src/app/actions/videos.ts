'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'

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
