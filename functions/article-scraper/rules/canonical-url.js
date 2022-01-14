module.exports = () => ({
  canonicalUrl: [
    ({ htmlDom: $ }) => $('link[rel="canonical"]').attr('href'),
  ],
});
