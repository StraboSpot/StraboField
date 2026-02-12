import * as turf from '@turf/turf';
import {useDispatch, useSelector} from 'react-redux';

import {SED_LABEL_DICTIONARY} from './stratSection.constants';
import alert from '../../../shared/ui/alert';
import {updatedModifiedTimestampsBySpotsIds} from '../../project/projects.slice';
import useSedValidation from '../../sed/useSedValidation';
import {useSpots} from '../../spots';
import {editedOrCreatedSpot, editedOrCreatedSpots} from '../../spots/spots.slice';

const useStratSectionCalculations = () => {
  const dispatch = useDispatch();
  const stratSection = useSelector(state => state.map.stratSection);

  const {getIntervalSpotsThisStratSection, getSpotsMappedOnGivenStratSection} = useSpots();
  const {getBasicLithologyIndex, getSiliciclasticGrainSize} = useSedValidation();

  const xInterval = 10;  // Horizontal spacing between grain sizes/weathering tick marks
  const yMultiplier = 20;  // 1 m interval thickness = 20 pixels

  // Calculate the geometry for an interval (single bed or interbedded)
  const calculateIntervalGeometry = (stratSectionId, sedData, minY) => {
    const character = sedData.character;
    const interval = sedData.interval;
    const bedding = sedData.bedding;

    const intervalHeight = interval.interval_thickness * yMultiplier;
    const intervalWidth = getIntervalWidth(sedData, stratSectionId);
    const minX = 0;
    minY = minY === undefined ? getSectionHeight() : minY;
    const maxX = minX + intervalWidth;
    const maxY = minY + intervalHeight;

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
      const y2 = thickness2 * yMultiplier < intervalHeight ? thickness2 * yMultiplier : intervalHeight;
      let interbedHeight2 = intervalHeight * (bedding.interbed_proportion / 100 || 0.5);  // secondary interbed
      interbedHeight2 = interbedHeight2 > y2 ? interbedHeight2 : y2;
      const interbedHeight1 = intervalHeight - interbedHeight2;                             // primary interbed

      const numInterbeds2 = Math.min(interbedHeight2 / y2, 3); // Draw a max of 3 beds per lithology
      const y1 = interbedHeight1 / numInterbeds2; // assume an equal number of beds for both lithologies so beds alternate

      const interbedIntervalWidth = getIntervalWidth(sedData, stratSectionId, true);
      let maxXBed = bedding.lithology_at_bottom_contact === 'lithology_2' ? interbedIntervalWidth : intervalWidth;
      let minYBed = JSON.parse(JSON.stringify(minY));
      let maxYBed = JSON.parse(JSON.stringify(minY));
      let currentBedHeight = bedding.lithology_at_bottom_contact === 'lithology_2' ? y2 : y1;
      const polyCoords = [];
      while (maxYBed < minY + intervalHeight) {
        maxYBed = minYBed + currentBedHeight <= minY + intervalHeight ? minYBed + currentBedHeight
          : minY + intervalHeight;
        const coords = [[minX, minYBed], [minX, maxYBed], [maxXBed, maxYBed], [maxXBed, minYBed], [minX, minYBed]];
        polyCoords.push(coords);
        currentBedHeight = currentBedHeight === y1 ? y2 : y1;
        maxXBed = maxXBed === intervalWidth ? interbedIntervalWidth : intervalWidth;
        minYBed = JSON.parse(JSON.stringify(maxYBed));
      }

      const geometries = [];
      polyCoords.forEach((polyCoord) => {
        geometries.push({
          'type': 'Polygon',
          'coordinates': [polyCoord],
        });
      });

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

  const getIntervalWidth = (sedData, stratSectionId, interbed) => {
    const character = sedData.character;
    const lithologies = sedData.lithologies;
    const n = interbed ? 1 : 0;

    const defaultWidth = xInterval / 4;
    let i, intervalWidth = defaultWidth;
    // Unexposed/Covered
    if (!character || character === 'unexposed_cove' || character === 'not_measured' || !lithologies) {
      intervalWidth = (0 + 1) * xInterval;  // Same as clay
    }
    else if (lithologies[n] && (character === 'bed' || character === 'bed_mixed_lit' || character === 'interbedded'
      || character === 'package_succe')) {
      // Weathering Column
      if (stratSection.column_profile === 'weathering_pro') {
        i = SED_LABEL_DICTIONARY.weathering.findIndex((weatheringOption) => {
          return weatheringOption.name === lithologies[n].relative_resistance_weather;
        });
        intervalWidth = i === -1 ? defaultWidth : (i + 1) * xInterval;
      }
      // Basic Lithologies Column Profile
      else if (stratSection.column_profile === 'basic_lithologies') {
        i = getBasicLithologyIndex(lithologies[n]);
        intervalWidth = i === -1 ? defaultWidth : (i + 2) * xInterval;
      }
      // Primary Lithology = siliciclastic
      else if (lithologies[n].primary_lithology === 'siliciclastic' && getSiliciclasticGrainSize(lithologies[n])) {
        const grainSizeName = getSiliciclasticGrainSize(lithologies[n]);
        i = SED_LABEL_DICTIONARY.clastic.findIndex(grainSizeOption => grainSizeOption.name === grainSizeName);
        intervalWidth = i === -1 ? defaultWidth : (i + 1) * xInterval;
      }
      // Primary Lithology = limestone or dolostone
      else if ((lithologies[n].primary_lithology === 'limestone' || lithologies[n].primary_lithology === 'dolostone')
        && lithologies[n].dunham_classification) {
        i = SED_LABEL_DICTIONARY.carbonate.findIndex((grainSizeOption) => {
          return grainSizeOption.name === lithologies[n].dunham_classification;
        });
        intervalWidth = i === -1 ? defaultWidth : (i + 2.33) * xInterval;
      }
      // Other Lithologies
      else if (lithologies[n].primary_lithology) {
        i = SED_LABEL_DICTIONARY.lithologies.findIndex((grainSizeOption) => {
          return grainSizeOption.name === lithologies[n].primary_lithology;
        });
        i = i - 3; // First 3 indexes are siliciclastic, limestone & dolostone which are handled above
        intervalWidth = i === -1 ? defaultWidth : (i + 2.66) * xInterval;
      }
      else intervalWidth = (0 + 1) * xInterval;  // Same as clay
    }
    else console.error('Sed data error:', lithologies[n]);
    return intervalWidth;
  };

  // Get the height (y) of the whole section
  const getSectionHeight = () => {
    const intervals = getIntervalSpotsThisStratSection(stratSection.strat_section_id);
    return intervals.reduce((acc, i) => {
      const coords = i.geometry.coordinates || i.geometry.geometries.map(g => g.coordinates).flat();
      const ys = coords.flat().map(c => c[1]);
      const maxY = Math.max(...ys);
      return Math.max(acc, maxY);
    }, 0);
  };

  // Move target interval to after given interval (the preceding interval)
  const moveIntervalToAfter = (targetInterval, precedingInterval) => {
    let targetIntervalExtent = turf.bbox(targetInterval);
    const targetIntervalHeight = targetIntervalExtent[3] - targetIntervalExtent[1];
    console.log('interval to move:', targetInterval, 'height:', targetIntervalHeight);

    // Move new interval (to bottom if no precedingInterval)
    let minY = 0;
    if (precedingInterval) {
      const precedingIntervalExtent = turf.bbox(precedingInterval);
      minY = precedingIntervalExtent[3];
    }
    let maxY = minY + targetIntervalHeight;
    let targetIntervalModified = JSON.parse(JSON.stringify(targetInterval));
    // Regular interval (polygon geometry)
    if (targetIntervalModified.geometry.type !== 'GeometryCollection') {
      let targetIntervalModifiedCoords = targetIntervalModified.geometry.coordinates;
      targetIntervalModifiedCoords[0][0][1] = targetIntervalModifiedCoords[0][3][1] = targetIntervalModifiedCoords[0][4][1] = minY;
      targetIntervalModifiedCoords[0][1][1] = targetIntervalModifiedCoords[0][2][1] = maxY;
    }
    // Interbedded interval (geometry collection)
    else {
      targetIntervalModified.geometry.geometries.forEach((geometry, g) => {
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
    dispatch(updatedModifiedTimestampsBySpotsIds([targetIntervalModified.properties.id]));
    dispatch(editedOrCreatedSpot(targetIntervalModified));
    targetIntervalExtent = turf.bbox(targetIntervalModified);
    moveSpotsUpOrDownByPixels(targetIntervalModified.properties.strat_section_id, targetIntervalExtent[1],
      targetIntervalHeight, targetIntervalModified.properties.id);
  };

  // Move Spot up or down by a given number of pixels (a positive number for pixels to move up or negative for down)
  const moveSpotByPixels = (spot, pixels) => {
    const spotCopyGeom = JSON.parse(JSON.stringify(spot.geometry));
    if (spot.geometry.type === 'Point') spotCopyGeom.coordinates[1] = spot.geometry.coordinates[1] + pixels;
    else if (spot.geometry.type === 'LineString' || spot.geometry.type === 'MultiPoint') {
      spot.geometry.coordinates.forEach((pointCoords, i) => {
        spotCopyGeom.coordinates[i][1] = pointCoords[1] + pixels;
      });
    }
    else if (spot.geometry.type === 'Polygon' || spot.geometry.type === 'MultiLineString') {
      spot.geometry.coordinates.forEach((lineCoords, l) => {
        lineCoords.forEach((pointCoords, i) => {
          spotCopyGeom.coordinates[l][i][1] = pointCoords[1] + pixels;
        });
      });
    }
    else if (spot.geometry.type === 'MultiPolygon') {
      spot.geometry.coordinates.forEach((polygonCoords, p) => {
        polygonCoords.forEach((lineCoords, l) => {
          lineCoords.forEach((pointCoords, i) => {
            spotCopyGeom.coordinates[p][l][i][1] = pointCoords[1] + pixels;
          });
        });
      });
    }
    // Interbedded (Geometry Collections)
    else if (spot.geometry.type === 'GeometryCollection') {
      spot.geometry.geometries.forEach((geometry, g) => {
        geometry.coordinates.forEach((lineCoords, l) => {
          lineCoords.forEach((pointCoords, i) => {
            spotCopyGeom.geometries[g].coordinates[l][i][1] = pointCoords[1] + pixels;
          });
        });
      });
    }
    return {...spot, geometry: spotCopyGeom};
  };

  // Move all Spots (except excluded Spot, if given) in a specified Strat Section
  // up after cutoff (if pixels is positive) or down after cutoff (if pixels is negative)
  const moveSpotsUpOrDownByPixels = (stratSectionId, cutoff, pixels, excludedSpotId) => {
    const spots = getSpotsMappedOnGivenStratSection(stratSectionId);
    let spotsFiltered = spots.filter(spot => excludedSpotId && spot.properties.id !== excludedSpotId);
    let movedSpots = [];
    spotsFiltered.map((spot) => {
      const extent = turf.bbox(spot); //bbox extent in minX, minY, maxX, maxY order
      if (extent[1] >= cutoff) movedSpots.push(moveSpotByPixels(spot, pixels));
    });
    console.log('Dispatching', movedSpots);
    dispatch(editedOrCreatedSpots(movedSpots));
  };

  const recalculateIntervalGeometry = (spot) => {
    console.log('Recalculating Spot Geometry...', spot);
    const extent = turf.bbox(spot);
    const updatedGeometry = calculateIntervalGeometry(spot.properties.strat_section_id, spot.properties.sed, extent[1]);
    const editedSpot = {...spot, geometry: updatedGeometry};
    console.log('Spot after geometry recalculation', editedSpot);
    dispatch(updatedModifiedTimestampsBySpotsIds([editedSpot.properties.id]));
    dispatch(editedOrCreatedSpot(editedSpot));
    console.log('Dispatching', editedSpot);
    return editedSpot;
  };

  return {
    calculateIntervalGeometry,
    moveIntervalToAfter,
    moveSpotsUpOrDownByPixels,
    recalculateIntervalGeometry,
  };
};

export default useStratSectionCalculations;
