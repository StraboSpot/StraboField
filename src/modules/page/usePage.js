import {useSelector} from 'react-redux';

import {NOTEBOOK_PAGES, PAGES_HIDDEN_IN_SAMPLE, PAGES_SECTIONS, PET_PAGES, SED_PAGES} from './page.constants';
import {PAGE_KEYS} from './pageKeys.constants';
import {isEmpty} from '../../shared/helpers';
import {useTags} from '../tags';

const usePage = () => {
  /* Data Hooks */

  const isTestingMode = useSelector(state => state.project.isTestingMode);
  const reports = useSelector(state => state.project.project?.reports) || [];
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const {getTagsAtSpot} = useTags();

  /* Derived Variables */

  const isStratIntervalSpot = selectedSpot?.properties?.surface_feature?.surface_feature_type === 'strat_interval';
  const isSpotInStratSection = isStratIntervalSpot || !!selectedSpot?.properties?.strat_section_id;

  /* Exported Functions */

  // Every page relevant to the selected Spot, in the order the More Pages menu lists them
  const getAllRelevantPages = isSample => getRelevantPagesSections(isSample).flatMap(section => section.pages);

  // Return the keys for the Spot pages that are populated with data
  const getPopulatedPagesKeys = (spot) => {
    const populatedPagesKeys = NOTEBOOK_PAGES.reduce((acc, page) => {
      let isPopulated = false;
      switch (page.key) {
        case PAGE_KEYS.REPORTS: {
          if (!isEmpty(reports)
            && !isEmpty(reports.filter(report => report.spots && report.spots.includes(spot.properties.id)))) {
            isPopulated = true;
          }
          break;
        }
        case PAGE_KEYS.TAGS: {
          const tagsAtSpot = getTagsAtSpot(spot.properties.id);
          if (!isEmpty(tagsAtSpot.filter(t => t.type !== PAGE_KEYS.GEOLOGIC_UNITS))) isPopulated = true;
          break;
        }
        case PAGE_KEYS.GEOLOGIC_UNITS: {
          const tagsAtSpot = getTagsAtSpot(spot.properties.id);
          if (!isEmpty(tagsAtSpot.filter(t => t.type === PAGE_KEYS.GEOLOGIC_UNITS))) isPopulated = true;
          break;
        }
        case PAGE_KEYS.THREE_D_STRUCTURES:
          if (spot.properties[PAGE_KEYS.THREE_D_STRUCTURES]
            && !isEmpty(spot.properties[PAGE_KEYS.THREE_D_STRUCTURES].filter(s => s.type !== 'fabric'))) {
            isPopulated = true;
          }
          break;
        case PAGE_KEYS.FABRICS:
          if (spot.properties[PAGE_KEYS.FABRICS] || (spot.properties[PAGE_KEYS.THREE_D_STRUCTURES]
            && !isEmpty(spot.properties[PAGE_KEYS.THREE_D_STRUCTURES].filter(s => s.type === 'fabric')))) {
            isPopulated = true;
          }
          break;
        case PAGE_KEYS.DATA:
          if (!isEmpty(spot.properties?.data?.urls) || !isEmpty(spot.properties?.data?.tables)) {
            isPopulated = true;
          }
          break;
        case PAGE_KEYS.ROCK_TYPE_ALTERATION_ORE:
        case PAGE_KEYS.ROCK_TYPE_IGNEOUS:
        case PAGE_KEYS.ROCK_TYPE_METAMORPHIC:
          if ((spot.properties.pet && spot.properties.pet[page.key])
            || spot?.properties?.pet?.rock_type?.includes(page.key)) isPopulated = true;
          break;
        case PAGE_KEYS.ROCK_TYPE_SEDIMENTARY:
          if (spot.properties.sed && spot.properties.sed[PAGE_KEYS.LITHOLOGIES]
            && Array.isArray(spot.properties.sed[PAGE_KEYS.LITHOLOGIES])) isPopulated = true;
          break;
        case PAGE_KEYS.INTERVAL:
          if (spot.properties.sed && (spot.properties.sed.character
            || (spot.properties.sed[page.key] && !isEmpty(spot.properties.sed[page.key])))) {
            isPopulated = true;
          }
          break;
        case PAGE_KEYS.BEDDING:
          if (spot.properties.sed && spot.properties.sed[page.key] && spot.properties.sed[page.key].beds
            && Array.isArray(spot.properties.sed[page.key].beds)) {
            isPopulated = true;
          }
          break;
        case PAGE_KEYS.LITHOLOGIES:
          if (spot.properties.sed && spot.properties.sed[page.key] && Array.isArray(spot.properties.sed[page.key])) {
            isPopulated = true;
          }
          break;
        default:
          if (spot.properties && (spot.properties[page.key]
            || (PET_PAGES.find(p => p.key === page.key) && spot.properties.pet && spot.properties.pet[page.key])
            || (SED_PAGES.find(p => p.key === page.key) && spot.properties.sed && spot.properties.sed[page.key]))) {
            isPopulated = true;
          }
      }
      return isPopulated ? [...acc, page.key] : acc;
    }, []);
    // console.log('populated pages keys', populatedPagesKeys);
    return populatedPagesKeys;
  };

  // The sections of the notebook's More Pages menu, each with the pages relevant to the selected Spot
  const getRelevantPagesSections = (isSample) => {
    return PAGES_SECTIONS.reduce((acc, section) => {
      const pages = getRelevantPages(section.pages, isSample);
      return isEmpty(pages) ? acc : [...acc, {title: section.title, pages: pages}];
    }, []);
  };

  const getSpotDataIconSource = (iconKey) => {
    const page = NOTEBOOK_PAGES.find(p => p.key === iconKey);
    return page && page.icon_src ? page.icon_src : require('../../assets/icons/QuestionMark_pressed.png');
  };

  /* Logic Helpers */

  // PAGES_SECTIONS is the same for every Spot, so the Spot-specific rules live here: Interval belongs
  // to the interval itself, while Strat Section is offered only to a Spot not already in one.
  const getRelevantPages = (pages, isSample) => {
    return pages.reduce((acc, page) => {
      if ((!page.testing || isTestingMode)
        && (!isSample || !PAGES_HIDDEN_IN_SAMPLE.includes(page.key))
        && (page.key !== PAGE_KEYS.INTERVAL || isStratIntervalSpot)
        && (page.key !== PAGE_KEYS.INTERPRETATIONS || isSpotInStratSection)
        && (page.key !== PAGE_KEYS.STRAT_SECTION || !isSpotInStratSection)) {
        return [...acc, page];
      }
      return acc;
    }, []);
  };

  return {
    getAllRelevantPages,
    getPopulatedPagesKeys,
    getRelevantPagesSections,
    getSpotDataIconSource,
  };
};

export default usePage;
