module.exports = () => ({
  authorTwitter: [
    ({ htmlDom: $ }) => $('meta[property="twitter:creator"]').attr('content'),
    ({ htmlDom: $ }) => $('meta[name="twitter:creator"]').attr('content'),
  ],
});
