import dotenv from 'dotenv';
dotenv.config();

import { MongoClient } from 'mongodb';
import axios from 'axios';

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
const MONGODB_URI = process.env.MONGODB_URI;

const client = new MongoClient(MONGODB_URI);
const clientConn = await client.connect();
const db = clientConn.db("chat_data");
const collection = db.collection("messages");

await collection.createSearchIndexes([
  {
    name: 'ChatSemanticIndex',
    definition: {
      fields: [
        {
          type: 'vector',
          path: 'embedding',
          numDimensions: 768,
          similarity: 'cosine',
        },
      ],
    },
  },
]);