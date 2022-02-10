const got = require('got');

const selectors = [
  { tag: 'meta[property="twitter:creator"]', attr: 'content' },
  { tag: 'meta[name="twitter:creator"]', attr: 'content' },
]

const toUsername = (username) => {
  if (username.startsWith('@')) {
    return username.substring(1);
  }

  return username;
}

const fetchTwitterUser = async (username) => {
  try {
    let res = await got(
      `https://api.twitter.com/2/users/by/username/${username}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
        },
        responseType: 'json',
      }
    );

    return res?.body?.data;
  } catch (error) {
    console.error(error);
    return { username: toUsername(username) };
  }
}

const getHandle = async ($) => {
  let username;
  for(let selector of selectors) {
    const value = $(selector.tag)?.attr(selector.attr);
    if (!!value) {
      username = value;
      break;
    };
  }

  if (!username) return null;

  return fetchTwitterUser(toUsername(username));
}

module.exports = () => ({
  authorTwitter: [
    ({ htmlDom: $ }) => getHandle($),
  ],
});
