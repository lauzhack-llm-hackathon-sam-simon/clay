import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { promptOnManyMessages } from './split-n-merge.js';
import { getProfileCollection, getMessagesCollection } from './mongo-client.js';
import { getEmbedding } from './embedding.js';
import Together from 'together-ai';
import figlet from 'figlet';

const readFileAsync = promisify(fs.readFile);

(async () => {

    console.log(figlet.textSync("Clay Parser"));

    const dataPath = process.argv[2];
    const currentUsername = process.argv[3];

    const flags = process.argv.slice(4);
    const persistenceEnabled = flags.includes('--persistence');

    const messagesCollection = persistenceEnabled ? await getMessagesCollection() : null;
    const profilesCollection = persistenceEnabled ? await getProfileCollection() : null;
    if (persistenceEnabled) {
        await messagesCollection.deleteMany({});
        await profilesCollection.deleteMany({});
    }

    const folders = fs.readdirSync(dataPath);

    let count = 0;
    let uniqueUserCount = 0;

    for (const folder of folders) {
        // these users have been banned from Instagram
        if (folder.startsWith('instagramuser')) continue;

        let idx = 1;
        let userMessageCount = 0;
        let messages = [];
        let participants = [];
        while (fs.existsSync(join(dataPath, folder, `message_${idx}.json`))) {
            const filePath = join(dataPath, folder, `message_${idx}.json`);
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
            const otherUsername = participants.find(p => p !== currentUsername);
            console.log(`[!] Detected ${otherUsername} messages...`);
            if (currentMessages.length > 0) {
                const chunksOf2048 = [];
                for (let i = 0; i < currentMessages.length; i += 2048) {
                    chunksOf2048.push(currentMessages.slice(i, i + 2048));
                }
                console.log(`[..] Generating embeddings for ${chunksOf2048.length} chunks of 2048 messages`);
                const embeddings = await Promise.all(chunksOf2048.map(chunk => getEmbedding(chunk.map(m => m.text))));
                console.log(`[OK] Got ${embeddings.length} embeddings`);
                const collection = await getMessagesCollection();
                if (persistenceEnabled) await collection.insertMany(currentMessages.map((m, i) => ({
                    type: 'message',
                    sender: m.sender,
                    timestamp: m.timestamp,
                    message: m.text,
                    embedding: embeddings[Math.floor(i / 2048)][i % 2048],
                })));
            }
            const photoMessages = jsonData.messages.filter(m => m.photos?.length > 0);
            if (photoMessages.length > 0) {
                console.log(`[!] Got ${photoMessages.length} photos to process...`);
                const photoContents = await Promise.all(photoMessages.map(async (m) => {
                    const photo = m.photos[0];
                    const photoPath = join(dataPath, folder, photo.uri);
                    const photoData = await readFileAsync(photoPath);
                    const base64Content = photoData.toString('base64');
                    const together = new Together();
                    const explanations = await together.chat.completions.create({
                        model: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
                        messages: [
                            {
                                role: "user",
                                content: [
                                    {
                                        type: "text",
                                        text: "Describe the content of the image in detail in 3 sentences."
                                    },
                                    {
                                        type: "image_url",
                                        image_url: {
                                            url: `data:image/jpeg;base64,${base64Content}`,
                                        }
                                    }
                                ]
                            }
                        ]
                    });
                    return explanations.choices[0].message.content;
                }));

                console.log(`[OK] Got ${photoContents.length} photo contents`);

                const photoEmbeddings = await Promise.all(photoContents.map(content => getEmbedding([content])));

                const messagesWithPhotos = photoMessages.map((m, i) => ({
                    type: 'message',
                    sender: m.sender_name,
                    timestamp: m.timestamp_ms,
                    message: `This message is a photo of ${photoContents[i]}`,
                    embedding: photoEmbeddings[i][0],
                }));

                if (persistenceEnabled) await messagesCollection.insertMany(messagesWithPhotos);

                console.log(`Got ${photoEmbeddings.length} photo embeddings`);
            }

            messages = messages.concat(currentMessages);
            console.log(`[OK] Processed ${folder} messages! (${currentMessages.length})`);
            if (participants.length > 2) {
                console.log("[/!\\] Skipping group chat with participants:", participants.length);
                continue;
            } else {
                userMessageCount += jsonData.messages.length;
            }
        }

        if (userMessageCount > 0) {
            if (participants.length <= 2) {
                const basePrompt = fs.readFileSync('./profile-card-prompt.txt', 'utf-8');
                const profile = await promptOnManyMessages(
                    `
You are analyzing a conversation between the following people: ${participants.join(",")}.
user is ${currentUsername}.

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
                );

                if (persistenceEnabled) (await getProfileCollection()).insertOne({
                    type: 'profile',
                    username: participants.find(p => p !== currentUsername),
                    participants: participants,
                    profile: profile,
                    messageCount: userMessageCount,
                });
            }
            console.log(`[OK] Processed ${folder}'s profile!`);
        } else {
            console.log(`[WARN] User ${folder} has no messages`);
        }
        uniqueUserCount++;
    }

    console.log(`We are done!`);

    process.exit(0);

})();
