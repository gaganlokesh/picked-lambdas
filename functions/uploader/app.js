const crypto = require('crypto');
const got = require('got');
const sharp = require('sharp');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getPlaiceholder } = require('plaiceholder');

const getImage = async (url) => {
  return got(url, { responseType: 'buffer' })
    .then(res => {
      return res.body;
    })
    .catch(err => {
      console.warn("Error downloading image:", err);
      throw err;
    })
  ;
}

const uploadImage = async (buffer, metadata) => {
  const keyPrefix = process.env.IMAGE_PREFIX;
  const keyName = crypto.createHash('md5')
    .update(buffer, 'utf8')
    .digest('hex');
  const key = `${keyPrefix}${keyName}.${metadata.format}`
  let objectParams = {
    Bucket: process.env.IMAGE_BUCKET,
    Key: key,
    ACL: 'public-read',
    Body: buffer,
    // Metadata: metadata,
  }
  const s3 = new S3Client({ region: process.env.BUCKET_REGION });

  console.log(`Starting upload for ${key}`)
  return s3.send(new PutObjectCommand(objectParams))
    .then(res => {
      console.log('Upload successful!', res);
      return key;
    })
    .catch(err => {
      console.warn("Failed to upload image:", err);
      throw err;
    })
}

/**
 * @param {Object} event - Input event to the Lambda function
 * @param {Object} context - Lambda Context runtime methods and attributes
 *
 * @returns {Object} object - Object containing feed item along with uploaded links
 * 
 */
exports.uploader = async (event, context) => {
  if (!event.image) {
    console.warn("No image to upload")
    return event;
  }

  return getImage(event.image)
    .then(buffer => {
      const image = sharp(buffer);
      
      const uploadPromise = image.metadata().then(metadata => {
        const meta = {
          format: metadata.format,
          width: metadata.width,
          height: metadata.height,
        }

        return uploadImage(buffer, meta);
      })

      const placeholderPromise = getPlaiceholder(buffer)
        .then(({ base64 }) => (base64))
        .catch(err => {
          console.warn(err);
          return null;
        })

      return Promise.all([uploadPromise, placeholderPromise]);
    })
    .then(values => {
      return {
        ...event,
        s3ImageKey: values[0],
        imagePlaceholder: values[1],
      }
    })
    .catch(err => {
      console.warn(err);
      return event;
    })
};