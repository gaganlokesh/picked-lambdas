const { toRule, url: urlFn } = require('@metascraper/helpers')

const toUrl = toRule(urlFn);

module.exports = () => ({
  feedUrl: [
    // Rules for RSS, Atom, etc.
    toUrl($ => $('link[rel="alternate"][type="application/rss+xml"]').attr('href')),
    toUrl($ => $('link[rel="alternate"][type="application/atom+xml"]').attr('href')),
    toUrl($ => $('link[rel="alternate"][type="application/rdf+xml"]').attr('href')),
    toUrl($ => $('link[rel="alternate"][type="application/feed+json"]').attr('href')),
    toUrl($ => $('link[rel="alternate"][type="application/json"]').attr('href')),
    toUrl($ => $('link[rel="feed"]').attr('href')),
    toUrl($ => $('link[rel="feed alternate"][type="application/rss+xml"]').attr('href')),
    toUrl($ => $('link[rel="feed alternate"][type="application/atom+xml"]').attr('href')),
    toUrl($ => $('link[rel="alternate feed"][type="application/rss+xml"]').attr('href')),
    toUrl($ => $('link[rel="alternate feed"][type="application/atom+xml"]').attr('href'))
  ]
})
