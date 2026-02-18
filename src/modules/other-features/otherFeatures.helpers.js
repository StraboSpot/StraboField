export const getTitle = (feature) => {
  const firstClassTitle = feature.name || 'Unnamed Feature';
  const secondClassTitle = feature.type?.toUpperCase() || 'UNKNOWN';
  return firstClassTitle + ' - ' + secondClassTitle;
};
