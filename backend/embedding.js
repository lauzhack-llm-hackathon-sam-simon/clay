import Together from "together-ai";

export const getEmbedding = async (texts) => {
    const together = new Together();

    const response = await together.embeddings.create({
        model: 'togethercomputer/m2-bert-80M-8k-retrieval',
        input: texts
    });

    return response.data.map((d) => d.embedding);
};
