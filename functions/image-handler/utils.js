import colorableDominant from 'colorable-dominant';
import getColors from 'get-image-colors';
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

export { generateColorPalette, getDominantColors };
