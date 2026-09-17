// The label the user actually entered. Before labels were shown, a save filled the field in with the feature's
// name whenever it was left blank, so a label that is exactly the name was never typed by anyone and is not what
// to call the feature - every Other Feature saved back then carries one.
export const getEnteredLabel = feature => feature.label === feature.name ? undefined : feature.label;

export const getTitle = (feature) => {
  const firstClassTitle = feature.name || 'Unnamed Feature';
  const secondClassTitle = feature.type?.toUpperCase() || 'UNKNOWN';
  return firstClassTitle + ' - ' + secondClassTitle;
};
