// RAG Chat Assistant using MongoDB Atlas and Together AI (JavaScript version)

import dotenv from 'dotenv';
dotenv.config();

import { MongoClient } from 'mongodb';
import axios from 'axios';

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
const MONGODB_URI = process.env.MONGODB_URI;
const EMBEDDING_MODEL = 'togethercomputer/m2-bert-80M-8k-retrieval';
const GENERATION_MODEL = 'togethercomputer/llama-2-70b-chat';
const VECTOR_DIM = 768;

const client = new MongoClient(MONGODB_URI);
const dbName = 'chat_data';
const collectionName = 'messages';

async function generateEmbedding(texts) {
    const response = await axios.post(
        'https://api.together.xyz/v1/embeddings',
        {
            input: texts,
            model: EMBEDDING_MODEL,
        },
        {
            headers: {
                Authorization: `Bearer ${TOGETHER_API_KEY}`,
                'Content-Type': 'application/json',
            },
        }
    );
    return response.data.data.map((d) => d.embedding);
}

async function storeChatData(chat) {
    const clientConn = await client.connect();
    const db = clientConn.db(dbName);
    const collection = db.collection(collectionName);

    for (const msg of chat) {
        const exists = await collection.findOne({ message: msg.text, timestamp: msg.timestamp });
        if (exists) continue;

        const [embedding] = await generateEmbedding([msg.text]);
        await collection.insertOne({
            type: 'message',
            sender: msg.sender,
            timestamp: msg.timestamp,
            message: msg.text,
            embedding,
        });
    }

    const mergedText = chat.map((m) => `${m.sender}: ${m.text}`).join('\n');
    const [blockEmbedding] = await generateEmbedding([mergedText]);

    await collection.insertOne({
        type: 'thread',
        participants: [...new Set(chat.map((m) => m.sender))],
        start_time: chat[0].timestamp,
        end_time: chat[chat.length - 1].timestamp,
        messages: chat,
        merged_text: mergedText,
        embedding: blockEmbedding,
    });
}

async function search(query, searchType = 'auto', limit = 5) {
    const [queryEmb] = await generateEmbedding([query]);
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    if (searchType === 'auto') {
        const lower = query.toLowerCase();
        if (lower.includes('pourquoi') || lower.includes('relation') || lower.includes('ensemble') || lower.includes('moins bien')) {
            searchType = 'thread';
        } else {
            searchType = 'message';
        }
    }

    const pipeline = [
        {
            $vectorSearch: {
                index: 'ChatSemanticIndex',
                path: 'embedding',
                queryVector: queryEmb,
                numCandidates: 50,
                limit,
                filter: { type: searchType },
            },
        },
    ];

    return await collection.aggregate(pipeline).toArray();
}

async function generateAnswer(query) {
    const hits = await search(query);
    if (!hits.length) return "Désolé, je n'ai rien trouvé.";

    const context = hits.map((doc) => doc.message || doc.merged_text).join('\n\n');
    const prompt = `Voici des extraits de conversation :\n\n${context}\n\nQuestion : ${query}\nRéponds de manière claire et basée sur les données.`;

    const response = await axios.post(
        'https://api.together.xyz/inference',
        {
            prompt,
            model: GENERATION_MODEL,
            max_tokens: 300,
            temperature: 0.7,
            stop: ['\n\n'],
        },
        {
            headers: {
                Authorization: `Bearer ${TOGETHER_API_KEY}`,
                'Content-Type': 'application/json',
            },
        }
    );

    return response.data.output.choices[0].text;
}

const clearDb = async () => {
    const clientConn = await client.connect();
    const db = clientConn.db(dbName);
    const collection = db.collection(collectionName);
    await collection.deleteMany({});
    console.log('Database cleared');
}

// Example usage
(async () => {
    const messages = [
        { sender: 'Sam', timestamp: new Date('2024-05-01T10:00:00Z'), text: 'J\'adore le moelleux au chocolat.' },
        { sender: 'Moi', timestamp: new Date('2024-05-02T11:00:00Z'), text: 'Tu veux aller au café ce soir ?' },
        { sender: 'Sam', timestamp: new Date('2024-05-02T11:05:00Z'), text: 'Pas trop motivé ces temps-ci...' },
        { sender: 'Moi', timestamp: new Date('2024-05-03T12:00:00Z'), text: 'On se parle moins ces derniers jours.' },
    ];

    // remove all messages from the database
    // await clearDb();

    //await storeChatData(messages);
    const question = "J'adore Sam?";
    const answer = await generateAnswer(question);
    console.log(answer);
})();