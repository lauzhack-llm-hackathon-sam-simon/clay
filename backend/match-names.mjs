import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { followers } from './extract-names.mjs';
import 'dotenv/config';

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inboxPath = path.join(__dirname, '../data/inbox');
const folders = fs.readdirSync(inboxPath, { withFileTypes: true });

const chatNames = folders
  .filter(dirent => dirent.isDirectory() && dirent.name.includes('_'))
  .map(dirent => {
    const name = dirent.name;
    const lastUnderscoreIndex = name.lastIndexOf('_');
    return name.slice(0, lastUnderscoreIndex);
  });

console.log("names");
console.log(chatNames);
console.log("--------------------------------");
console.log(followers);

function preMatch(chatName, followers) {
  const normalizedChatName = chatName.toLowerCase();

  // First try exact match
  for (const f of followers) {
    const normalizedFollower = f.toLowerCase();
    if (normalizedFollower === normalizedChatName) {
      return { match: f, type: 'exact' };
    }
  }

  // Then try partial match
  for (const f of followers) {
    const normalizedFollower = f.toLowerCase();
    if (normalizedFollower.includes(normalizedChatName) || normalizedChatName.includes(normalizedFollower)) {
      return { match: f, type: 'partial' };
    }
  }

  return null;
}  

async function guessUsername(chatName, candidates) {
  const prompt = `You are matching chat names to Instagram usernames.
Your task is to choose the most likely Instagram username from the list of candidates that matches the chat name below.

Chat name: "${chatName}"
Candidates: [${candidates.map(c => `"${c}"`).join(', ')}]
Which username most likely matches this chat name? Answer with one username from the list above, or "unknown" if no clear match.\n\nAnswer:`;

  const res = await axios.post(
    'https://api.together.xyz/inference',
    {
      model: 'mistralai/Mistral-7B-Instruct-v0.1',
      prompt,
      max_tokens: 10,
      temperature: 0.3,
      stop: ['\n']
    },
    {
      headers: {
        Authorization: `Bearer ${TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return res.data.output.choices[0].text.trim();
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const results = [];

for (const name of chatNames) {
  const preMatched = preMatch(name, followers);
  let guess;

  if (preMatched) {
    guess = preMatched.match;
    console.log(`✅ ${preMatched.type === 'exact' ? 'Exact' : 'Partial'} match: ${name} → ${guess}`);
  } else {
    guess = await guessUsername(name, followers);
    console.log(`🤖 LLM-matched: ${name} → ${guess}`);
    await delay(1100);
  }

  results.push({
    name,
    guess,
    matchType: preMatched ? preMatched.type : 'llm'
  });

  await delay(1000);
}

// fs.writeFileSync('matched_usernames.json', JSON.stringify(results, null, 2));
// console.log('\n✅ matched_usernames.json');