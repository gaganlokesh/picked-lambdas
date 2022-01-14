const createBrowserless = require('browserless');
const chromium = require('chrome-aws-lambda');
const metascraper = require('metascraper')([
  require('metascraper-author')(),
  require('metascraper-image')(),
  require('metascraper-lang')(),
  require('./rules/author-twitter.js')(),
  require('./rules/canonical-url.js')(),
  require('./rules/metered-content.js')(),
  require('./rules/tags.js')(),
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

const getHtml = async (url) => {
  let browserlessFactory, browserless;
  let html = null;

  try {
    const executablePath = await chromium.executablePath;
    browserlessFactory = createBrowserless({
      executablePath,
      timeout: 30000,
      headless: true,
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      ignoreHTTPSErrors: true,
    });
    browserless = await browserlessFactory.createContext();

    html = await browserless.html(url);
  } catch (error) {
    console.error(error);
  } finally {
    console.log("Destroying context and closing browser...");
    if (browserless) await browserless.destroyContext();
    if (browserlessFactory) await browserlessFactory.close();
  }

  return html;
}

const scrapeMetadata = async ({ url, content }) => {
  const html = await getHtml(url);
  if (!html) return {};

  const metadata = await metascraper({ html, url });
  const readabilityMeta = getReadabilityMeta(html, url);
  let articleContent = content || readabilityMeta?.content || null;
  let readTime = articleContent ? readingTime(articleContent).minutes : null;

  return {
    ...metadata,
    metered: metadata.metered === 'true' ? true : false,
    readTime,
  };
}

/**
 * @param {Object} event - Input event to the Lambda function
 * @param {Object} context - Lambda Context runtime methods and attributes
 *
 * @returns {Object} object - Enriched feed item with metadata
 *
 */
exports.scraper = async (event, context) => {
  const metadata = await scrapeMetadata(event);

  return {
    ...event,
    ...metadata,
    tags: event.tags?.length > 0 ? event.tags : (metadata?.tags || []),
  }
};
