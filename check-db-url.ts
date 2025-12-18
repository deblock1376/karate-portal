import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const match = content.match(/^DATABASE_URL=(.*)$/m);
    if (match) {
        const url = match[1].trim().replace(/^["']|["']$/g, '');
        console.log(`DATABASE_URL prefix: ${url.substring(0, 15)}...`);
        console.log(`DATABASE_URL contains 'localhost'? ${url.includes('localhost')}`);
        console.log(`DATABASE_URL contains 'dev.db'? ${url.includes('dev.db')}`);
    } else {
        console.log('DATABASE_URL not found in .env');
    }
} else {
    console.log('.env not found');
}
