'use strict'

const wrapElementExists = rule => ({ htmlDom, url }) => {
  const element = rule(htmlDom, url);
  if (element) {
    return 'true';
  }

  return false;
};

const wrapMeteredContent = rule => ({ htmlDom, url }) => {
  const contentTeir = rule(htmlDom, url);
  if (contentTeir === "metered") {
    return 'true';
  }

  return false;
}

module.exports = () => {
  const rules = {
    authorTwitter: [
      ({ htmlDom: $, url }) => $('meta[name="twitter:creator"]').attr('content'),
    ],
    canonicalUrl: [
      ({ htmlDom: $, url }) => $('link[rel="canonical"]').attr('href'),
    ],
    paid: [
      wrapMeteredContent($ => $('meta[name="article:content_tier"]').attr('content')),
      wrapElementExists($ => $('article.meteredContent').html()),
    ]
  }

  return rules;
}