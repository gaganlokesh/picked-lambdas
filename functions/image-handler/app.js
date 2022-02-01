import crypto from 'crypto';
import got from 'got';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getPlaiceholder } from 'plaiceholder';
import { generateColorPalette, getDominantColors, icoToPng } from './utils.js';

const getImage = async (url) => {
  return got(url, { responseType: 'buffer' })
    .then(res => res.body)
    .catch(err => {
      console.err("Error downloading image");
      throw err;
    })
  ;
}

const hashImage = (buffer) => {
  const hash = crypto.createHash('md5');
  hash.update(buffer, 'utf8');
  return hash.digest('hex');
}

const uploadImage = async (buffer, metadata, keyNamePrefix="") => {
  const key = `${keyNamePrefix}${hashImage(buffer)}.${metadata.format}`;
  let objectParams = {
    Bucket: process.env.BUCKET_NAME,
    Key: key,
    ACL: 'public-read',
    Body: buffer,
    // Metadata: metadata,
  }
  const s3 = new S3Client({ region: process.env.BUCKET_REGION });

  console.log(`Starting upload for ${key}`)
  return s3.send(new PutObjectCommand(objectParams))
    .then(res => {
      console.log('Upload successful!');
      return key;
    })
    .catch(err => {
      console.error("Failed to upload image");
      throw err;
    })
  ;
}

const processImage = async (imageUrl, keyNamePrefix) => {
  let buffer = await getImage(imageUrl);
  const fileType = await fileTypeFromBuffer(buffer);

  // Speacial handling for ICO format due to issues with sharp
  if (fileType.ext === "ico") {
    // Convert to PNG
    buffer = await icoToPng(buffer);
  }

  const metadata = await sharp(buffer).metadata();

  const uploadPromise = uploadImage(
    buffer,
    {
      format: metadata?.format,
      width: metadata?.width,
      height: metadata?.height,
    },
    keyNamePrefix
  );
  const placeholderPromise = getPlaiceholder(buffer)
  const palettePromise = generateColorPalette(buffer)

  return Promise.all([uploadPromise, placeholderPromise, palettePromise]);
}

/**
 * @param {Object} event - Input event to the Lambda function
 * @param {Object} context - Lambda Context runtime methods and attributes
 *
 * @returns {Object} object - Object containing feed item along with uploaded links
 *
 */
export async function imageHandler (event, context) {
  const { imageUrl, keyNamePrefix } = event;
  if (!imageUrl) {
    console.warn("No image URL provided");
    return null;
  }

  try {
    const [ s3ImageKey, placeholder, palette ] = await processImage(imageUrl, keyNamePrefix);

    return {
      url: imageUrl,
      placeholder: placeholder?.base64,
      s3ImageKey,
      palette,
      ...getDominantColors(palette),
    }
  } catch (err) {
    console.error(err);
    return null;
  }
};
