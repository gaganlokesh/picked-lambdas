const crypto = require("crypto");
const got = require("got");

const computeSHA256 = (data) => {
  const hmac = crypto.createHmac('sha256', process.env.CALLBACK_SECRET);
  const signature = `sha256=${hmac.update(JSON.stringify(data)).digest('hex')}`;

  return signature;
}

/**
 * @param {Object} event - Input event to the Lambda function
 * @param {Object} context - Lambda Context runtime methods and attributes
 * 
 */
exports.notifier = async (event, context) => {
  if (!event.items || event.items?.length == 0) {
    throw "No items to push";
  }

  const options = {
    method: "POST",
    json: event,
    headers: {
      "x-hub-signature": computeSHA256(event),
    }
  }
  
  return got(process.env.CALLBACK_URL, options)
    .then((res) => {
      console.log("Successfully notified callback URL: ", process.env.CALLBACK_URL);
    })
    .catch((err) => {
      console.warn("Failed to notify callback URL:", err.message);
      throw err;
    })
  ;
};
