const got = require('got');
const metascraper = require('metascraper')([
  require('metascraper-author')(),
  require('metascraper-image')(),
  require('metascraper-lang')(),
  require('./scraper-rules.js')()
]);
const { Readability, isProbablyReaderable } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');
const readingTime = require('reading-time');


const getReadabilityMeta = (htmlString, url) => {
  const { document } = (new JSDOM(htmlString, { url })).window;

  if (isProbablyReaderable(document)) {
    const readability = new Readability(document);
    try {
      return readability.parse();
    } catch (e) {
      console.warn(e);
      return {};
    }
  }

  return {};
}

const scrapeMetadata = async ({ url: targetUrl, content }) => {
  const { body: html, url } = await got(targetUrl);
  const metadata = await metascraper({ html, url });
  const readabilityMeta = getReadabilityMeta(html, url);
  let articleContent = content || readabilityMeta.content || null;
  let readTime = articleContent ? readingTime(articleContent).minutes : null;

  return {
    ...metadata,
    paid: metadata.paid === 'true' ? true : false,
    readTime,
  };
}

/**
 * @param {Object} event - Input event to the Lambda function
 * @param {Object} context - Lambda Context runtime methods and attributes
 *
 * @returns {Object} object - Enriched feed item
 * 
 */
exports.scraper = async (event, context) => {
  return scrapeMetadata(event)
    .then((res) => {
      return {
        ...event,
        ...res,
      }
    });
};