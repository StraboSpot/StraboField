import {PAGES_SECTIONS, PRIMARY_PAGES, SAMPLE_OVERVIEW_DEFAULT_PAGES} from './page.constants';
import {getOverviewSections} from './page.helpers';
import {PAGE_KEYS} from './pageKeys.constants';

// The More Pages menu renders PAGES_SECTIONS as-is, so flattening it is the order the Overview has to match
const MENU_ORDER = PAGES_SECTIONS.flatMap(section => section.pages);
const MENU_ORDER_KEYS = MENU_ORDER.map(page => page.key);
const EVERY_PAGE_KEY = Object.values(PAGE_KEYS);

const getSectionKeys = (populatedPagesKeys, isSample) =>
  getOverviewSections(populatedPagesKeys, isSample).map(section => section.title.key);

// Whether the keys are all pages the menu lists, in the same relative order it lists them in
const isInMenuOrder = (sectionKeys) => {
  const menuPositions = sectionKeys.map(key => MENU_ORDER_KEYS.indexOf(key));
  return !menuPositions.includes(-1)
    && menuPositions.every((position, i) => i === 0 || position > menuPositions[i - 1]);
};

// A section's order is the whole point of the Overview reading PAGES_IN_MENU_ORDER rather than gathering its pages
// itself: someone scanning the notebook should find a Spot's data where the menu just said it would be
describe('getOverviewSections', () => {
  it('lists every section in the same order as the More Pages menu', () => {
    expect(getSectionKeys(EVERY_PAGE_KEY))
      .toEqual(MENU_ORDER.filter(page => page.overview_component).map(page => page.key));
  });

  it('keeps menu order when only a few scattered pages hold data', () => {
    const populatedPagesKeys = [PAGE_KEYS.REPORTS, PAGE_KEYS.BEDDING, PAGE_KEYS.FABRICS];
    const sectionKeys = getSectionKeys(populatedPagesKeys);
    expect(sectionKeys.filter(key => populatedPagesKeys.includes(key)))
      .toEqual([PAGE_KEYS.FABRICS, PAGE_KEYS.BEDDING, PAGE_KEYS.REPORTS]);
    expect(isInMenuOrder(sectionKeys)).toBe(true);
  });

  it('shows the primary pages in menu order on a Spot holding nothing yet', () => {
    expect(getSectionKeys([])).toEqual(
      MENU_ORDER.filter(page => PRIMARY_PAGES.some(p => p.key === page.key)).map(page => page.key));
  });

  it('leaves out a page with no overview component, even when it holds data', () => {
    const sectionKeys = getSectionKeys(EVERY_PAGE_KEY);
    const pagesWithNoOverview = MENU_ORDER.filter(page => !page.overview_component).map(page => page.key);
    expect(pagesWithNoOverview.length).toBeGreaterThan(0);
    pagesWithNoOverview.forEach(key => expect(sectionKeys).not.toContain(key));
  });

  // The one deliberate departure from menu order: a sample's own data leads, and the rest follows the menu
  it('leads with Samples on a sample, then holds to menu order', () => {
    const sectionKeys = getSectionKeys(SAMPLE_OVERVIEW_DEFAULT_PAGES, true);
    expect(sectionKeys[0]).toBe(PAGE_KEYS.SAMPLES);
    expect(isInMenuOrder(sectionKeys.slice(1))).toBe(true);
  });

  it('holds to menu order on a sample holding data on every page', () => {
    const sectionKeys = getSectionKeys(EVERY_PAGE_KEY, true);
    expect(sectionKeys[0]).toBe(PAGE_KEYS.SAMPLES);
    expect(isInMenuOrder(sectionKeys.slice(1))).toBe(true);
  });
});
