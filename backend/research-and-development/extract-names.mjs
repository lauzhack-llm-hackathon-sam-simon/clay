import fs from 'fs';

function extractUsernamesFromFile(filePath) {
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const json = JSON.parse(rawData);
  const dataArray = json.relationships_following || json.relationships_followers || json;

  return dataArray
    .map(entry => entry?.string_list_data?.[0]?.value)
    .filter(Boolean);
}

const following = extractUsernamesFromFile('../data/sam-following.json');
const rawFollowers = extractUsernamesFromFile('../data/sam-followers.json');

const allUsernames = Array.from(new Set([...following, ...rawFollowers]));

console.log('Total unique usernames (followers + following):', allUsernames.length);

export const followers = allUsernames;