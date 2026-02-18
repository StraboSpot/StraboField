/**
 * Filter features to only include those that have at least one sample.
 *
 * @param {Array} features - Array of GeoJSON features
 * @returns {Array} - Array of features that have samples
 */
export const getFeaturesWithSamples = (features) => {
  return features.reduce((acc, feature) => {
    return feature.properties?.samples && feature.properties.samples.length >= 1 ? [...acc, feature] : acc;
  }, []);
};

/**
 * Get unique features by their properties.id, removing duplicates.
 * Used to prevent multiple halos from being stacked on top of each other.
 *
 * @param {Array} features - Array of GeoJSON features
 * @returns {Array} - Array of unique features by properties.id
 */
export const getUniqFeatures = (features) => {
  return features.reduce((acc, f) =>
    acc.map(f1 => f1.properties.id).includes(f.properties.id) ? acc : [...acc, f], []);
};
