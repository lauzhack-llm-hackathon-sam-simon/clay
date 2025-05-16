// clear-and-insert-testing.js

import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const readFileAsync = promisify(fs.readFile);

(async () => {
    
    const path = '/home/poca/Documents/Github/cray/data/your_instagram_activity/messages/inbox';
    const folders = fs.readdirSync(path);

    let count = 0;
    let uniqueUser = 0;

    for (const folder of folders) {
        if (folder.startsWith('instagramuser')) continue;
        let idx = 1;
        let userMessageCount = 0;
        while (fs.existsSync(join(path, folder, `message_${idx}.json`))) {
            const filePath = join(path, folder, `message_${idx}.json`);
            count++;
            idx++;
            const rawData = await readFileAsync(filePath, 'utf-8');
            const jsonData = JSON.parse(rawData);
            const participants = jsonData.participants.map(p => p.name);
            if (participants.length > 2) {
                console.log("Skipping group chat with participants:", participants.length);
                continue;
            } else {
                userMessageCount += jsonData.messages.length;
            }
        }
        if (userMessageCount > 0) {
            console.log(`User ${folder} has ${userMessageCount} messages`);
        } else {
            console.log(`User ${folder} has no messages`);
        }
        uniqueUser++;
    }

    console.log(`Total number of message files: ${count}`);
    console.log(`Total number of unique users: ${uniqueUser}`);

})();
