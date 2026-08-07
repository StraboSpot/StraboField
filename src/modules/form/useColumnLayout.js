import {useState} from 'react';

import {getFittingColumnWidths, getRowsOfColumns, getStretchedColumnWidths} from './columns.helpers';
import {SMALL_SCREEN_WIDTH} from '../../shared/styles.constants';

// Measures items at their natural width, then lays them out in rows of columns that fill their container.
// Items that fit on a single row keep their natural width and are spread across it. Items that need more than
// one row go into columns, sized to the widest item in each, so the rows line up. Either way they only fill
// the container if it's narrow enough that filling it doesn't stretch them out.
const useColumnLayout = (items) => {
  /* Local State */

  const [containerWidth, setContainerWidth] = useState(0);
  const [itemWidths, setItemWidths] = useState({});

  /* Derived Variables */

  const measuredWidths = items.map(item => itemWidths[item.value]);
  const isMeasured = measuredWidths.every(width => width !== undefined);
  const fittedWidths = isMeasured ? getFittingColumnWidths(measuredWidths, containerWidth) : [];
  const isFittingOneRow = fittedWidths.length === items.length;
  const isNarrowContainer = containerWidth < SMALL_SCREEN_WIDTH;
  const columnWidths = isFittingOneRow || !isNarrowContainer ? fittedWidths
    : getStretchedColumnWidths(fittedWidths, containerWidth);
  const isSpread = isFittingOneRow && isNarrowContainer;
  // Lay the rows out rather than letting them wrap, so they break where the columns say they do. Each item is
  // paired with the width of its column, or with undefined where it should keep its own natural width.
  const rows = (isMeasured ? getRowsOfColumns(items, columnWidths.length) : [items]).map(
    row => row.map((item, columnIndex) => ({item, width: isFittingOneRow ? undefined : columnWidths[columnIndex]})),
  );

  /* Exported Functions */

  const onContainerLayout = e => setContainerWidth(e.nativeEvent.layout.width);

  // Measure each item once, while it's still at its natural width, before any column width is applied.
  // Round up: a column is sized to the widest item it holds, and at a fractional width pixel rounding
  // leaves that item a sliver narrower than it measured at, which truncates its label.
  const onItemLayout = (item, e) => {
    const {width} = e.nativeEvent.layout;
    if (!isMeasured) setItemWidths(prevWidths => ({...prevWidths, [item.value]: Math.ceil(width)}));
  };

  return {
    isMeasured,
    isSpread,
    onContainerLayout,
    onItemLayout,
    rows,
  };
};

export default useColumnLayout;
