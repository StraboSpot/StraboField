import {Platform} from 'react-native';

import * as Sentry from '@sentry/react-native';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {deletedSpot, editedOrCreatedSpot, editedOrCreatedSpots, setSelectedSpot} from './spots.slice';
import {getNewCopyId, getNewId, isEmpty, isEqual, sleep} from '../../shared/Helpers';
import {SMALL_SCREEN} from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import {setModalVisible} from '../home/home.slice';
import {clearedStratSection, setCurrentImageBasemap, setStratSection} from '../maps/maps.slice';
import {MODAL_KEYS, PAGE_KEYS} from '../page/page.constants';
import {
  addedNewSpotIdsToDataset,
  addedNewSpotIdToDataset,
  deletedSpotIdFromDatasets,
  deletedSpotIdFromTags,
  updatedModifiedTimestampsBySpotsIds,
  updatedProject,
} from '../project/projects.slice';
import useProject from '../project/useProject';
import {useTags} from '../tags';

const useSpots = () => {
  const {getActiveDatasets, getSelectedDatasetFromId} = useProject();
  const {addSpotsToTags} = useTags();

  const dispatch = useDispatch();
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const datasets = useSelector(state => state.project.datasets);
  const modalVisible = useSelector(state => state.home.modalVisible);
  const preferences = useSelector(state => state.project.project?.preferences) || {};
  const recentViews = useSelector(state => state.spot.recentViews);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);
  const spots = useSelector(state => state.spot.spots);
  const spotsInMapExtentIds = useSelector(state => state.map.spotsInMapExtentIds);
  const stratSection = useSelector(state => state.map.stratSection);
  const tags = useSelector(state => state.project.project?.tags) || [];
  const useContinuousTagging = useSelector(state => state.project.project?.useContinuousTagging);

  const toast = useToast();

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
  const checkSampleName = async (name, toastRef) => {
    if (preferences.warn_on_dupe_sample_name) {
      const sampleNames = Object.values(spots).reduce((acc, spot) => {
        const spotSampleNames = spot.properties.samples?.map(sample => sample.sample_id_name);
        return spotSampleNames ? [...new Set([...acc, ...spotSampleNames])] : acc;
      }, []);
      const foundDuplicateName = sampleNames.includes(name);
      if (foundDuplicateName) {
        const toastMsg = 'Warning! Sample Name has Already Been Used.';
        const toastOptions = {duration: 3000, type: 'warning', placement: 'top'};
        if (SMALL_SCREEN && toastRef) toastRef.current.show(toastMsg, toastOptions);
        else toast.show(toastMsg, toastOptions);
        if (Platform.OS === 'web') await sleep(3000);
      }
    }
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
    const selectedDataset = getSelectedDatasetFromId();
    dispatch(addedNewSpotIdsToDataset({datasetId: selectedDataset.id, spotIds: newSpots.map(s => s.properties.id)}));
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
          starting_sample_number: (preferences.starting_sample_number || 1) + 1,
        };
      }
      if (updatedPreferences) dispatch(updatedProject({field: 'preferences', value: updatedPreferences}));
    }
    await checkSpotName(newSpot.properties.name);

    if ((currentImageBasemap || stratSection) && newSpot.geometry && newSpot.geometry.type === 'Point') { //newSpot geometry is unavailable when spot is copied.
      const rootSpot = currentImageBasemap ? getRootSpot(currentImageBasemap.id)
        : getSpotWithThisStratSection(stratSection.strat_section_id);
      if (rootSpot && rootSpot.geometry && rootSpot.geometry.type === 'Point') {
        newSpot.properties.lng = rootSpot.geometry.coordinates[0];
        newSpot.properties.lat = rootSpot.geometry.coordinates[1];
      }
    }
    // Continuous tagging
    if (useContinuousTagging) {
      let continuousTaggingList = tags.filter(tag => tag.continuousTagging);
      addSpotsToTags(continuousTaggingList, [newSpot]);
    }
    console.log('Creating new Spot:', newSpot);
    dispatch(updatedModifiedTimestampsBySpotsIds([newSpot.properties.id]));
    const selectedDataset = getSelectedDatasetFromId();
    dispatch(addedNewSpotIdToDataset({datasetId: selectedDataset.id, spotId: newSpot.properties.id}));
    dispatch(editedOrCreatedSpot(newSpot));
    console.log('Finished creating new Spot. All Spots: ', spots);
    return newSpot;
  };

  const deleteSpot = (spotId) => {
    console.log('Deleting Spot ID', spotId, '...');
    dispatch(deletedSpotIdFromTags(spotId));
    dispatch(deletedSpotIdFromDatasets(spotId));
    dispatch(deletedSpot(spotId));
    dispatch(setModalVisible({modal: null}));
  };

  // Get only the Spots in the active Datasets
  const getActiveSpotsObj = () => {
    let activeSpots = {};
    const activeDatasets = getActiveDatasets();
    console.groupCollapsed('Getting Spots in Active Datasets...');
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
      console.log(dataset.name, '- Missing', missingSpotsCount, '/', dataset.spotIds?.length || 0, 'Spots',
        missingSpotsIds);
    });
    console.groupEnd();
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

  const getAllSpotSamplesCount = async () => {
    // let spotsObjArr = [];
    let samplesArr = [];
    //get all datasets with spots
    await Promise.all(Object.values(datasets).filter((dataset) => {
        if (!isEmpty(dataset.spotIds)) {
          dataset.spotIds.map(async (spotId) => {
            const spotObj = await getSpotById(spotId);
            if (!isEmpty(spotObj?.properties?.samples)) {
              spotObj.properties.samples.map((sample) => {
                samplesArr.push(sample);
                console.log(1);
              });
              console.log(2);
            }
            console.log(3);
          });
          console.log(4);
        }
      }),
    );
    console.log(5);
    console.log('SamplesArr', samplesArr.length);
    return samplesArr.length;

    //filter out spots with samples in separate array

    //get the length of the array
  };

  // Get parent Spot for image basemap
  const getImageBasemapBySpot = (spot) => {
    const imageBasemapFound = getImageBasemaps().find(
      imageBasemap => imageBasemap.id === spot.properties.image_basemap);
    return imageBasemapFound;
  };

  const getImageBasemaps = () => {
    return Object.values(getActiveSpotsObj()).reduce((acc, spot) => {
      const imageBasemaps = spot.properties.images
        && spot.properties.images.reduce((acc1, image) => {
          return image.annotated ? [...acc1, image] : acc1;
        }, []) || [];
      return [...acc, ...imageBasemaps];
    }, []);
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
    const allSpotsCopy = JSON.parse(JSON.stringify(Object.values(getActiveSpotsObj())));
    const allSpotsCopyFiltered = allSpotsCopy.filter((spot) => {
      const geometries = spot.geometry?.geometries || [spot.geometry] || [];
      let hasValidGeometry = true;
      geometries.forEach((g) => {
        const coordsFlat = g?.coordinates?.flat(Infinity) || [];
        const coordsFlatValid = coordsFlat.filter(c => c !== null && c !== undefined && !Number.isNaN(c));
        if (!hasValidGeometry || isEmpty(coordsFlat) || !isEqual(coordsFlat, coordsFlatValid)) hasValidGeometry = false;
      });
      if (spot.geometry && !hasValidGeometry) {
        alert('Invalid Geometry', 'Found a Spot with invalid geometry. Unable to map this Spot.'
          + '\nSpot Name: ' + spot.properties.name);
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

  const getNewSpotNameObj = (newSpot) => {
    let namePrefix = preferences.spot_prefix || '';
    if (newSpot && preferences.nested_spot_prefix && (isOnImageBasemap(newSpot) || isOnStratSection(newSpot))) {
      namePrefix = preferences.nested_spot_prefix;
    }

    let newSpotName = namePrefix;
    if (newSpot && preferences.prepend_spot_name_nested_spot && (isOnImageBasemap(newSpot) || isOnStratSection(
      newSpot))) {
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
        const spotsMappedOnGivenImageBasemap = getSpotsMappedOnGivenImageBasemap(newSpot.properties.image_basemap);
        spotNumber = spotsMappedOnGivenImageBasemap.length + 1;
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

  const getSpotGeometryIconSource = (spot) => {
    if (spot?.geometry?.type === 'Point') {
      if (spot.properties?.image_basemap) return require('../../assets/icons/ImagePoint_pressed.png');
      else if (spot.properties?.strat_section_id) return require('../../assets/icons/StratPoint_pressed.png');
      else return require('../../assets/icons/Point_pressed.png');
    }
    else if (spot?.geometry?.type === 'LineString') {
      if (spot.properties?.image_basemap) return require('../../assets/icons/ImageLine_pressed.png');
      else if (spot.properties?.strat_section_id) return require('../../assets/icons/StratLine_pressed.png');
      else return require('../../assets/icons/Line_pressed.png');
    }
    else if (spot?.geometry?.type === 'Polygon' || spot?.geometry?.type === 'GeometryCollection') {
      if (spot.properties?.image_basemap) return require('../../assets/icons/ImagePolygon_pressed.png');
      else if (spot.properties?.strat_section_id) return require('../../assets/icons/StratPolygon_pressed.png');
      else return require('../../assets/icons/Polygon_pressed.png');
    }
    else return require('../../assets/icons/QuestionMark_pressed.png');
  };

  const getSpotWithThisImageBasemap = (imageBasemapId) => {
    return Object.values(getActiveSpotsObj()).find((spot) => {
      const spotFound = spot.properties?.images?.find(image => image.id === imageBasemapId);
      return spotFound ? spot : undefined;
    });
  };

  // Get the Spot that Contains a Specific Strat Section Given the ID of the Strat Section
  const getSpotWithThisStratSection = (stratSectionId) => {
    // Comparing int to string so use only 2 equal signs
    return Object.values(getActiveSpotsObj()).find(
      spot => spot?.properties?.sed?.strat_section?.strat_section_id == stratSectionId);
  };

  const getSpotsByIds = (spotIds) => {
    const foundSpots = [];
    Object.entries(spots).forEach((obj) => {
      if (spotIds.includes(obj[1].properties.id)) foundSpots.push(obj[1]);
    });
    return foundSpots;
  };

  const getSpotsInMapExtent = () => spotsInMapExtentIds.map(id => spots[id]);

  // Get all the Spots mapped on a specific image basemap
  const getSpotsMappedOnGivenImageBasemap = (basemapId) => {
    return Object.values(spots).reduce((acc, s) => {
      return s.properties?.image_basemap == basemapId ? [...acc, s] : acc;
    }, []);
  };

  // Get all the Spots mapped on a specific strat section
  const getSpotsMappedOnGivenStratSection = (stratSectionId) => {
    return Object.values(spots).reduce((acc, s) => {
      return s.properties?.strat_section_id == stratSectionId ? [...acc, s] : acc;
    }, []);
  };

  // Reverse chronologically sort active Spots
  const getSpotsSortedReverseChronologically = () => {
    return Object.values(getActiveSpotsObj()).sort(((a, b) => {
      return new Date(b.properties.date) - new Date(a.properties.date);
    }));
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

  const getStratSectionSettings = (stratSectionId) => {
    const spot = getSpotWithThisStratSection(stratSectionId);
    return spot && spot.properties && spot.properties.sed
    && spot.properties.sed.strat_section ? spot.properties.sed.strat_section : undefined;
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

  // If feature is mapped on geographical map, not an image basemap or strat section
  const isOnGeoMap = (feature) => {
    if (isEmpty(feature)) return false;
    return !feature.properties.image_basemap && !feature.properties.strat_section_id;
  };

  const isOnImageBasemap = feature => feature.properties?.image_basemap;

  const isOnStratSection = feature => feature.properties?.strat_section_id;

  const isStratInterval = (spot) => {
    return spot?.properties?.strat_section_id && spot?.properties?.surface_feature?.surface_feature_type === 'strat_interval';
  };

  const sortSpotsAlphabetically = (spotsToSort) => {
    spotsToSort.sort(
      ((a, b) => (a.properties?.name?.toLowerCase() || '').localeCompare(b.properties?.name?.toLowerCase() || '')));
    return spotsToSort;
  };

  const sortSpotsByDateCreated = (spotsToSort) => {
    spotsToSort.sort(((a, b) => new Date(b.properties.date) - new Date(a.properties.date)));
    return spotsToSort;
  };

  const sortSpotsByDateLastModified = (spotsToSort) => {
    spotsToSort.sort(((a, b) => new Date(b.properties.modified_timestamp) - new Date(a.properties.modified_timestamp)));
    return spotsToSort;
  };

  // Use RecentViews to move those spots to the beginning of the spotsToSort
  // Don't use viewed_timestamp as this is supposed to be removed from Spot objects. Updating viewed_timestamp
  // in slice requires entire spots object to update in redux which breaks editing a feature on the map.
  const sortSpotsByRecentlyViewed = (spotsToSort) => {
    const spotsToSortIds = spotsToSort.map(spot => spot.properties.id);
    let spotsToSortInRecentViewsIds = recentViews.reduce((acc, spotId) => {
      return spotsToSortIds.includes(spotId) ? [...acc, spotId] : acc;
    }, []);
    const spotsSortedByRecentlyViewedIds = [...new Set([...spotsToSortInRecentViewsIds, ...spotsToSortIds])];
    return spotsSortedByRecentlyViewedIds.map(spotId => spotsToSort.find(spot => spot.properties.id === spotId));
  };

  return {
    checkIsSafeDelete: checkIsSafeDelete,
    checkSampleName: checkSampleName,
    checkSpotName: checkSpotName,
    copySpot: copySpot,
    createRandomSpots: createRandomSpots,
    createSpot: createSpot,
    deleteSpot: deleteSpot,
    getActiveSpotsObj: getActiveSpotsObj,
    getAllFeaturesFromSpot: getAllFeaturesFromSpot,
    getAllSpotSamplesCount: getAllSpotSamplesCount,
    getImageBasemapBySpot: getImageBasemapBySpot,
    getImageBasemaps: getImageBasemaps,
    getIntervalSpotsThisStratSection: getIntervalSpotsThisStratSection,
    getMappableSpots: getMappableSpots,
    getNewSpotName: getNewSpotName,
    getRecentSpots: getRecentSpots,
    getRootSpot: getRootSpot,
    getSpotById: getSpotById,
    getSpotByImageId: getSpotByImageId,
    getSpotGeometryIconSource: getSpotGeometryIconSource,
    getSpotWithThisImageBasemap: getSpotWithThisImageBasemap,
    getSpotWithThisStratSection: getSpotWithThisStratSection,
    getSpotsByIds: getSpotsByIds,
    getSpotsInMapExtent: getSpotsInMapExtent,
    getSpotsMappedOnGivenImageBasemap: getSpotsMappedOnGivenImageBasemap,
    getSpotsMappedOnGivenStratSection: getSpotsMappedOnGivenStratSection,
    getSpotsSortedReverseChronologically: getSpotsSortedReverseChronologically,
    getSpotsWithImages: getSpotsWithImages,
    getSpotsWithKey: getSpotsWithKey,
    getSpotsWithSamples: getSpotsWithSamples,
    getSpotsWithStratSection: getSpotsWithStratSection,
    handleSpotSelected: handleSpotSelected,
    isOnGeoMap: isOnGeoMap,
    isOnImageBasemap: isOnImageBasemap,
    isOnStratSection: isOnStratSection,
    isStratInterval: isStratInterval,
    sortSpotsAlphabetically: sortSpotsAlphabetically,
    sortSpotsByDateCreated: sortSpotsByDateCreated,
    sortSpotsByDateLastModified: sortSpotsByDateLastModified,
    sortSpotsByRecentlyViewed: sortSpotsByRecentlyViewed,
  };
};

export default useSpots;
