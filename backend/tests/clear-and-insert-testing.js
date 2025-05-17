// clear-and-insert-testing.js

import dotenv from 'dotenv';
dotenv.config();

import { MongoClient } from 'mongodb';

import Together from "together-ai";

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
const MONGODB_URI = process.env.MONGODB_URI;
const VECTOR_DIM = 768;

const client = new MongoClient(MONGODB_URI);
const dbName = 'chat_data';
const collectionName = 'messages';

const db = client.db(dbName);
const collection = db.collection(collectionName);
const clearDb = async () => {
    await client.connect();
    await collection.deleteMany({});
    console.log('Database cleared');
};

const insertDummyData = async (data) => {
    await client.connect();
    await collection.insertMany(data);
    console.log('Dummy data inserted');
};

const getEmbedding = async (texts) => {
    const together = new Together();

    const response = await together.embeddings.create({
        model: 'togethercomputer/m2-bert-80M-8k-retrieval',
        input: texts
    });

    console.log('Embedding generated');
    console.log(response.data);

    return response.data.map((d) => d.embedding);
};

// Example usage
(async () => {
    const messages = [
        { text: "The dog is in the garden." },
        { text: "The cat is on the roof." },
        { text: "Sam likes playing the violin." },
    ];

   const embeddings = await getEmbedding(messages.map((msg) => msg.text));
   console.log(embeddings);

    const dummyData = messages.map((msg, index) => ({
        type: 'message',
        message: msg.text,
        embedding: embeddings[index] || Array(VECTOR_DIM).fill(0), // Use generated embedding or dummy
    }));


    await clearDb();
    await insertDummyData(dummyData);
    console.log('Dummy data inserted');
})();