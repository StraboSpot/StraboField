import {useSelector} from 'react-redux';

import {
  NOTEBOOK_PAGES,
  PAGE_KEYS,
  PAGES_HIDDEN_IN_SAMPLE,
  PET_PAGES,
  PRIMARY_PAGES,
  SECONDARY_PAGES,
  SED_PAGES,
} from './page.constants';
import {isEmpty} from '../../shared/Helpers';
import {useTags} from '../tags';

const usePage = () => {
  const isTestingMode = useSelector(state => state.project.isTestingMode);
  const reports = useSelector(state => state.project.project?.reports) || [];
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const {getTagsAtSpot} = useTags();

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

  const getRelevantGeneralPages = () => {
    return [...PRIMARY_PAGES, ...SECONDARY_PAGES].reduce((acc, page) => {
      return ((!page.testing || (isTestingMode && page?.testing))
        && (!selectedSpot.properties?.isSample
          || (selectedSpot.properties?.isSample && !PAGES_HIDDEN_IN_SAMPLE.includes(page.key)))) ? [...acc, page] : acc;
    }, []);
  };

  const getRelevantPetPages = () => {
    const petPagesWithSedRocks = [...PET_PAGES.slice(0, 3), SED_PAGES[0], ...PET_PAGES.slice(3, PET_PAGES.length)];
    return petPagesWithSedRocks.reduce((acc, page) => {
      return ((!page.testing || (isTestingMode && page?.testing))
        && (!selectedSpot.properties?.isSample
          || (selectedSpot.properties?.isSample && !PAGES_HIDDEN_IN_SAMPLE.includes(page.key)))) ? [...acc, page] : acc;
    }, []);
  };

  const getRelevantSedPages = () => {
    const sedPagesWithoutSedRocks = [...SED_PAGES.slice(1, SED_PAGES.length)];
    return sedPagesWithoutSedRocks.reduce((acc, page) => {
      if ((!page.testing || (isTestingMode && page?.testing))
        && (!selectedSpot.properties?.isSample
          || (selectedSpot.properties?.isSample && !PAGES_HIDDEN_IN_SAMPLE.includes(page.key)))
        && (page.key !== PAGE_KEYS.STRAT_SECTION
          || (page.key === PAGE_KEYS.STRAT_SECTION
            && selectedSpot.properties?.surface_feature?.surface_feature_type !== 'strat_interval'
            && !selectedSpot.properties?.strat_section_id))
        && (page.key !== PAGE_KEYS.INTERVAL
          || (page.key === PAGE_KEYS.INTERVAL
            && selectedSpot.properties?.surface_feature?.surface_feature_type === 'strat_interval'))
        && (page.key !== PAGE_KEYS.INTERPRETATIONS
          || (page.key === PAGE_KEYS.INTERPRETATIONS
            && (selectedSpot.properties?.surface_feature?.surface_feature_type === 'strat_interval'
              || selectedSpot.properties?.strat_section_id)))) {
        return [...acc, page];
      }
      return acc;
    }, []);
  };

  const getSpotDataIconSource = (iconKey) => {
    const page = NOTEBOOK_PAGES.find(p => p.key === iconKey);
    return page && page.icon_src ? page.icon_src : require('../../assets/icons/QuestionMark_pressed.png');
  };

  return {
    getPopulatedPagesKeys: getPopulatedPagesKeys,
    getRelevantGeneralPages: getRelevantGeneralPages,
    getRelevantPetPages: getRelevantPetPages,
    getRelevantSedPages: getRelevantSedPages,
    getSpotDataIconSource: getSpotDataIconSource,
  };
};

export default usePage;
