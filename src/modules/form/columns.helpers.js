// Lays items of differing widths out in a grid of columns that fills the width of their container

// Widths of a row-major grid of the given number of columns, each column sized to its widest item
const getColumnWidths = (widths, columnCount) => widths.reduce((columns, width, index) => {
  const column = index % columnCount;
  columns[column] = Math.max(columns[column] || 0, width);
  return columns;
}, []);

// The most columns that still fit the container, so the items wrap into as few rows as they can
export const getFittingColumnWidths = (widths, containerWidth) => {
  for (let columnCount = widths.length; columnCount > 1; columnCount--) {
    const columns = getColumnWidths(widths, columnCount);
    if (columns.reduce((sum, width) => sum + width, 0) <= containerWidth) return columns;
  }
  return getColumnWidths(widths, 1);
};

// Split items into rows of the given number of columns
export const getRowsOfColumns = (items, columnCount) => items.reduce((rows, item, index) => {
  if (index % columnCount === 0) rows.push([]);
  rows[rows.length - 1].push(item);
  return rows;
}, []);

// Share the width the columns don't use out between them, so wrapped rows fill the container too
export const getStretchedColumnWidths = (columns, containerWidth) => {
  const unusedWidth = containerWidth - columns.reduce((sum, width) => sum + width, 0);
  return columns.map(width => width + Math.floor(unusedWidth / columns.length));
};
