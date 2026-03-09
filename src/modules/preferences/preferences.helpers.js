export const convertMillisecondsToSliderValue = (milliseconds) => {
  const timeMap = {
    [2 * 60 * 1000]: 0,
    [5 * 60 * 1000]: 1,
    [20 * 60 * 1000]: 2,
    [40 * 60 * 1000]: 3,
    [null]: 4,
  };
  return timeMap[milliseconds];
};
