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

const getEmbedding = async (texts) => {
    const together = new Together();

    const response = await together.embeddings.create({
        model: 'togethercomputer/m2-bert-80M-8k-retrieval',
        input: texts
    });

    //console.log('Embedding generated');
    //console.log(response.data);

    return response.data.map((d) => d.embedding);
};

const messages = [
    { text: "The dog is in the garden." },
    { text: "The cat is on the roof." },
    { text: "Cats usually drink milk." },
    { text: "Friends often enjoy going on walks with their dogs." },
    { text: "Chocolate cake is my favorite dessert." },
    { text: "He asked her about the concert." },
    { text: "She loves playing the violin." },
    { text: "The bakery opens at 6 a.m." }
];

// Example usage
const getBestResults = async (query) => {

    console.log('Query:', query);
    // do a vector search

    const [embedding] = await getEmbedding([query]);
    //console.log(embedding);

    // define pipeline

    const agg = [
        {
            '$vectorSearch': {
                'index': 'vector_index',
                'path': 'embedding',
                'queryVector': embedding,
                'numCandidates': 150,
                'limit': 10
            }
        }, {
            '$project': {
                '_id': 0,
                'message': 1,
                'score': {
                    '$meta': 'vectorSearchScore'
                }
            }
        }
    ];

    // run pipeline
    const result = collection.aggregate(agg);

    // print results
    console.log('Results:');
    for await (const doc of result) {
        console.log(doc);
    }
}

for (const message of messages) {
    await getBestResults(message.text);
}
