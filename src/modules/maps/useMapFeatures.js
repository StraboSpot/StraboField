import {useDispatch, useSelector} from 'react-redux';

import {setMapSymbols} from './maps.slice';
import {isEmpty, isEqualUnordered} from '../../shared/Helpers';
import {useSpots} from '../spots';

const useMapFeatures = () => {
  const dispatch = useDispatch();

  const {getMappableSpots} = useSpots();

  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const featureTypesOff = useSelector(state => state.map.featureTypesOff);
  const isShowOnly1stMeas = useSelector(state => state.map.isShowOnly1stMeas);
  const mapSymbols = useSelector(state => state.map.mapSymbols);
  const stratSection = useSelector(state => state.map.stratSection);

  // Filter Spots currently visible on the map by feature type (i.e. toggled on in the Map Symbols Overlay)
  const filterByFeatureType = (mappedFeatures) => {
    console.log('Mapped Features:', mappedFeatures);
    console.log('Feature Types Off', featureTypesOff);

    const filteredFeatures = mappedFeatures.filter((spot) => {

      const featuresWithNoOrientationToHide = !spot?.properties && featureTypesOff.includes('unspecified')
        || (!spot.properties.orientation_data && !spot.properties.orientation
          && featureTypesOff.includes('unspecified'));

      const nonPointFeaturesToHide = spot.properties.orientation_data
        && spot.properties.orientation_data.filter(
          orientation => featureTypesOff.includes(orientation?.feature_type)
            || (!orientation?.feature_type && featureTypesOff.includes('unspecified')));

      const pointFeatureToHide = spot.properties.orientation
        && ((spot.properties.orientation.feature_type
            && featureTypesOff.includes(spot.properties.orientation.feature_type))
          || (!spot.properties.orientation.feature_type && featureTypesOff.includes('unspecified')));

      return isEmpty(nonPointFeaturesToHide) && !pointFeatureToHide && !featuresWithNoOrientationToHide;
    });

    console.log('Filtered Mapped Features', filteredFeatures);

    return filteredFeatures;
  };

  // All Spots mapped on current map
  const getAllMappedSpots = () => {
    const spotsWithGeometry = getMappableSpots();      // Spots with geometry
    let mappedSpots;
    if (currentImageBasemap) {
      mappedSpots = spotsWithGeometry.filter(
        spot => spot.properties.image_basemap && spot.properties.image_basemap === currentImageBasemap.id);
    }
    else if (stratSection) {
      mappedSpots = spotsWithGeometry.filter(
        spot => spot.properties.strat_section_id && spot.properties.strat_section_id === stratSection.strat_section_id);
    }
    else {
      mappedSpots = spotsWithGeometry.filter(
        spot => !spot.properties.strat_section_id && !spot.properties.image_basemap);
    }
    // console.log('All Mapped Active Spots on this map', mappedSpots);
    // console.log('Number of Active Spots Mapped on this map:', mappedSpots.length);
    return mappedSpots;
  };

  // Get selected and not selected Spots to display when not editing
  const getDisplayedSpots = (selectedSpots) => {
    console.log('Getting Spots to display...');
    let mappedSpots = getAllMappedSpots();

    // Separate selected Spots and not selected Spots (Point Spots need to be in both
    // selected and not selected since the selected symbology is a halo around the point)
    const selectedIds = selectedSpots.map(sel => sel.properties.id);
    const selectedMappedSpots = mappedSpots.filter(spot => selectedIds.includes(spot.properties.id));
    const notSelectedMappedSpots = mappedSpots.filter(spot => !selectedIds.includes(spot.properties.id)
      || spot.geometry.type === 'Point');

    // console.log('Selected Spots to Display on this Map:', selectedMappedSpots);
    // console.log('Not Selected Spots to Display on this Map:', notSelectedMappedSpots);
    return [selectedMappedSpots, notSelectedMappedSpots];
  };

  // Spots with multiple measurements become multiple features, one feature for each measurement
  const getSpotsAsFeatures = (spotsToFeatures) => {
    console.log('Getting Spots as mapped features...');
    let mappedFeatures = [];
    spotsToFeatures.map((spot) => {
      if ((spot.geometry.type === 'Point' || spot.geometry.type === 'MultiPoint')
        && !isEmpty(spot.properties.orientation_data)) {
        const measurements = isShowOnly1stMeas ? [spot.properties.orientation_data[0]]
          : spot.properties.orientation_data;
        measurements.map((orientation, i) => {
          if (!isEmpty(orientation)) {
            const feature = JSON.parse(JSON.stringify(spot));
            delete feature.properties.orientation_data;
            !isEmpty(orientation.associated_orientation)
            && orientation.associated_orientation.map((associatedOrientation) => {
              feature.properties.orientation = associatedOrientation;
              mappedFeatures.push(JSON.parse(JSON.stringify(feature)));
            });
            feature.properties.orientation = orientation;
            //feature.properties.orientation_num = i.toString();
            mappedFeatures.push(JSON.parse(JSON.stringify(feature)));
          }
          else console.log('Stupid spot', spot.properties.id);
        });
      }
      else if (spot.geometry.type === 'GeometryCollection') {
        spot.geometry.geometries.forEach((g, i) => {
          const feature = JSON.parse(JSON.stringify(spot));
          if (i % 2 === 1) feature.properties.isInterbed = true;
          feature.geometry = g;
          mappedFeatures.push(feature);
        });
      }
      else mappedFeatures.push(JSON.parse(JSON.stringify(spot)));
    });
    return isEmpty(featureTypesOff) || isEmpty(mappedFeatures) ? mappedFeatures : filterByFeatureType(mappedFeatures);
  };

  // Gather and set the feature types that are present in the mapped Spots
  const updateFeatureTypes = () => {
    console.log('Checking Available Feature Types...');

    const spotsWithGeometry = getMappableSpots();      // Spots with geometry
    const featureTypes = spotsWithGeometry.reduce((acc, spot) => {
      const spotFeatureTypes = spot.properties.orientation_data
        && spot.properties.orientation_data.reduce((acc1, orientation) => {
          return [...new Set([...acc1, orientation?.feature_type ? orientation.feature_type : 'unspecified'])];
        }, []);
      return [...new Set([...acc, ...(spotFeatureTypes ? spotFeatureTypes : ['unspecified'])])];
    }, []);

    if (!isEqualUnordered(mapSymbols, featureTypes)) {
      console.log('Updating Available Feature Types...');
      featureTypes.sort();
      dispatch(setMapSymbols(featureTypes));
    }
  };

  return {
    getAllMappedSpots: getAllMappedSpots,
    getDisplayedSpots: getDisplayedSpots,
    getSpotsAsFeatures: getSpotsAsFeatures,
    updateFeatureTypes: updateFeatureTypes,
  };
};

export default useMapFeatures;
