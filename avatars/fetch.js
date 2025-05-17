import fetch from 'node-fetch';
import fs from 'node:fs';
import path from 'node:path';

const avatars = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'followers.json'), 'utf8'));

const fetchAvatar = async (username) => {
  if (fs.existsSync(path.join(process.cwd(), 'data', `${username}.jpg`))) {
    console.log(`Avatar for ${username} already exists.`);
    return;
  }
  const url = `https://instagram-social-api.p.rapidapi.com/v1/info?username_or_id_or_url=${username}`;
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': '31c6f83e9bmsh539cf0ca1776e37p16b88fjsne3ad66bf78fd',
      'x-rapidapi-host': 'instagram-social-api.p.rapidapi.com'
    }
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    const avatarUrl = result.data.profile_pic_url_hd;
    console.log(`Fetching avatar for ${username}...`);
    console.log(`Avatar URL: ${avatarUrl}`);
    await fetch(avatarUrl)
      .then(res => {
        const dest = fs.createWriteStream(path.join(process.cwd(), 'data', `${username}.jpg`));
        res.body.pipe(dest);
        dest.on('finish', () => {
          console.log(`Avatar for ${username} saved.`);
        });
      })
      .catch(err => {
        console.error(`Error saving avatar for ${username}:`, err);
      });
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}

const fetchAvatars = async () => {
  for (const avatar of avatars) {
    const { string_list_data } = avatar;
      await fetchAvatar(string_list_data[0].value);
    }
};
fetchAvatars();
