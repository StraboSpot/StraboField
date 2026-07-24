import * as turf from '@turf/turf';
import {useDispatch, useSelector} from 'react-redux';

import {SED_LABEL_DICTIONARY} from './stratSection.constants';
import {moveSpotByPixels} from './stratSection.helpers';
import alert from '../../../shared/ui/alert';
import {updatedModifiedTimestampsBySpotsIds} from '../../project/projects.slice';
import {X_INTERVAL, Y_MULTIPLIER} from '../../sed/sed.constants';
import {getBasicLithologyIndex, getSiliciclasticGrainSize} from '../../sed/sed.helpers';
import {useSpots} from '../../spots';
import {editedOrCreatedSpot, editedOrCreatedSpots} from '../../spots/spots.slice';
import {addedIntervalDragChangedSpotIds} from '../maps.slice';

const useStratSectionCalculations = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const isDragIntervalMode = useSelector(state => state.map.isDragIntervalMode);
  const stratSection = useSelector(state => state.map.stratSection);

  const {getIntervalSpotsThisStratSection, getSpotsMappedOnGivenStratSection} = useSpots();

  /* Internal Functions */

  // During an interval drag, defer the dataset/project timestamp bump until the user saves the
  // reorder, so a cancel reverts cleanly without flagging anything for save/sync. Outside drag mode, bump now.
  const bumpModifiedTimestampsForSpots = (spotIds) => {
    if (isDragIntervalMode) dispatch(addedIntervalDragChangedSpotIds(spotIds));
    else dispatch(updatedModifiedTimestampsBySpotsIds(spotIds));
  };

  const getIntervalWidth = (sedData, stratSectionId, interbed) => {
    const character = sedData.character;
    const lithologies = sedData.lithologies;
    const n = interbed ? 1 : 0;

    const defaultWidth = X_INTERVAL / 4;
    let i, intervalWidth = defaultWidth;
    // Unexposed/Covered
    if (!character || character === 'unexposed_cove' || character === 'not_measured' || !lithologies) {
      intervalWidth = (0 + 1) * X_INTERVAL;  // Same as clay
    }
    else if (lithologies[n] && (character === 'bed' || character === 'bed_mixed_lit' || character === 'interbedded'
      || character === 'package_succe')) {
      // Weathering Column
      if (stratSection.column_profile === 'weathering_pro') {
        i = SED_LABEL_DICTIONARY.weathering.findIndex((weatheringOption) => {
          return weatheringOption.name === lithologies[n].relative_resistance_weather;
        });
        intervalWidth = i === -1 ? defaultWidth : (i + 1) * X_INTERVAL;
      }
      // Basic Lithologies Column Profile
      else if (stratSection.column_profile === 'basic_lithologies') {
        i = getBasicLithologyIndex(lithologies[n]);
        intervalWidth = i === -1 ? defaultWidth : (i + 2) * X_INTERVAL;
      }
      // Primary Lithology = siliciclastic
      else if (lithologies[n].primary_lithology === 'siliciclastic' && getSiliciclasticGrainSize(lithologies[n])) {
        const grainSizeName = getSiliciclasticGrainSize(lithologies[n]);
        i = SED_LABEL_DICTIONARY.clastic.findIndex(grainSizeOption => grainSizeOption.name === grainSizeName);
        intervalWidth = i === -1 ? defaultWidth : (i + 1) * X_INTERVAL;
      }
      // Primary Lithology = limestone or dolostone
      else if ((lithologies[n].primary_lithology === 'limestone' || lithologies[n].primary_lithology === 'dolostone')
        && lithologies[n].dunham_classification) {
        i = SED_LABEL_DICTIONARY.carbonate.findIndex((grainSizeOption) => {
          return grainSizeOption.name === lithologies[n].dunham_classification;
        });
        intervalWidth = i === -1 ? defaultWidth : (i + 2.33) * X_INTERVAL;
      }
      // Other Lithologies
      else if (lithologies[n].primary_lithology) {
        i = SED_LABEL_DICTIONARY.lithologies.findIndex((grainSizeOption) => {
          return grainSizeOption.name === lithologies[n].primary_lithology;
        });
        i = i - 3; // First 3 indexes are siliciclastic, limestone & dolostone which are handled above
        intervalWidth = i === -1 ? defaultWidth : (i + 2.66) * X_INTERVAL;
      }
      else intervalWidth = (0 + 1) * X_INTERVAL;  // Same as clay
    }
    else console.error('Sed data error:', lithologies[n]);
    return intervalWidth;
  };

  // Get the height (y) of the whole section.
  // For normal sections, returns max Y (top of stack); for core sections, returns min Y (bottom of stack).
  const getSectionHeight = () => {
    const intervals = getIntervalSpotsThisStratSection(stratSection.strat_section_id);
    if (stratSection.section_type === 'core') {
      return intervals.reduce((acc, i) => {
        const coords = i.geometry.coordinates || i.geometry.geometries.map(g => g.coordinates).flat();
        const ys = coords.flat().map(c => c[1]);
        return Math.min(acc, Math.min(...ys));
      }, 0);
    }
    return intervals.reduce((acc, i) => {
      const coords = i.geometry.coordinates || i.geometry.geometries.map(g => g.coordinates).flat();
      const ys = coords.flat().map(c => c[1]);
      const maxY = Math.max(...ys);
      return Math.max(acc, maxY);
    }, 0);
  };

  /* Exported Functions */

  // Calculate the geometry for an interval (single bed or interbedded).
  // anchorY: for normal sections = bottom of interval; for core sections = top of interval.
  const calculateIntervalGeometry = (stratSectionId, sedData, anchorY) => {
    const isCore = stratSection.section_type === 'core';
    const character = sedData.character;
    const interval = sedData.interval;
    const bedding = sedData.bedding;

    const intervalHeight = interval.interval_thickness * Y_MULTIPLIER;
    const intervalWidth = getIntervalWidth(sedData, stratSectionId);
    const minX = 0;
    anchorY = anchorY === undefined ? getSectionHeight() : anchorY;
    const maxX = minX + intervalWidth;
    const minY = isCore ? anchorY - intervalHeight : anchorY;
    const maxY = isCore ? anchorY : anchorY + intervalHeight;

    let geometry = {
      'type': 'Polygon',
      'coordinates': [[[minX, minY], [minX, maxY], [maxX, maxY], [maxX, minY], [minX, minY]]],
    };

    // If interbedded need to create a geometry collection with polygons for each bed
    if ((character === 'interbedded' || character === 'bed_mixed_lit') && bedding && bedding.beds
      && bedding.beds[1] && (bedding.beds[1].avg_thickness && bedding.beds[1].avg_thickness > 0
        || (bedding.beds[1].max_thickness && bedding.beds[1].max_thickness > 0 && bedding.beds[1].min_thickness
          && bedding.beds[1].min_thickness > 0)) && bedding.interbed_proportion > 0) {
      //const thickness1 = bedding.beds[0].avg_thickness ? bedding.beds[0].avg_thickness
      // : (bedding.beds[0].max_thickness + bedding.beds[0].min_thickness) / 2;
      const thickness2 = bedding.beds[1].avg_thickness ? bedding.beds[1].avg_thickness
        : (bedding.beds[1].max_thickness + bedding.beds[1].min_thickness) / 2;

      // Per Casey: Don't use the data from Lithology 1 interbed thickness for plotting since it, along with interval
      // thickness, proportion and Lithology 2 interbed thickness are too many data numbers to plot all faithfully
      const y2 = thickness2 * Y_MULTIPLIER < intervalHeight ? thickness2 * Y_MULTIPLIER : intervalHeight;
      let interbedHeight2 = intervalHeight * (bedding.interbed_proportion / 100 || 0.5);  // secondary interbed
      interbedHeight2 = interbedHeight2 > y2 ? interbedHeight2 : y2;
      const interbedHeight1 = intervalHeight - interbedHeight2;                             // primary interbed

      const numInterbeds2 = Math.min(interbedHeight2 / y2, 3); // Draw a max of 3 beds per lithology
      const y1 = interbedHeight1 / numInterbeds2; // assume an equal number of beds for both lithologies so beds alternate

      const interbedIntervalWidth = getIntervalWidth(sedData, stratSectionId, true);
      let maxXBed = bedding.lithology_at_bottom_contact === 'lithology_2' ? interbedIntervalWidth : intervalWidth;
      let currentBedHeight = bedding.lithology_at_bottom_contact === 'lithology_2' ? y2 : y1;
      const polyCoords = [];
      if (isCore) {
        // Stack beds downward from maxY
        let maxYBed = JSON.parse(JSON.stringify(maxY));
        let minYBed = JSON.parse(JSON.stringify(maxY));
        while (minYBed > maxY - intervalHeight) {
          minYBed = maxYBed - currentBedHeight >= maxY - intervalHeight ? maxYBed - currentBedHeight
            : maxY - intervalHeight;
          const coords = [[minX, minYBed], [minX, maxYBed], [maxXBed, maxYBed], [maxXBed, minYBed], [minX, minYBed]];
          polyCoords.push(coords);
          currentBedHeight = currentBedHeight === y1 ? y2 : y1;
          maxXBed = maxXBed === intervalWidth ? interbedIntervalWidth : intervalWidth;
          maxYBed = JSON.parse(JSON.stringify(minYBed));
        }
      }
      else {
        // Stack beds upward from minY
        let minYBed = JSON.parse(JSON.stringify(minY));
        let maxYBed = JSON.parse(JSON.stringify(minY));
        while (maxYBed < minY + intervalHeight) {
          maxYBed = minYBed + currentBedHeight <= minY + intervalHeight ? minYBed + currentBedHeight
            : minY + intervalHeight;
          const coords = [[minX, minYBed], [minX, maxYBed], [maxXBed, maxYBed], [maxXBed, minYBed], [minX, minYBed]];
          polyCoords.push(coords);
          currentBedHeight = currentBedHeight === y1 ? y2 : y1;
          maxXBed = maxXBed === intervalWidth ? interbedIntervalWidth : intervalWidth;
          minYBed = JSON.parse(JSON.stringify(maxYBed));
        }
      }

      const geometries = polyCoords.map(polyCoord => ({
        'type': 'Polygon',
        'coordinates': [polyCoord],
      }));

      geometry = {
        'type': 'GeometryCollection',
        'geometries': geometries,
      };
    }
    else if (character === 'interbedded' || character === 'bed_mixed_lit') {
      console.log('Not enough data to properly draw interval', sedData);
      alert(
        'Missing Data!',
        'This interval is interbedded or mixed but there is not enough data to properly '
        + 'draw this interval. Check that you have entered all of the necessary bedding data for two lithologies. '
        + 'This includes the fields Lithology 1: Interbed Relative Proportion (%) and either the Average '
        + 'Thickness or both the Maximum Thickness and Minimum Thickness of the interbeds for '
        + 'both lithologies found on the Bedding page. ',
      );
    }
    return geometry;
  };

  // Move target interval to after given interval (the preceding interval)
  const moveIntervalToAfter = (targetInterval, precedingInterval) => {
    const isCore = stratSection.section_type === 'core';
    let targetIntervalExtent = turf.bbox(targetInterval);
    const targetIntervalHeight = targetIntervalExtent[3] - targetIntervalExtent[1];
    console.log('interval to move:', targetInterval, 'height:', targetIntervalHeight);

    // For core: stack downward — anchor is top of new interval = bottom of preceding (or 0 if none).
    // For normal: stack upward — anchor is bottom of new interval = top of preceding (or 0 if none).
    let minY, maxY;
    if (isCore) {
      maxY = precedingInterval ? turf.bbox(precedingInterval)[1] : 0;
      minY = maxY - targetIntervalHeight;
    }
    else {
      minY = precedingInterval ? turf.bbox(precedingInterval)[3] : 0;
      maxY = minY + targetIntervalHeight;
    }

    const targetIntervalModified = JSON.parse(JSON.stringify(targetInterval));
    // Regular interval (polygon geometry)
    if (targetIntervalModified.geometry.type !== 'GeometryCollection') {
      const targetIntervalModifiedCoords = targetIntervalModified.geometry.coordinates;
      targetIntervalModifiedCoords[0][0][1] = targetIntervalModifiedCoords[0][3][1] = targetIntervalModifiedCoords[0][4][1] = minY;
      targetIntervalModifiedCoords[0][1][1] = targetIntervalModifiedCoords[0][2][1] = maxY;
    }
    // Interbedded interval (geometry collection)
    else if (isCore) {
      let currentMaxY = maxY;
      targetIntervalModified.geometry.geometries.forEach((_, g) => {
        const interbedExtent = turf.bbox(targetIntervalModified.geometry.geometries[g]);
        const newInterbedHeight = interbedExtent[3] - interbedExtent[1];
        const currentMinY = currentMaxY - newInterbedHeight;
        targetIntervalModified.geometry.geometries[g].coordinates[0][0][1] = currentMinY;
        targetIntervalModified.geometry.geometries[g].coordinates[0][1][1] = currentMaxY;
        targetIntervalModified.geometry.geometries[g].coordinates[0][2][1] = currentMaxY;
        targetIntervalModified.geometry.geometries[g].coordinates[0][3][1] = currentMinY;
        targetIntervalModified.geometry.geometries[g].coordinates[0][4][1] = currentMinY;
        currentMaxY = currentMinY;
      });
    }
    else {
      targetIntervalModified.geometry.geometries.forEach((_, g) => {
        const interbedExtent = turf.bbox(targetIntervalModified.geometry.geometries[g]);
        const newInterbedHeight = interbedExtent[3] - interbedExtent[1];
        maxY = minY + newInterbedHeight;
        targetIntervalModified.geometry.geometries[g].coordinates[0][0][1] = minY;
        targetIntervalModified.geometry.geometries[g].coordinates[0][1][1] = maxY;
        targetIntervalModified.geometry.geometries[g].coordinates[0][2][1] = maxY;
        targetIntervalModified.geometry.geometries[g].coordinates[0][3][1] = minY;
        targetIntervalModified.geometry.geometries[g].coordinates[0][4][1] = minY;
        minY = maxY;
      });
    }
    console.log('interval w new geom:', targetIntervalModified);
    bumpModifiedTimestampsForSpots([targetIntervalModified.properties.id]);
    dispatch(editedOrCreatedSpot(targetIntervalModified));
    targetIntervalExtent = turf.bbox(targetIntervalModified);
    // For core: push spots below the new interval deeper (negative direction).
    // For normal: push spots above the new interval up.
    if (isCore) {
      moveSpotsUpOrDownByPixels(targetIntervalModified.properties.strat_section_id, targetIntervalExtent[3],
        -targetIntervalHeight, targetIntervalModified.properties.id);
    }
    else {
      moveSpotsUpOrDownByPixels(targetIntervalModified.properties.strat_section_id, targetIntervalExtent[1],
        targetIntervalHeight, targetIntervalModified.properties.id);
    }
  };

  // Move all Spots (except excluded Spot, if given) in a specified Strat Section
  // up after cutoff (if pixels is positive) or down after cutoff (if pixels is negative).
  // For core sections, "below" means a spot whose top (maxY) is at or below the cutoff.
  // For normal sections, "above" means a spot whose bottom (minY) is at or above the cutoff.
  const moveSpotsUpOrDownByPixels = (stratSectionId, cutoff, pixels, excludedSpotId) => {
    const isCore = stratSection.section_type === 'core';
    const spots = getSpotsMappedOnGivenStratSection(stratSectionId);
    const spotsFiltered = spots.filter(spot => excludedSpotId && spot.properties.id !== excludedSpotId);
    const movedSpots = spotsFiltered
      .filter((spot) => {
        const extent = turf.bbox(spot);
        return isCore ? extent[3] <= cutoff : extent[1] >= cutoff;
      })
      .map(spot => moveSpotByPixels(spot, pixels));
    console.log('Dispatching', movedSpots);
    bumpModifiedTimestampsForSpots(movedSpots.map(s => s.properties.id));
    dispatch(editedOrCreatedSpots(movedSpots));
  };

  const recalculateIntervalGeometry = (spot) => {
    console.log('Recalculating Spot Geometry...', spot);
    const isCore = stratSection.section_type === 'core';
    const extent = turf.bbox(spot);
    // For core: anchor to the top of the interval (maxY); for normal: anchor to the bottom (minY).
    const anchorY = isCore ? extent[3] : extent[1];
    const updatedGeometry = calculateIntervalGeometry(spot.properties.strat_section_id, spot.properties.sed, anchorY);
    const editedSpot = {...spot, geometry: updatedGeometry};
    console.log('Spot after geometry recalculation', editedSpot);
    bumpModifiedTimestampsForSpots([editedSpot.properties.id]);
    dispatch(editedOrCreatedSpot(editedSpot));
    console.log('Dispatching', editedSpot);
    return editedSpot;
  };

  // Reorder an interval: close gap at its old position, then place it after precedingInterval.
  // precedingInterval is null to place at the bottom (non-core) or top (core) of the stack.
  const reorderInterval = (targetInterval, precedingInterval) => {
    const isCore = stratSection.section_type === 'core';
    const stratSectionId = targetInterval.properties.strat_section_id;
    const targetExtent = turf.bbox(targetInterval);
    const targetHeight = targetExtent[3] - targetExtent[1];

    // All spots on this strat section except the target interval
    const allSpots = getSpotsMappedOnGivenStratSection(stratSectionId);
    let updatedSpots = allSpots
      .filter(s => s.properties.id !== targetInterval.properties.id)
      .map(s => JSON.parse(JSON.stringify(s)));

    // Step 1: Close the gap at the target's old position
    const gapCutoff = isCore ? targetExtent[1] : targetExtent[3];
    const gapPixels = isCore ? targetHeight : -targetHeight;
    updatedSpots = updatedSpots.map((spot) => {
      const ext = turf.bbox(spot);
      return (isCore ? ext[3] <= gapCutoff : ext[1] >= gapCutoff) ? moveSpotByPixels(spot, gapPixels) : spot;
    });

    // Step 2: Find the updated preceding interval
    const updatedPrecedingInterval = precedingInterval
      ? updatedSpots.find(s => s.properties.id === precedingInterval.properties.id) || null
      : null;

    // Step 3: Compute the target's new position
    let newMinY, newMaxY;
    if (isCore) {
      newMaxY = updatedPrecedingInterval ? turf.bbox(updatedPrecedingInterval)[1] : 0;
      newMinY = newMaxY - targetHeight;
    }
    else {
      newMinY = updatedPrecedingInterval ? turf.bbox(updatedPrecedingInterval)[3] : 0;
      newMaxY = newMinY + targetHeight;
    }

    // Update target geometry
    const newTarget = JSON.parse(JSON.stringify(targetInterval));
    if (newTarget.geometry.type !== 'GeometryCollection') {
      newTarget.geometry.coordinates[0][0][1] = newTarget.geometry.coordinates[0][3][1]
        = newTarget.geometry.coordinates[0][4][1] = newMinY;
      newTarget.geometry.coordinates[0][1][1] = newTarget.geometry.coordinates[0][2][1] = newMaxY;
    }
    else if (isCore) {
      let curMaxY = newMaxY;
      newTarget.geometry.geometries.forEach((_, g) => {
        const ih = turf.bbox(targetInterval.geometry.geometries[g]);
        const interbedHeight = ih[3] - ih[1];
        const curMinY = curMaxY - interbedHeight;
        newTarget.geometry.geometries[g].coordinates[0][0][1] = curMinY;
        newTarget.geometry.geometries[g].coordinates[0][1][1] = curMaxY;
        newTarget.geometry.geometries[g].coordinates[0][2][1] = curMaxY;
        newTarget.geometry.geometries[g].coordinates[0][3][1] = curMinY;
        newTarget.geometry.geometries[g].coordinates[0][4][1] = curMinY;
        curMaxY = curMinY;
      });
    }
    else {
      let curMinY = newMinY;
      newTarget.geometry.geometries.forEach((_, g) => {
        const ih = turf.bbox(targetInterval.geometry.geometries[g]);
        const interbedHeight = ih[3] - ih[1];
        const curMaxY = curMinY + interbedHeight;
        newTarget.geometry.geometries[g].coordinates[0][0][1] = curMinY;
        newTarget.geometry.geometries[g].coordinates[0][1][1] = curMaxY;
        newTarget.geometry.geometries[g].coordinates[0][2][1] = curMaxY;
        newTarget.geometry.geometries[g].coordinates[0][3][1] = curMinY;
        newTarget.geometry.geometries[g].coordinates[0][4][1] = curMinY;
        curMinY = curMaxY;
      });
    }

    // Step 4: Open space at the new position for the target
    const newCutoff = isCore ? newMaxY : newMinY;
    const makeRoomPixels = isCore ? -targetHeight : targetHeight;
    updatedSpots = updatedSpots.map((spot) => {
      const ext = turf.bbox(spot);
      return (isCore ? ext[3] <= newCutoff : ext[1] >= newCutoff)
        ? moveSpotByPixels(spot, makeRoomPixels) : spot;
    });

    // Dispatch all changes at once
    const allChanged = [...updatedSpots, newTarget];
    bumpModifiedTimestampsForSpots(allChanged.map(s => s.properties.id));
    dispatch(editedOrCreatedSpots(allChanged));
  };

  return {
    calculateIntervalGeometry,
    moveIntervalToAfter,
    moveSpotsUpOrDownByPixels,
    recalculateIntervalGeometry,
    reorderInterval,
  };
};

export default useStratSectionCalculations;
