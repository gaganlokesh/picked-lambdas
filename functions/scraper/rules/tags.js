const { isArray, toRule, jsonld } = require("@metascraper/helpers");

const formatTag = tag => {
  return tag.toLowerCase()
    .replace('#', '')
    .trim()
  ;
}

const tags = (values) => isArray(values) && values.map(formatTag);

const toTags = toRule(tags);

const $jsonldRaw = prop => $ => {
  const collection = jsonld($);
  let value;

  collection.find(item => {
    value = item[prop];
    return !!value;
  })

  return value;
}

module.exports = () => ({
  tags: [
    toTags($ => $('meta[name="keywords"]').attr('content')),
    toTags($ => $('article a.tag').toArray().map(el => $(el).text())),
    toTags($jsonldRaw('keywords')),
    toTags($jsonldRaw('applicationCategory')),
  ]
});
