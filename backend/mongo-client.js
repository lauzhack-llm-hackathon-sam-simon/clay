import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI);
const dbName = 'real_chat_data_2';
const collectionName = 'messages';

let connected = false;

export const getMessagesCollection = async () => {
    if (!connected) {
        await client.connect();
        connected = true;
    }
    const db = client.db(dbName);
    return db.collection(collectionName);
}

export const getProfileCollection = async () => {
    if (!connected) {
        await client.connect();
        connected = true;
    }
    const db = client.db(dbName);
    return db.collection('profiles');
}
