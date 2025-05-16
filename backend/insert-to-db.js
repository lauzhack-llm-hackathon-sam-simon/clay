// clear-and-insert-testing.js

import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { MongoClient } from 'mongodb';
import { promptOnManyMessages } from './prompt-on-many-msgs.js';

const client = new MongoClient(process.env.MONGODB_URI);
const dbName = 'real_chat_data';
const collectionName = 'messages';

const readFileAsync = promisify(fs.readFile);

(async () => {

    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const path = '/home/poca/Documents/Github/cray/data/your_instagram_activity/messages/inbox';
    const folders = fs.readdirSync(path);

    let count = 0;
    let uniqueUser = 0;

    for (const folder of folders) {
        if (folder.startsWith('instagramuser')) continue;
        let idx = 1;
        let userMessageCount = 0;
        let messages = [];
        let participants = [];
        while (fs.existsSync(join(path, folder, `message_${idx}.json`))) {
            const filePath = join(path, folder, `message_${idx}.json`);
            count++;
            idx++;
            const rawData = await readFileAsync(filePath, 'utf-8');
            const jsonData = JSON.parse(rawData);
            participants = jsonData.participants.map(p => p.name);
            const currentMessages = jsonData.messages
                .filter(m => m.content)
                .map(m => ({
                    sender: m.sender_name,
                    text: m.content,
                    timestamp: m.timestamp_ms,
                }));
            if (currentMessages.length > 0) {
                // await collection.insertMany(currentMessages.map(m => ({
                //     type: 'message',
                //     sender: m.sender,
                //     timestamp: m.timestamp,
                //     message: m.text,
                // })));
            }
            messages = messages.concat(currentMessages);
            if (participants.length > 2) {
                console.log("Skipping group chat with participants:", participants.length);
                continue;
            } else {
                userMessageCount += jsonData.messages.length;
            }
        }

        if (userMessageCount > 0) {
            if (participants.length <= 2) {
                const profile = await promptOnManyMessages(
                    `
You are analyzing a conversation between the following people: ${participants.join(",")}.

Here are some chat messages:
{messages}

Extract the following information in JSON format:

{
    "participants": [...],
    "tone": "...",
    "topics": [...],
    "firstMessageDate": "...",
    "lastMessageDate": "...",
    "frequentEmojis": [...],
    "notableMemories": [
        "Short summary of one memorable moment",
        ...
    ]
}

The "notableMemories" field should contain exactly the 5 most memorable or meaningful messages (in summary form).
            `,
                    `
You are analyzing a conversation between the following people: ${participants.join(", ")}.

You have already analyzed the messages and extracted the following information:
{parts}

Merge the following information in one JSON format:

{
    "participants": [...],
    "category": "",
    "tone": "...",
    "topics": [...],
    "firstMessageDate": "...",
    "lastMessageDate": "...",
    "frequentEmojis": [...],
    "notableMemories": [
        "Short summary of one memorable moment",
        ...
    ]
}
The "notableMemories" field should contain exactly the 5 most memorable or meaningful messages (in summary form).
"category" should be one of the following: "friendship", "romantic", "family", "study", "business", "other".
Choose the most appropriate one.
            `, messages
                )

                fs.writeFileSync(join(path, folder, 'profile.json'), JSON.stringify(profile, null, 4));
            }
            console.log(`User ${folder} has ${userMessageCount} messages`);
        } else {
            console.log(`User ${folder} has no messages`);
        }
        uniqueUser++;
    }

    console.log(`Total number of message files: ${count}`);
    console.log(`Total number of unique users: ${uniqueUser}`);

})();
