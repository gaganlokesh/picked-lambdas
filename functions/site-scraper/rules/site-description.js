const { toRule, description } = require('@metascraper/helpers')

module.exports = opts => {
  const toDescription = toRule(description, opts)

  return {
    description: [
      toDescription($ => $('meta[name="description"]').attr('content')),
      toDescription($ => $('meta[property="og:description"]').attr('content')),
      toDescription($ => $('meta[name="twitter:description"]').attr('content')),
      toDescription($ =>
        $('meta[property="twitter:description"]').attr('content')
      ),
    ]
  }
}
