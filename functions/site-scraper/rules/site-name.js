const { $filter, title, toRule } = require('@metascraper/helpers')

const toTitle = toRule(title, { removeSeparator: true })

module.exports = () => ({
  name: [
    // For Forem instances
    toTitle($ => $('meta[property="forem:name"]').attr('content')),

    toTitle($ => $('meta[property="og:title"]').attr('content')),
    toTitle($ => $('meta[name="twitter:title"]').attr('content')),
    toTitle($ => $('meta[property="twitter:title"]').attr('content')),
    toTitle($ => $('meta[property="og:site_name"]').attr('content')),
    toTitle($ => $filter($, $('title'))),
  ]
})
