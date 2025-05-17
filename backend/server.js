import express from 'express'
import dotenv from 'dotenv'
dotenv.config()

import { getMessagesCollection, getProfileCollection } from './mongo-client.js'
import { getEmbedding } from './embedding.js'
import cors from 'cors';
import Together from 'together-ai'

const app = express()
app.use(cors());

app.get('/initial', async (req, res) => {

    const collection = await getProfileCollection();

    const topN = 10;
    const profiles = await collection.find({})
        .sort({ "messageCount": -1 })
        .limit(2).toArray();
    console.log('Profiles:', profiles);

    res.json({ data: profiles });

});

app.get('/query', async (req, res) => {
    const { text } = req.query;

    console.log('Received text:', text);
    const [embedding] = await getEmbedding([text]);

    const collection = await getMessagesCollection();

    const agg = [
        {
            '$vectorSearch': {
                'index': 'vector_index_2',
                'path': 'embedding',
                'queryVector': embedding,
                'numCandidates': 150,
                'limit': 10
            }
        }, {
            '$project': {
                '_id': 0,
                'sender': 1,
                'message': 1,
                'score': {
                    '$meta': 'vectorSearchScore'
                }
            }
        }
    ];

    const result = collection.aggregate(agg);

    const usernames = new Set();
    const messages = [];
    for await (const doc of result) {
        console.log(doc);
        if (doc.score < 0.7) continue;
        usernames.add(doc.sender);
        messages.push(doc);
    }

    const prompt = `
You are a social media analyst. You have to analyze the following messages and answer the question.

If the answer comes from a photo, please specify that in the answer.

Question: ${text}

Messages:
${messages.map(m => `${m.sender}: ${m.message}`).join('\n')}
`

    const together = new Together();
    const response = await together.chat.completions.create({
        model: "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
        messages: [
            {
                role: 'user',
                content: prompt
            },
        ],
        max_tokens: 1000,
        temperature: 1
    })
    const responseText = response.choices[0].message.content;

    console.log(Array.from(usernames))

    const profilesOfActors = await (await getProfileCollection()).find({ username: { $in: Array.from(usernames) } }).toArray();
    console.log('Profiles of actors:', profilesOfActors);

    const metadata = `Found ${messages.length} relevant messages and photos from ${Array.from(usernames).length} users.`;

    res.json({ message: 'Query received', newProfiles: profilesOfActors, metadata, response: responseText });

    console.log('end');
})

app.listen(4000)
