import Together from "together-ai"

import dotenv from 'dotenv';    
dotenv.config();

const together = new Together();

const model = 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const callWithRetry = async (fn, retries = 5, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (err) {
            if (err.response?.status === 429 && i < retries - 1) {
                console.warn(`Rate limit hit. Retrying in ${delay}ms...`);
                await sleep(delay);
                delay *= 2; // Exponential backoff
            } else {
                throw err;
            }
        }
    }
};

export const promptOnManyMessages = async (prompt, mergingPrompt, messages) => {

    const chunks = [];
    const chunkSize = 1000;
    for (let i = 0; i < messages.length; i += chunkSize) {
        const chunk = messages.slice(i, i + chunkSize);
        chunks.push(chunk);
    }

    console.log('Chunks:', chunks.length);

    const results = [];
    for (const chunk of chunks) {
        const response = await callWithRetry(() =>
            together.chat.completions.create({
                model,
                messages: [
                    {
                        role: 'user',
                        content: prompt.replace('{messages}', chunk.map(m => `${m.sender}: ${m.text}`).join('\n')),
                    },
                ],
                max_tokens: 1000,
                temperature: 1,
                response_format: {
                    type: 'json_object'
                }
            })
        );
        console.log('Response:', response);
        results.push(response.choices[0].message.content);

        console.log("Chunk idx: " + results.length + " / " + chunks.length);

        // Add 1 second delay between each request to respect 60 RPM
        await sleep(1000);
    }

    const mergedResults = await together.chat.completions.create({
        model,
        messages: [
            {
                role: 'user',
                content: mergingPrompt.replace('{parts}', results.join('\n')),
            },
        ],
        max_tokens: 1000,
        temperature: 1,
        response_format: {
            type: 'json_object'
        }
    });

    return JSON.parse(mergedResults.choices[0].message.content);
}
