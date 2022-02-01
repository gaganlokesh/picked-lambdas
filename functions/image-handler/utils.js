import colorableDominant from 'colorable-dominant';
import decodeIco from 'decode-ico';
import getColors from 'get-image-colors';
import lodepng from 'lodepng';
import sharp from 'sharp';

const optimizeImage = (buffer) => {
  return sharp(buffer)
    .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true })
  ;
}

const toHexPalette = (colors) => colors.map(color => color.hex());

const generateColorPalette = async (buffer) => {
  const { data, info } = await optimizeImage(buffer)
  const format = 'image/' + info?.format;

  let colors = await getColors(data, format)

  return toHexPalette(colors);
}

const getDominantColors = palette => colorableDominant(palette);

const icoToPng = async (buffer) => {
  const images = decodeIco(buffer);
  // Pick the highest resolution image
  const image = images.sort((a, b) => b.width - a.width)[0];

  if (image.type === "png") {
    return Buffer.from(image.data);
  }

  return lodepng.encode(image);
}

export { generateColorPalette, getDominantColors, icoToPng };
