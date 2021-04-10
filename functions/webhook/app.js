const crypto = require("crypto");

class UnrecognizedRequestError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

const epochToDateTime = (epoch) => epoch ? new Date(epoch * 1000) : null;

const parseFeedItems = (items) => {
  let feedItems = [];

  if (items.length > 0) {
    feedItems = items.map((item) => ({
      id: crypto.createHash('md5').update(item.id).digest('hex'),
      title: item.title,
      content: item.content,
      url: item.permalinkUrl,
      language: item.language,
      publishedAt: epochToDateTime(item.published),
      updatedAt: epochToDateTime(item.updated),
      tags: item.categories ? item.categories.map(c => c.toLowerCase()) : [],
    }))
  }

  return feedItems;
}

/**
 * Lambda function to process webhook requests from superfeedr.
 * This function parses the request body and creates a list of feed items.
 * 
 * @param {Object} event - Input event to the Lambda function
 * @param {Object} context - Lambda Context runtime methods and attributes
 */
exports.webhook = async (event, context) => {
  const { body, headers } = event;

  if (!body || Object.keys(body).length === 0) {
    console.warn("Empty body provided in request");
    throw new UnrecognizedRequestError("Request body cannot be empty");
  }

  const hmac = crypto.createHmac('sha1', process.env.WEBHOOK_SECRET);
  const signature = `sha1=${hmac.update(JSON.stringify(body)).digest('hex')}`;
  if (headers['x-hub-signature'] !== signature) {
    console.warn('Failed to verify hub signature');
    throw new UnrecognizedRequestError("Failed to verify hub signature");
  }

  if (body.status?.code !== 200 || body.items?.length === 0) {
    // Stop execution
    console.warn("No feed items to process");
    throw new UnrecognizedRequestError("No feed items to process");
  }

  const response = {
    items: parseFeedItems(body.items || [])
  }

  return response;
};
