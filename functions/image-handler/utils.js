const Vibrant = require('node-vibrant');
const colorableDominant = require('colorable-dominant');

const toHexPalette = async (palette) => {
  return Object.keys(palette)
    .reduce((acc, key) => {
      const value = palette[key]
      if (value) {
        acc.push({
          popularity: value?.population,
          hex: value?.hex
        })
      }
      return acc;
    }, [])
    .sort((a, b) => a.popularity <= b.popularity)
    .map(color => color.hex?.toUpperCase())
  ;
}

const generateColorPalette = async (buffer) => {
  const vibrant = Vibrant.from(buffer);
  let palette = [];

  try {
    const vibrantPalette = await vibrant.getPalette();
    palette = toHexPalette(vibrantPalette);
  } catch (error) {
    console.warn(error);
  }

  return palette;
}

const getDominantColors = palette => colorableDominant(palette);

module.exports = {
  generateColorPalette,
  getDominantColors,
};
