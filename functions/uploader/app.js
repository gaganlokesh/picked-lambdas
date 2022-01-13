const crypto = require('crypto');
const got = require('got');
const sharp = require('sharp');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getPlaiceholder } = require('plaiceholder');
const { generateColorPalette, getDominantColors } = require('./utils.js');

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

const uploadImage = async (buffer, metadata, keyNamePrefix="") => {
  const keyName = crypto.createHash('md5')
    .update(buffer, 'utf8')
    .digest('hex');
  const key = `${keyNamePrefix}${keyName}.${metadata.format}`
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
  const { imageUrl, keyNamePrefix } = event;
  if (!imageUrl) {
    console.warn("No image URL provided");
    return null;
  }

  return getImage(imageUrl)
    .then(buffer => {
      const image = sharp(buffer);

      const uploadPromise = image.metadata().then(metadata => {
        const meta = {
          format: metadata.format,
          width: metadata.width,
          height: metadata.height,
        }

        return uploadImage(buffer, meta, keyNamePrefix);
      })

      const placeholderPromise = getPlaiceholder(buffer)
        .then(({ base64 }) => (base64))
        .catch(err => {
          console.warn(err);
          return null;
        })

      const palettePromise = generateColorPalette(buffer)
        .then((palette) => palette)

      return Promise.all([uploadPromise, placeholderPromise, palettePromise]);
    })
    .then(([s3ImageKey, placeholder, palette]) => {
      return {
        url: imageUrl,
        s3ImageKey,
        placeholder,
        palette,
        ...getDominantColors(palette),
      }
    })
    .catch(err => {
      console.warn(err);
      return null;
    })
};
