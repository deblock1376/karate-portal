import fs from 'fs';
import path from 'path';

const files = ['.env', '.env.local', '.env.development.local', '.env.test.local', '.env.production.local'];

files.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
        console.log(`\nKeys in ${file}:`);
        const content = fs.readFileSync(filePath, 'utf-8');
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=/);
            if (match) {
                console.log(match[1].trim());
            }
        });
    } else {
        console.log(`\n${file} not found.`);
    }
});
