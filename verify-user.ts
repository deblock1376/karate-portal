import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Manual .env loading
try {
    const files = ['.env', '.env.local'];
    files.forEach(file => {
        const envPath = path.resolve(process.cwd(), file);
        if (fs.existsSync(envPath)) {
            console.log(`Loading ${file}...`);
            const envConfig = fs.readFileSync(envPath, 'utf-8');
            envConfig.split('\n').forEach(line => {
                const [key, ...values] = line.split('=');
                if (key && values.length > 0) {
                    const value = values.join('=').trim().replace(/^["']|["']$/g, '');
                    if (!process.env[key.trim()]) {
                        process.env[key.trim()] = value;
                    }
                }
            });
        }
    });
} catch (e) {
    console.error('Failed to load env files', e);
}

const prisma = new PrismaClient();

async function main() {
    const email = 'sensei@dojo.com';
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.log(`❌ User ${email} NOT FOUND in database.`);
    } else {
        console.log(`✅ User found:`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Password in DB: "${user.password}"`); // exposing for debugging
        console.log(`   Belt: ${user.currentBeltId}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
