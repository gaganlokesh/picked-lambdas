const createBrowserless = require('browserless')
const chromium = require('chrome-aws-lambda')
const metascraper = require('metascraper')([
  require('metascraper-logo-favicon')(),
  require('./rules/site-name.js')(),
  require('./rules/site-description.js')(),
  require('./rules/site-twitter.js')(),
  require('./rules/feed-url.js')(),
]);

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

exports.siteScraper = async (event, context) => {
  const { url } = event;
  const html = await getHtml(url);

  if (!html) return {};

  const metadata = await metascraper({ html, url });

  return {
    url,
    ...metadata
  };
}
