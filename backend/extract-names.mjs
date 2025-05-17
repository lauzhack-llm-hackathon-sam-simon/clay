import fs from 'fs';

const rawData = fs.readFileSync('./data/sam-following.json', 'utf-8');
const json = JSON.parse(rawData);

const dataArray = json.relationships_following || json; 

const usernames = dataArray
  .map(entry => entry?.string_list_data?.[0]?.value)
  .filter(Boolean);

console.log('Total followers:', usernames.length);
export const followers = usernames;