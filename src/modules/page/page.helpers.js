import {PAGES_IN_MENU_ORDER, PRIMARY_PAGES, SAMPLE_OVERVIEW_DEFAULT_PAGES} from './page.constants';
import {PAGE_KEYS} from './pageKeys.constants';

// The Spot Overview's sections: the pages shown for this Spot that have something to render there, in the same
// order as the notebook's More Pages menu - except on a sample, where Samples leads. Which pages hold data is
// passed in, since only the Spot itself can say.
export const getOverviewSections = (populatedPagesKeys, isSample) => {
  const defaultPagesKeys = isSample ? SAMPLE_OVERVIEW_DEFAULT_PAGES : PRIMARY_PAGES.map(p => p.key);
  const visiblePagesKeys = [...new Set([...defaultPagesKeys, ...populatedPagesKeys])];
  const orderedPages = isSample
    ? [...PAGES_IN_MENU_ORDER.filter(p => p.key === PAGE_KEYS.SAMPLES),
      ...PAGES_IN_MENU_ORDER.filter(p => p.key !== PAGE_KEYS.SAMPLES)]
    : PAGES_IN_MENU_ORDER;
  return orderedPages.reduce(
    (acc, page) => visiblePagesKeys.includes(page.key) && page.overview_component
      ? [...acc, {title: page, data: [page]}]
      : acc,
    []);
};
