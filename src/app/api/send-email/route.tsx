import { Resend } from 'resend';
import { WelcomeEmail } from '@/components/emails/WelcomeEmail';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');

export async function POST(request: Request) {
    try {
        const { to, subject, type, data } = await request.json();

        if (!to || !subject || !type) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
        }

        let emailComponent;

        switch (type) {
            case 'welcome':
                emailComponent = <WelcomeEmail name={data.name} />;
                break;
            default:
                return new Response(JSON.stringify({ error: 'Invalid email type' }), { status: 400 });
        }

        const { data: emailData, error } = await resend.emails.send({
            from: 'Karate Portal <onboarding@resend.dev>', // Default Resend testing domain
            to: [to],
            subject: subject,
            react: emailComponent,
        });

        if (error) {
            return new Response(JSON.stringify({ error }), { status: 500 });
        }

        return new Response(JSON.stringify(emailData), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}
