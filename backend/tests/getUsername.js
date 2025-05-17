import fs from 'fs';

const rawData = fs.readFileSync('../data/sam-following.json', 'utf-8');
const json = JSON.parse(rawData);

const rawData = fs.readFileSync(filePath, 'utf-8');
const jsonData = JSON.parse(rawData);

const usernames = jsonData
  .map(entry => entry?.string_list_data?.[0]?.value)
  .filter(Boolean);

console.log(usernames);
