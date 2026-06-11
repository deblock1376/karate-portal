'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { Resend } from 'resend'
import { NewsletterEmail } from '@/components/emails/NewsletterEmail'
import * as React from 'react'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL || 'Zanshin Karate Dojo <onboarding@resend.dev>'

export async function fetchNewsletterRecipientsAction() {
    const session = await auth()
    if (session?.user?.role !== 'sensei') throw new Error('Unauthorized')

    return await prisma.user.findMany({
        where: { role: 'student' },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
    })
}

export async function sendNewsletterAction(subject: string, body: string) {
    const session = await auth()
    if (session?.user?.role !== 'sensei') throw new Error('Unauthorized')

    if (!subject.trim() || !body.trim()) throw new Error('Subject and body are required')

    const students = await prisma.user.findMany({
        where: { role: 'student' },
        select: { name: true, email: true },
    })

    const eligible = students.filter(s => s.email)
    if (eligible.length === 0) return { sent: 0, failed: 0, errors: [] }

    const BATCH_SIZE = 100
    let sent = 0
    let failed = 0
    const errors: string[] = []

    for (let i = 0; i < eligible.length; i += BATCH_SIZE) {
        const batch = eligible.slice(i, i + BATCH_SIZE)
        const messages = batch.map(s => ({
            from: FROM,
            to: [s.email as string],
            subject,
            react: React.createElement(NewsletterEmail, { name: s.name ?? '', subject, body }),
        }))

        try {
            const { data, error } = await resend.batch.send(messages)
            if (error) {
                errors.push(`Batch ${i / BATCH_SIZE + 1}: ${error.message}`)
                failed += batch.length
            } else {
                sent += data?.data?.length ?? batch.length
            }
        } catch (e: any) {
            errors.push(`Batch ${i / BATCH_SIZE + 1}: ${e.message}`)
            failed += batch.length
        }
    }

    return { sent, failed, errors }
}
