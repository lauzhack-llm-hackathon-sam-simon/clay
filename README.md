# Clay

## DEMO

**https://www.youtube.com/watch?v=ExMCZ_tYTjI**

[![DEMO](https://img.youtube.com/vi/ExMCZ_tYTjI/0.jpg)](https://www.youtube.com/watch?v=ExMCZ_tYTjI)

## Data processing

You will need Node.js (>= v20).

### Prepare the environment

```
MONGODB_URI=
TOGETHER_API_KEY=
```

> [!IMPORTANT]  
> Do not forget to create the MongoDB Atlas Vector Search index. Please follow [these steps](https://www.mongodb.com/docs/compass/current/indexes/create-vector-search-index/) and use the JSON provided below.

```json
{
  "fields": [
    {
      "numDimensions": 768,
      "path": "embedding",
      "similarity": "cosine",
      "type": "vector"
    }
  ]
}
```

Then, run the following command:

```sh
node parser.js /tmp/instagram-package/your_instagram_activity/messages/inbox simon
```

where the second argument is the path where your Instagram data is located, and the second is your Instagram display name.

## Data querying/vizualisation

Run `npm run dev` in the frontend folder. This will launch the react app!
