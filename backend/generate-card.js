import fs from 'fs';
import path from 'path';
import axios from 'axios';
import 'dotenv';

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
const INBOX_PATH = './data/inbox';

function getAllMessageFiles(folderPath) {
  const chats = [];
  const folders = fs.readdirSync(folderPath);

  for (const folder of folders) {
    const fullPath = path.join(folderPath, folder, 'message_1.json');
    if (fs.existsSync(fullPath)) {
      chats.push(fullPath);
    }
  }

  return chats;
}

function extractMessages(filepath) {
  const raw = fs.readFileSync(filepath, 'utf-8');
  const json = JSON.parse(raw);
  const participants = json.participants.map(p => p.name);
  const messages = json.messages
    .filter(m => m.content)
    .map(m => ({
      sender: m.sender_name,
      text: m.content,
      timestamp: m.timestamp_ms,
    }));
  return { participants, messages };
}

async function generateChatProfile(participants, messages) {
  const nameList = participants.join(', ');
  const recentMessages = messages
    .slice(0, 100)
    .map(m => `- ${m.sender}: ${m.text}`)
    .join('\n');

  const prompt = `
You are analyzing a conversation between the following people: ${nameList}.

Here are some chat messages:
${recentMessages}

Extract the following information in JSON format:

{
  "participants": [...],
  "tone": "...",
  "topics": [...],
  "firstMessageDate": "...",
  "lastMessageDate": "...",
  "frequentEmojis": [...],
  "notableMemories": [
    "Short summary of one memorable moment",
    ...
  ]
}

The "notableMemories" field should contain exactly the 5 most memorable or meaningful messages (in summary form).
`.trim();

  const res = await axios.post(
    'https://api.together.xyz/inference',
    {
      model: 'mistralai/Mistral-7B-Instruct-v0.1',
      prompt,
      max_tokens: 512,
      temperature: 0.4,
    },
    {
      headers: {
        Authorization: `Bearer ${TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const output = res.data.output.choices?.[0]?.text.trim();
  try {
    return JSON.parse(output);
  } catch (e) {
    console.error(`❌ JSON parse error for chat with: ${nameList}`);
    return { participants, error: true, raw: output };
  }
}

async function main() {
  const files = getAllMessageFiles(INBOX_PATH);
  const chatProfiles = [];

  for (const file of files) {
    const { participants, messages } = extractMessages(file);
    const profile = await generateChatProfile(participants, messages);
    chatProfiles.push(profile);
    console.log(`✅ Profile generated for: ${participants.join(', ')}`);
  }

  fs.writeFileSync('chat_profiles.json', JSON.stringify(chatProfiles, null, 2));
  console.log('\n📁 Saved: chat_profiles.json');
}

main();