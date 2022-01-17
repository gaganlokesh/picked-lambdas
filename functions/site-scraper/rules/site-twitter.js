module.exports = () => ({
  twitter: [
    ({ htmlDom: $ }) => $('meta[name="twitter:site"]').attr('content'),
  ]
})
