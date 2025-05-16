import Together from "together-ai"

import dotenv from 'dotenv';    
dotenv.config();

const together = new Together();

export const promptOnManyMessages = async (prompt, mergingPrompt, messages) => {

    const chunks = [];
    const chunkSize = 70;
    for (let i = 0; i < messages.length; i += chunkSize) {
        const chunk = messages.slice(i, i + chunkSize);
        chunks.push(chunk);
    }

    const results = await Promise.all(chunks.map(async (chunk) => {
        console.log('Chunk:', chunk);
        const response = await together.chat.completions.create({
            model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
            messages: [
                {
                    role: 'user',
                    content: prompt.replace('{messages}', chunk.map(m => `${m.sender}: ${m.text}`).join('\n')),
                },
            ],
            max_tokens: 1000,
            temperature: 0.7,
            response_format: {
                type: 'json_object'
            }
        });
        console.log('Response:', response);
        return response.choices[0].message.content;
    }));

    const mergedResults = await together.chat.completions.create({
        model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
        messages: [
            {
                role: 'user',
                content: mergingPrompt.replace('{parts}', results.join('\n')),
            },
        ],
        max_tokens: 1000,
        temperature: 0.7,
        response_format: {
            type: 'json_object'
        }
    });

    return JSON.parse(mergedResults.choices[0].message.content);
}
