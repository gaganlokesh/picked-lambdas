const { toRule, $jsonld } = require('@metascraper/helpers');

const metered = (value) => {
  return ['metered', 'locked'].includes(value) ? 'true' : undefined;
}

const toMetered = toRule(metered);

const needsMediumMembership = rule => ({ htmlDom, url }) => {
  const isAccessibleForFree = rule(htmlDom, url);

  return isAccessibleForFree === 'False' ? 'true' : undefined;
}

module.exports = () => ({
  metered: [
    toMetered($ => $('meta[property="article:content_tier"]').attr('content')),
    toMetered($ => $('meta[name="article:content_tier"]').attr('content')),
    needsMediumMembership($jsonld('isAccessibleForFree')),
  ],
})
