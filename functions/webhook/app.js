const crypto = require("crypto");

class UnrecognizedRequestError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

const buildFeedItems = (items) => {
  if (!items || items?.length === 0) return [];

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    // content: item.content_text || item.content_html,
    url: item.url,
    language: item.language,
    tags: item.tags ? item.tags.map(tag => tag.toLowerCase()) : [],
    publishedAt: item.date_published,
    updatedAt: item.date_modified,
  }))
}

/**
 * Lambda function to process webhook requests from feeder.
 * This function parses the request body and creates a list of feed items.
 *
 * @param {Object} event - Input event to the Lambda function
 * @param {Object} context - Lambda Context runtime methods and attributes
 */
exports.webhook = async (event, context) => {
  const { body, headers, params } = event;

  if (!body || Object.keys(body).length === 0) {
    console.warn("Empty body provided in request");
    throw new UnrecognizedRequestError("Request body cannot be empty");
  }

  const hmac = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET);
  const signature = `sha256=${hmac.update(JSON.stringify(body)).digest('hex')}`;
  if (headers['x-hub-signature'] !== signature) {
    console.warn('Failed to verify hub signature');
    throw new UnrecognizedRequestError("Failed to verify hub signature");
  }

  if (!body.items || body.items?.length === 0) {
    // Stop execution
    console.warn("No feed items to process");
    throw new UnrecognizedRequestError("No feed items to process");
  }

  return {
    sourceId: params.sourceId,
    items: buildFeedItems(body.items)
  };
};
