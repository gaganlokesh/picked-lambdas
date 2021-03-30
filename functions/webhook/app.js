/**
 * @param {Object} event - Input event to the Lambda function
 * @param {Object} context - Lambda Context runtime methods and attributes
 * 
 */
exports.webhook = async (event, context) => {
  console.log(event.body);
  response = {
    'statusCode': 200,
    'body': JSON.stringify({
      message: 'hello world'
    })
  }

  return response;
};
