/**
 * Calculates the meters per pixel at a given latitude and zoom level.
 * @param {number} latitude - The latitude in degrees.
 * @param {number} zoomLevel - The map zoom level (typically 0-22).
 * @param {number} [tileSize=256] - The size of the map tiles in pixels.
 * @returns {number} The scale in meters per pixel.
 */
const metersPerPixel = (latitude, zoomLevel, tileSize = 256) => {
  const EARTH_CIRCUMFERENCE = 40075017; // meters
  const latitudeRadians = latitude * Math.PI / 180;
  // The width of the world map in pixels at the current zoom level is tileSize * 2^zoomLevel
  const mapWidthPixels = tileSize * Math.pow(2, zoomLevel);
  // The distance represented by one pixel (S) is given by S = (C * cos(latitude)) / mapWidthPixels
  const metersPerPixel = (EARTH_CIRCUMFERENCE * Math.cos(latitudeRadians)) / mapWidthPixels;

  return metersPerPixel;
};

/**
 * Calculates the map scale ratio (e.g., 1:N) at a given latitude and zoom level.
 * This depends on the display's DPI/PPI for an accurate physical scale.
 * Assuming a standard screen resolution (e.g., 96 DPI).
 * @param {number} latitude - The latitude in degrees.
 * @param {number} zoomLevel - The map zoom level.
 * @param {number} [screenDPI=96] - The screen's Dots Per Inch.
 * @returns {number} The scale factor N (e.g., in a 1:N scale).
 */
export const calculateScaleRatio = (latitude, zoomLevel, screenDPI = 96) => {
  const METERS_PER_INCH = 0.0254;
  const metersPx = metersPerPixel(latitude, zoomLevel);
  // Convert meters per pixel to meters per inch, then convert to inches per inch (scale ratio)
  const metersPerInch = metersPx * screenDPI;
  const scaleRatio = metersPerInch / METERS_PER_INCH;

  return Math.round(scaleRatio);
};
