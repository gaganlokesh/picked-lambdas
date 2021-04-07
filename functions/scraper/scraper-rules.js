'use strict'

const { isArray, jsonld, toRule } = require('@metascraper/helpers');

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

const formatTag = tag => {
  return tag.toLowerCase()
    .replace('#', '')
    .trim()
}

const tags = (values) => isArray(values) && values.map(formatTag)

const toTags = toRule(tags);

const wrapMediumTags = rule => ({ htmlDom, url }) => {
  const keywords = rule(htmlDom);
  const PREFIX = "Tag:";

  if (!keywords || !isArray(keywords)) return false;

  return keywords
      .filter(keyword => keyword.includes(PREFIX))
      .map(keyword => keyword.replace(PREFIX, ''))
      .map(formatTag)
}

const $jsonldRaw = prop => $ => {
  const collection = jsonld($);
  let value;

  collection.find(item => {
    value = item[prop];
    return !!value;
  })

  return value;
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
    ],
    tags: [
      toTags($ => $('meta[name="keywords"]').attr('content')?.split(',')),
      toTags($ => $('article a.tag').toArray().map(el => $(el).text())),
      wrapMediumTags($jsonldRaw('keywords')),
      toTags($jsonldRaw('applicationCategory')),
    ]
  }

  return rules;
}