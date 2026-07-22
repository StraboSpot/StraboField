import {Platform} from 'react-native';

import * as Sentry from '@sentry/react-native';
import * as turf from '@turf/turf';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {
  getImageBasemapsInSpot,
  getSpotGeometryIconSource,
  isOnGeoMap,
  isOnImageBasemap,
  isOnSameImageBasemap,
  isOnSameStratSection,
  isOnStratSection,
  isStratInterval,
  sortSpotsAlphabetically,
  sortSpotsByDateCreated,
  sortSpotsByDateLastModified,
} from './spots.helpers';
import {deletedSpot, editedOrCreatedSpot, editedOrCreatedSpots, setSelectedSpot} from './spots.slice';
import {getNewCopyId, getNewId, isEmpty, isEqual, sleep} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import {setModalVisible} from '../home/home.slice';
import {clearedStratSection, setCurrentImageBasemap, setStratSection} from '../maps/maps.slice';
import {MODAL_KEYS, PAGE_KEYS} from '../page/pageKeys.constants';
import {
  addedNewSpotIdsToDataset,
  addedNewSpotIdToDataset,
  deletedSpotIdFromDatasets,
  deletedSpotIdFromReports,
  deletedSpotIdFromTags,
  updatedModifiedTimestampsBySpotsIds,
  updatedProject,
} from '../project/projects.slice';
import useProject from '../project/useProject';
import {useTags} from '../tags';

const useSpots = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const modalVisible = useSelector(state => state.home.modalVisible);
  const preferences = useSelector(state => state.project.project?.preferences) || {};
  const recentViews = useSelector(state => state.spot.recentViews);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);
  const spots = useSelector(state => state.spot.spots);
  const spotsInMapExtentIds = useSelector(state => state.map.spotsInMapExtentIds);
  const stratSection = useSelector(state => state.map.stratSection);
  const tags = useSelector(state => state.project.project?.tags) || [];

  const useContinuousTagging = useSelector(state => state.project.project?.useContinuousTagging);
  const {getActiveDatasets, getTargetDatasetFromId} = useProject();
  const {addSpotsToTags} = useTags();
  const toast = useToast();

  /* Internal Functions */

  const getNewSpotNameObj = (newSpot) => {
    let namePrefix = preferences.spot_prefix || '';
    if (newSpot && preferences.nested_spot_prefix && (isOnImageBasemap(newSpot) || isOnStratSection(newSpot))) {
      namePrefix = preferences.nested_spot_prefix;
    }

    let newSpotName = namePrefix;
    if (newSpot && preferences.prepend_spot_name_nested_spot
      && (isOnImageBasemap(newSpot) || isOnStratSection(newSpot))) {
      if (isOnImageBasemap(newSpot)) {
        const parentSpot = getSpotWithThisImageBasemap(newSpot.properties.image_basemap);
        newSpotName = parentSpot.properties.name + namePrefix;
      }
      else {
        const parentSpot = getSpotWithThisStratSection(newSpot.properties.strat_section_id);
        newSpotName = parentSpot.properties.name + namePrefix;
      }
    }

    let spotNumber;
    if (newSpot && preferences.restart_num_each_nested_spot
      && (isOnImageBasemap(newSpot) || isOnStratSection(newSpot))) {
      if (isOnImageBasemap(newSpot)) {
        const parentSpot = getSpotWithThisImageBasemap(newSpot.properties.image_basemap);
        const imageBasemaps = getImageBasemapsInSpot(parentSpot);
        const nestedImageBasemapSpots = imageBasemaps.reduce((acc, imageBasemap) => {
          const spotsMappedOnGivenImageBasemap = getSpotsMappedOnGivenImageBasemap(imageBasemap.id);
          return [...acc, ...spotsMappedOnGivenImageBasemap];
        }, []) || [];
        spotNumber = nestedImageBasemapSpots.length + 1;
      }
      else {
        const spotsMappedOnGivenStratSection = getSpotsMappedOnGivenStratSection(newSpot.properties.strat_section_id);
        spotNumber = spotsMappedOnGivenStratSection.length + 1;
      }
    }
    else spotNumber = parseInt(preferences.starting_number_for_spot, 10) || Object.keys(spots).length + 1;

    newSpotName = spotNumber < 10 ? newSpotName + '0' + spotNumber : newSpotName + spotNumber;

    return {spotName: newSpotName, spotNumber: spotNumber};
  };

  const getStratSectionSettings = (stratSectionId) => {
    const spot = getSpotWithThisStratSection(stratSectionId);
    return spot && spot.properties && spot.properties.sed
    && spot.properties.sed.strat_section ? spot.properties.sed.strat_section : undefined;
  };

  /* Exported Functions */

  const checkIsSafeDelete = (spotToDelete) => {
    // Check if Spot is manually nested - get the first Spot that has this Spot nested manually in spot.properties.nesting
    const spotWithManualNest = Object.values(spots).find(
      spot => spot.properties?.nesting?.includes(spotToDelete.properties.id));
    if (spotWithManualNest) {
      return 'Remove the link to this Spot from the Samples page in Spot ' + spotWithManualNest.properties.name
        + ' before deleting.';
    }
    if (spotToDelete.properties?.sed?.strat_section) return 'Remove the strat section from this Spot before deleting.';
    if (!isEmpty(spotToDelete.properties?.images)) {
      return `Remove all ${(spotToDelete.properties.images).length} images from this Spot before deleting.`;
    }
    //var childrenSpots = getChildrenGenerationsSpots(spotToDelete, 1)[0];
    // Get only children that are mapped on an image basemap or strat section which is
    // different from the image basemap or strat section of the Spot being deleted
    // var altMappedChildrenSpots = _.filter(childrenSpots, function (spot) {
    //   return spotToDelete.properties.imageBasemap !== spot.properties.image_basemap || spotToDelete.properties.strat_section_id !== spot.properties.strat_section_id;
    // });
    // if (!_.isEmpty(altMappedChildrenSpots)) return 'Delete the nested Spots for this Spot before deleting.';

    return null;
  };

  // Show toast warning if duplicate Sample name used
  const checkSampleName = async (name) => {
    if (preferences.warn_on_dupe_sample_name) {
      const sampleNames = Object.values(spots).reduce((acc, spot) => {
        const spotSampleNames = spot.properties.samples?.map(sample => sample.sample_id_name);
        return spotSampleNames ? [...new Set([...acc, ...spotSampleNames])] : acc;
      }, []);
      return sampleNames.includes(name);
    }
    else return;
  };

  // Show toast warning if duplicate Spot name used
  const checkSpotName = async (name) => {
    if (preferences.warn_on_dupe_spot_name) {
      const spotNames = Object.values(spots).map(spot => spot.properties.name);
      const foundDuplicateName = spotNames.includes(name);
      if (foundDuplicateName) {
        toast.show('Warning! Spot Name has Already Been Used.', {duration: 3000, type: 'warning', placement: 'top'});
        if (Platform.OS === 'web') await sleep(3000);
      }
    }
  };

  // Copy Spot to a new Spot omitting specific properties
  const copySpot = async () => {
    let copiedSpot = {'type': 'Feature'};
    let {
      name,
      id,
      date,
      time,
      modified_timestamp,
      images,
      samples,
      lat,
      lng,
      altitude,
      gps_accuracy,
      orientation_data,
      spot_radius,
      ...properties
    } = selectedSpot.properties;
    copiedSpot.properties = properties;
    // Omit strat_section from copied properties
    if (copiedSpot.properties?.sed?.strat_section) {
      const {strat_section, ...restSed} = copiedSpot.properties.sed;
      copiedSpot.properties = {...copiedSpot.properties, sed: restSed};
    }
    const newSpot = await createSpot(copiedSpot);
    dispatch(setSelectedSpot(newSpot));
    console.log('Spot Copied. New Spot', newSpot);
  };

  // Given geojson for a point with coordinates and a number of spots, create that many spots randomly around given point
  const createRandomSpots = (feature, numRandomSpots) => {
    let newSpots = [];
    Array.from({length: numRandomSpots}, (_, n) => {
      const randomLongOffset = Math.random() * 0.01 * (Math.round(Math.random()) ? 1 : -1);
      const randomLatOffset = Math.random() * 0.01 * (Math.round(Math.random()) ? 1 : -1);
      let d = new Date(Date.now());
      d.setMilliseconds(0);
      const newSpot = {
        ...feature,
        geometry: {
          ...feature.geometry,
          coordinates: [feature.geometry.coordinates[0] + randomLongOffset, feature.geometry.coordinates[1] + randomLatOffset],
        },
        properties: {
          id: getNewCopyId(),
          date: d.toISOString(),
          time: d.toISOString(),
          modified_timestamp: Date.now(),
          name: n.toString(),
        },
      };
      newSpots.push(newSpot);
    });
    console.log('Creating', numRandomSpots, 'new random Spots near current location.');
    dispatch(updatedModifiedTimestampsBySpotsIds([newSpots[0].properties.id]));
    const targetDataset = getTargetDatasetFromId();
    dispatch(addedNewSpotIdsToDataset({datasetId: targetDataset.id, spotIds: newSpots.map(s => s.properties.id)}));
    dispatch(editedOrCreatedSpots(newSpots));
    console.log('Finished creating new random Spot. All Spots: ', spots);
  };

  // Create a new Spot
  const createSpot = async (feature) => {
    let newSpot = feature;
    newSpot.properties.id = getNewId();
    let d = new Date(Date.now());
    d.setMilliseconds(0);
    newSpot.properties.date = newSpot.properties.time = d.toISOString();
    newSpot.properties.modified_timestamp = Date.now();

    // Set spot name
    if (!newSpot.properties.name) {
      const {spotName, spotNumber} = getNewSpotNameObj(newSpot);
      newSpot.properties.name = spotName;
      let updatedPreferences;
      if (!(preferences.restart_num_each_nested_spot && (isOnImageBasemap(newSpot) || isOnStratSection(newSpot)))) {
        updatedPreferences = {...preferences, starting_number_for_spot: spotNumber + 1};
      }
      if (modalVisible === MODAL_KEYS.SHORTCUTS.SAMPLE) {
        updatedPreferences = {
          ...(updatedPreferences || preferences),
          starting_sample_number: (Number(preferences.starting_sample_number) || 1) + 1,
        };
      }
      if (updatedPreferences) dispatch(updatedProject({field: 'preferences', value: updatedPreferences}));
    }
    await checkSpotName(newSpot.properties.name);

    if (newSpot.geometry && (currentImageBasemap || stratSection)) { //newSpot geometry is unavailable when spot is copied.
      const rootSpot = currentImageBasemap ? getRootSpot(currentImageBasemap.id)
        : getSpotWithThisStratSection(stratSection.strat_section_id);
      if (rootSpot && rootSpot.geometry) {
        if (!isEmpty(rootSpot.properties.lng) && !isEmpty(rootSpot.properties.lat)) {
          newSpot.properties.lng = rootSpot.properties.lng;
          newSpot.properties.lat = rootSpot.properties.lat;
        }
        else if (isOnGeoMap(rootSpot)) {
          const center = rootSpot.geometry.type === 'Point' ? rootSpot.geometry.coordinates
            : turf.centroid(rootSpot).geometry.coordinates;
          newSpot.properties.lng = center[0];
          newSpot.properties.lat = center[1];
        }
      }
    }
    // Continuous tagging
    if (useContinuousTagging) {
      let continuousTaggingList = tags.filter(tag => tag.continuousTagging);
      addSpotsToTags(continuousTaggingList, [newSpot]);
    }
    console.log('Creating new Spot:', newSpot);
    dispatch(updatedModifiedTimestampsBySpotsIds([newSpot.properties.id]));
    const targetDataset = getTargetDatasetFromId();
    dispatch(addedNewSpotIdToDataset({datasetId: targetDataset.id, spotId: newSpot.properties.id}));
    dispatch(editedOrCreatedSpot(newSpot));
    console.log('Finished creating new Spot. All Spots: ', spots);
    return newSpot;
  };

  const deleteSpot = (spotId) => {
    console.log('Deleting Spot ID', spotId, '...');
    dispatch(deletedSpotIdFromReports(spotId));
    dispatch(deletedSpotIdFromTags(spotId));
    dispatch(deletedSpotIdFromDatasets(spotId));
    dispatch(deletedSpot(spotId));
    dispatch(setModalVisible({modal: null}));
  };

  const getActiveImageBasemaps = () => {
    return Object.values(getActiveSpotsObj()).reduce((acc, spot) => {
      const imageBasemaps = getImageBasemapsInSpot(spot);
      return [...acc, ...imageBasemaps];
    }, []);
  };

  // Get only the Spots in the active Datasets
  const getActiveSpotsObj = () => {
    let activeSpots = {};
    const activeDatasets = getActiveDatasets();
    console.log('Getting Spots in Active Datasets...');
    Object.values(activeDatasets).forEach((dataset) => {
      let missingSpotsCount = 0;
      let missingSpotsIds = [];
      dataset.spotIds?.forEach((spotId) => {
        if (spots[spotId]) activeSpots = {...activeSpots, [spotId]: spots[spotId]};
        else {
          missingSpotsCount++;
          missingSpotsIds.push(spotId);
        }
      });
      if (missingSpotsCount > 0) {
        console.warn(dataset.name + ':', 'Missing', missingSpotsCount,
          '/', dataset.spotIds?.length || 0, 'Spots', missingSpotsIds);
      }
    });
    console.log('Found', Object.values(activeSpots).length, 'Active Spots:', activeSpots);
    return activeSpots;
  };

  const getAllFeaturesFromSpot = (spotToEvaluate) => {
    let spotsToEvaluate;
    let allFeatures = [];
    if (isEmpty(spotToEvaluate)) spotsToEvaluate = Object.values(getActiveSpotsObj());
    else spotsToEvaluate = [spotToEvaluate];
    let featureElements = [PAGE_KEYS.MEASUREMENTS, PAGE_KEYS.OTHER_FEATURES, PAGE_KEYS.THREE_D_STRUCTURES];
    spotsToEvaluate.forEach((spot) => {
      featureElements.map((featureElement) => {
        if (spot.properties[featureElement]) {
          let featuresCopy = JSON.parse(JSON.stringify(spot.properties[featureElement]));
          featuresCopy.map((featureCopy) => {
            featureCopy.parentSpotId = spot.properties.id;
          });
          allFeatures = allFeatures.concat(featuresCopy);
        }
      });
    });
    return JSON.parse(JSON.stringify(allFeatures)).slice(0, 25);
  };

  // Get parent Spot for image basemap
  const getImageBasemapBySpot = (spot) => {
    const imageBasemapFound = getActiveImageBasemaps().find(
      imageBasemap => imageBasemap.id === spot.properties.image_basemap);
    return imageBasemapFound;
  };

  // Get Interval Spots on a given Strat Section
  const getIntervalSpotsThisStratSection = (stratSectionId) => {
    return Object.values(getActiveSpotsObj()).filter((s) => {
      return s.properties.strat_section_id === stratSectionId
        && s.properties.surface_feature?.surface_feature_type === 'strat_interval';
    });
  };

  // Get Active Spots with Valid Geometry
  const getMappableSpots = () => {
    const allSpotsCopyFiltered = Object.values(getActiveSpotsObj()).filter((spot) => {
      const geometries = spot.geometry?.geometries || [spot.geometry] || [];
      let hasValidGeometry = true;
      geometries.forEach((g) => {
        const coordsFlat = g?.coordinates?.flat(Infinity) || [];
        const coordsFlatValid = coordsFlat.filter(c => c !== null && c !== undefined && !Number.isNaN(c));
        if (!hasValidGeometry || isEmpty(coordsFlat) || !isEqual(coordsFlat, coordsFlatValid)) hasValidGeometry = false;
      });
      if (spot.geometry && !hasValidGeometry) {
        alert('Invalid Geometry',
          'Spot ' + spot.properties.name + ' has invalid geometry. Please edit the geometry of this Spot'
          + ' or delete the Spot.');
        console.error('INVALID Geometry! Spot:', spot);
      }
      return hasValidGeometry;
    });
    // console.log('Spots with Valid Geometry:', allSpotsCopyFiltered);
    return allSpotsCopyFiltered;
  };

  const getNewSpotName = () => {
    const {spotName} = getNewSpotNameObj();
    return spotName;
  };

  const getRecentSpots = () => {
    const activeSpotIds = Object.keys(getActiveSpotsObj());
    return recentViews.reduce((acc, spotId) => {
      return activeSpotIds.includes(spotId.toString()) ? [...acc, spots[spotId.toString()]] : acc;
    }, []);
  };

  // Find the rootSpot for a given image id.
  const getRootSpot = (imageId) => {
    let rootSpot, imageFound = false;
    const allSpots = getActiveSpotsObj();
    for (let index in allSpots) {
      let currentSpot = allSpots[index];
      let spotImages = currentSpot.properties.images;
      for (let imageIndex in spotImages) {
        let currentImage = spotImages[imageIndex];
        if (currentImage.id === imageId) imageFound = true;
      }
      if (imageFound) {
        rootSpot = currentSpot;
        break;
      }
    }
    if (rootSpot && rootSpot.properties.image_basemap) return getRootSpot(rootSpot.properties.image_basemap);
    return rootSpot;
  };

  const getSpotById = (spotId) => {
    if (spots[spotId]) return spots[spotId];
    else Sentry.captureMessage(`Missing Spot ${spotId}`);
  };

  const getSpotByImageId = (imageId) => {
    return Object.values(getActiveSpotsObj()).find((spot) => {
      return spot.properties.images && spot.properties.images.find(image => image.id === imageId);
    });
  };

  const getSpotsByIds = (spotIds) => {
    const idsSet = new Set(spotIds);
    return Object.values(spots).filter(spot => idsSet.has(spot.properties.id));
  };

  const getSpotsInMapExtent = () => spotsInMapExtentIds.map(id => spots[id]);

  // Get all the Spots mapped on a specific image basemap
  const getSpotsMappedOnGivenImageBasemap = (basemapId) => {
    return Object.values(spots).reduce((acc, s) => {
      return s.properties?.image_basemap?.toString() === basemapId?.toString() ? [...acc, s] : acc;
    }, []);
  };

  // Get all the Spots mapped on a specific strat section
  const getSpotsMappedOnGivenStratSection = (stratSectionId) => {
    return Object.values(spots).reduce((acc, s) => {
      return s.properties?.strat_section_id?.toString() === stratSectionId?.toString() ? [...acc, s] : acc;
    }, []);
  };

  const getSpotsWithImages = () => {
    return Object.values(getActiveSpotsObj()).filter(spot => !isEmpty(spot.properties.images));
  };

  const getSpotsWithKey = (key) => {
    return Object.values(getActiveSpotsObj()).filter(spot => !isEmpty(spot.properties[key]));
  };

  const getSpotsWithSamples = () => {
    return Object.values(getActiveSpotsObj()).filter(spot => !isEmpty(spot.properties.samples));
  };

  // Get all active Spots that contain a strat section
  const getSpotsWithStratSection = () => {
    return Object.values(getActiveSpotsObj()).filter(spot => spot?.properties?.sed?.strat_section);
  };

  const getSpotWithThisImageBasemap = (imageBasemapId) => {
    return Object.values(getActiveSpotsObj()).find((spot) => {
      const spotFound = spot.properties?.images?.find(image => image.id === imageBasemapId);
      return spotFound ? spot : undefined;
    });
  };

  // Get the Spot that Contains a Specific Strat Section Given the ID of the Strat Section
  const getSpotWithThisStratSection = (stratSectionId) => {
    return Object.values(getActiveSpotsObj()).find(
      spot => spot?.properties?.sed?.strat_section?.strat_section_id?.toString() === stratSectionId?.toString());
  };

  const handleSpotSelected = (spot) => {
    dispatch(setSelectedSpot(spot));

    // Set correct map for type of selected Spot
    if (isOnGeoMap(spot)) {
      if (currentImageBasemap) dispatch(setCurrentImageBasemap(undefined));
      if (stratSection) dispatch(clearedStratSection());
    }
    else if (isOnImageBasemap(spot)
      && (!currentImageBasemap || currentImageBasemap.id !== spot.properties.image_basemap)) {
      const imageBasemap = getImageBasemapBySpot(spot);
      if (stratSection) dispatch(clearedStratSection());
      dispatch(setCurrentImageBasemap(imageBasemap));
    }
    else if (isOnStratSection(spot)
      && (!stratSection || stratSection.strat_section_id !== spot.properties.strat_section_id)) {
      const stratSectionSettings = getStratSectionSettings(spot.properties.strat_section_id);
      if (currentImageBasemap) dispatch(setCurrentImageBasemap(undefined));
      if (stratSectionSettings) dispatch(setStratSection(stratSectionSettings));
    }
  };

  // Use RecentViews to move those spots to the beginning of the spotsToSort
  // Don't use viewed_timestamp as this is supposed to be removed from Spot objects. Updating viewed_timestamp
  // in slice requires entire spots object to update in redux which breaks editing a feature on the map.
  const sortSpotsByRecentlyViewed = (spotsToSort) => {
    const spotsById = new Map(spotsToSort.map(spot => [spot.properties.id, spot]));
    const recentIds = new Set(recentViews.filter(id => spotsById.has(id)));
    return [...recentIds].map(id => spotsById.get(id)).concat(spotsToSort.filter(s => !recentIds.has(s.properties.id)));
  };

  return {
    checkIsSafeDelete,
    checkSampleName,
    checkSpotName,
    copySpot,
    createRandomSpots,
    createSpot,
    deleteSpot,
    getActiveImageBasemaps,
    getActiveSpotsObj,
    getAllFeaturesFromSpot,
    getImageBasemapBySpot,
    getIntervalSpotsThisStratSection,
    getMappableSpots,
    getNewSpotName,
    getRecentSpots,
    getRootSpot,
    getSpotById,
    getSpotByImageId,
    getSpotGeometryIconSource,
    getSpotsByIds,
    getSpotsInMapExtent,
    getSpotsMappedOnGivenImageBasemap,
    getSpotsMappedOnGivenStratSection,
    getSpotsWithImages,
    getSpotsWithKey,
    getSpotsWithSamples,
    getSpotsWithStratSection,
    getSpotWithThisImageBasemap,
    getSpotWithThisStratSection,
    handleSpotSelected,
    isOnGeoMap,
    isOnImageBasemap,
    isOnSameImageBasemap,
    isOnSameStratSection,
    isOnStratSection,
    isStratInterval,
    sortSpotsAlphabetically,
    sortSpotsByDateCreated,
    sortSpotsByDateLastModified,
    sortSpotsByRecentlyViewed,
  };
};

export default useSpots;
