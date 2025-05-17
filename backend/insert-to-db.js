// clear-and-insert-testing.js

import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { promptOnManyMessages } from './prompt-on-many-msgs.js';
import { getCollection } from './mongo-client.js';
import { getEmbedding } from './embedding.js';

const readFileAsync = promisify(fs.readFile);

(async () => {

    const path = '/Users/poca/Documents/Github/cray/data_cleanedup/your_instagram_activity/messages/inbox';
    let user = "simon";
    const folders = fs.readdirSync(path);

    let count = 0;
    let uniqueUser = 0;

    for (const folder of folders) {
        if (folder.startsWith('instagramuser')) continue;
        // todo debug
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
                const chunksOf2048 = [];
                for (let i = 0; i < currentMessages.length; i += 2048) {
                    chunksOf2048.push(currentMessages.slice(i, i + 2048));
                }
                console.log(`Processing ${chunksOf2048.length} chunks of 2048 messages`);
                const embeddings = await Promise.all(chunksOf2048.map(chunk => getEmbedding(chunk.map(m => m.text))));
                console.log(`Got ${embeddings.length} embeddings`);
                const collection = await getCollection();
                await collection.insertMany(currentMessages.map((m, i) => ({
                    type: 'message',
                    sender: m.sender,
                    timestamp: m.timestamp,
                    message: m.text,
                    embedding: embeddings[Math.floor(i / 2048)][i % 2048],
                })));
            }
            messages = messages.concat(currentMessages);
            console.log(`User ${folder} has ${currentMessages.length} messages`);
            if (participants.length > 2) {
                console.log("Skipping group chat with participants:", participants.length);
                continue;
            } else {
                userMessageCount += jsonData.messages.length;
            }
        }

        if (userMessageCount > 0) {
            if (participants.length <= 2) {
                const basePrompt = `
Extract the following information in JSON format:

{
    "participants": [...], // example ["Alice", "Bob"]
    "tone": "...",
    "topics": [...], // example ["travel", "food", ...]
    "status", // one of "stale", "critical", "endangered", "stable", "healthy"
    "notableMemories": [
        "In January 2024, you laughed together when you both misheard the same word during a late-night call.",
        ...
    ]
}

The "notableMemories" field should contain exactly the 5 most memorable or meaningful moments (in summary form).
Avoid generic facts. Make it feel personal and evocative.
"category" should be one of the following: "friendship", "romantic", "family", "study", "business", "other".
Choose the most appropriate one.

status depends on the quality of the conversation, and the frequency of messages exchanged.

You are sending this data to ${user}, so use "you" to refer to them, and "them" to refer to the other person.
                `;
                const profile = await promptOnManyMessages(
                    `
You are analyzing a conversation between the following people: ${participants.join(",")}.
user is ${user}.

Here are some chat messages:
{messages}

${basePrompt}
            `,
                    `
You are analyzing a conversation between the following people: ${participants.join(", ")}.

You have already analyzed the messages and extracted the following information:
{parts}

${basePrompt}
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
