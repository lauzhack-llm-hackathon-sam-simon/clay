import express from 'express'
import dotenv from 'dotenv'
dotenv.config()

import { getCollection } from './mongo-client.js'
import { getEmbedding } from './embedding.js'

const app = express()

app.get('/query', async (req, res) => {
  const { text } = req.query;
  
  console.log('Received text:', text);
  const [embedding] = await getEmbedding([text]);

  const collection = await getCollection();
  
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

    console.log('Results:');
    for await (const doc of result) {
        console.log(doc);
    }

  res.json({ message: 'Query received', embedding });

  console.log('end');
})

app.listen(4000)
