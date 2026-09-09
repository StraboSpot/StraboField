import {useDispatch, useSelector} from 'react-redux';

import {isEmpty, isEqualUnordered} from '../../../shared/helpers';
import {useSpots} from '../../spots';
import {setMapSymbols} from '../maps.slice';
import {isLabelOffsetFurtherRight} from '../symbology/mapSymbology.helpers';

const useMapFeatures = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const featureTypesOff = useSelector(state => state.map.featureTypesOff) || [];
  const geometryTypesOff = useSelector(state => state.map.geometryTypesOff) || [];
  const isShowOnly1stMeas = useSelector(state => state.map.isShowOnly1stMeas);
  const labelTypeOn = useSelector(state => state.map.labelTypeOn);
  const mapSymbols = useSelector(state => state.map.mapSymbols);
  const stratSection = useSelector(state => state.map.stratSection);

  const {getMappableSpots} = useSpots();

  /* Internal Functions */

  // Filter Spots currently visible on the map by feature type (i.e. toggled on in the Map Symbols Overlay)
  const filterByFeatureType = (mappedFeatures) => {
    // console.log('Filtering Features by Feature Type...');
    // console.log('Feature Types Off', featureTypesOff);

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

    // console.log('Features after filtering by feature type', filteredFeatures);
    return filteredFeatures;
  };

  // Filter Spots currently visible on the map by geometry type (i.e. toggled on in the Map Symbols Overlay)
  const filterByGeometryType = (mappedFeatures) => {
    // console.log('Filtering Features by Geometry Type...');
    // console.log('Geometry Types Off', geometryTypesOff);

    const filteredFeatures = mappedFeatures.filter((spot) => {
      return (spot.geometry.type
        && ((spot.geometry.type === 'Point' || spot.geometry.type === 'MultiPoint')
          && !geometryTypesOff.includes('points'))
        || ((spot.geometry.type === 'LineString' || spot.geometry.type === 'MultiLineString')
          && !geometryTypesOff.includes('lines'))
        || ((spot.geometry.type === 'Polygon' || spot.geometry.type === 'MultiPolygon')
          && !geometryTypesOff.includes('polygons'))
      );
    });

    // console.log('Features after filtering by geometry type', filteredFeatures);
    return filteredFeatures;
  };

  // A Spot with multiple measurements becomes a feature per measurement, all at the same location, so with Spot
  // names as the labels the Spot's name would be drawn once per feature, stacked on itself. Label only one of them,
  // the feature whose label sits furthest to the right, so the single name drawn clears the widest symbol at the Spot.
  const hideRepeatedSpotNameLabels = (features) => {
    if (labelTypeOn !== 'name') return features;

    const labeledFeatures = {};    // The one feature to label at each Spot, by Spot id
    features.forEach((feature) => {
      if (!feature.properties.orientation) return;
      const labeledFeature = labeledFeatures[feature.properties.id];
      if (!labeledFeature || (isLabelOffsetFurtherRight(feature.properties.orientation)
        && !isLabelOffsetFurtherRight(labeledFeature.properties.orientation))) {
        labeledFeatures[feature.properties.id] = feature;
      }
    });

    return features.map(feature => feature.properties.orientation
    && labeledFeatures[feature.properties.id] !== feature
      ? {...feature, properties: {...feature.properties, isSpotNameLabelHidden: true}}
      : feature);
  };

  /* Exported Functions */

  const filterFeatures = (mappedFeatures) => {
    if (!isEmpty(mappedFeatures) && !isEmpty(featureTypesOff)) mappedFeatures = filterByFeatureType(mappedFeatures);
    if (!isEmpty(mappedFeatures) && !isEmpty(geometryTypesOff)) mappedFeatures = filterByGeometryType(mappedFeatures);
    // console.log('Mapped Features after fitlering:', mappedFeatures);
    return mappedFeatures;
  };

  // All Spots (with geometry) mapped on the current map
  const getAllMappedSpots = () => getMappableSpots().filter(isSpotOnCurrentMap);

  // Get selected and not selected Spots to display when not editing
  const getDisplayedSpots = (selectedSpots) => {
    console.log('Getting Spots to display...');
    let mappedSpots = getAllMappedSpots();

    // Separate selected Spots and not selected Spots
    const selectedIds = new Set(selectedSpots.map(sel => sel.properties.id));
    const selectedMappedSpots = mappedSpots.filter(spot => selectedIds.has(spot.properties.id));
    const notSelectedMappedSpots = mappedSpots.filter(spot => !selectedIds.has(spot.properties.id));

    // console.log('Selected Spots to Display on this Map:', selectedMappedSpots);
    // console.log('Not Selected Spots to Display on this Map:', notSelectedMappedSpots);
    return [selectedMappedSpots, notSelectedMappedSpots];
  };

  // Spots with multiple measurements become multiple features, one feature for each measurement
  const getSpotsAsFeatures = (spotsToFeatures) => {
    let mappedFeatures = [];
    spotsToFeatures.forEach((spot) => {
      if ((spot.geometry.type === 'Point' || spot.geometry.type === 'MultiPoint')
        && !isEmpty(spot.properties.orientation_data)) {
        const measurements = isShowOnly1stMeas ? [spot.properties.orientation_data[0]]
          : spot.properties.orientation_data;
        const {orientation_data: _od, ...baseProps} = spot.properties;
        measurements.forEach((orientation) => {
          if (!isEmpty(orientation)) {
            if (!isEmpty(orientation.associated_orientation)) {
              orientation.associated_orientation.forEach((associatedOrientation) => {
                mappedFeatures.push({...spot, properties: {...baseProps, orientation: associatedOrientation}});
              });
            }
            mappedFeatures.push({...spot, properties: {...baseProps, orientation}});
          }
          else console.log('Stupid spot', spot.properties.id);
        });
      }
      else if (spot.geometry.type === 'GeometryCollection') {
        spot.geometry.geometries.forEach((g, i) => {
          mappedFeatures.push(
            {...spot, geometry: g, properties: {...spot.properties, symbology: spot.properties.symbology[i]}});
        });
      }
      else mappedFeatures.push(spot);
    });
    console.log('Mapped Features:', mappedFeatures);
    return hideRepeatedSpotNameLabels(filterFeatures(mappedFeatures));
  };

  // True if the Spot belongs to the map currently being viewed: an image basemap or strat section
  // shows only its own Spots; the regular basemap shows only Spots on neither.
  const isSpotOnCurrentMap = (spot) => {
    if (currentImageBasemap) return spot.properties.image_basemap === currentImageBasemap.id;
    if (stratSection) return spot.properties.strat_section_id === stratSection.strat_section_id;
    return !spot.properties.strat_section_id && !spot.properties.image_basemap;
  };

  // Gather and set the feature types that are present in the mapped Spots
  const updateFeatureTypes = () => {
    console.log('Checking Available Feature Types...');

    const spotsWithGeometry = getMappableSpots();      // Spots with geometry
    const featureTypes = spotsWithGeometry.reduce((acc, spot) => {
      const spotFeatureTypes = spot.properties.orientation_data
        && spot.properties.orientation_data.reduce((acc1, orientation) => {
          // Include associated orientations, which are rendered as their own point symbols, so any feature type not
          // already registered by a non-associated measurement gets a toggle instead of being un-hideable
          const associatedFeatureTypes = (orientation?.associated_orientation || []).map(
            associatedOrientation => associatedOrientation?.feature_type ? associatedOrientation.feature_type : 'unspecified');
          return [...new Set(
            [...acc1, orientation?.feature_type ? orientation.feature_type : 'unspecified', ...associatedFeatureTypes])];
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
    filterFeatures,
    getAllMappedSpots,
    getDisplayedSpots,
    getSpotsAsFeatures,
    isSpotOnCurrentMap,
    updateFeatureTypes,
  };
};

export default useMapFeatures;
