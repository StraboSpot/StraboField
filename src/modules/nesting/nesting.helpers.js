import * as turf from '@turf/turf';

import {VALID_TYPES_FOR_BOOLEAN_WITHIN} from './nesting.constants';

// Is spot 1 completely within spot 2?
// Boolean-within returns true if the first geometry is completely within the second geometry.
export const isWithin = (spot1, spot2) => {
  let boolWithin = false;
  try {
    // Make sure we're using booleanWithin with valid types
    if (Object.keys(VALID_TYPES_FOR_BOOLEAN_WITHIN).includes(spot1.geometry.type)
      && VALID_TYPES_FOR_BOOLEAN_WITHIN[spot1.geometry.type]?.includes(spot2.geometry.type)) {
      boolWithin = turf.booleanWithin(spot1, spot2);
    }
    // Handle Geometry Collections
    else if (spot1.geometry.type === 'GeometryCollection') {
      spot1.geometry.geometries.forEach((geometry1) => {
        if (!boolWithin && Object.keys(VALID_TYPES_FOR_BOOLEAN_WITHIN).includes(geometry1.type)
          && VALID_TYPES_FOR_BOOLEAN_WITHIN[geometry1]?.includes(spot2.geometry.type)) {
          boolWithin = turf.booleanWithin(geometry1, spot2.geometry.type);
        }
        else if (!boolWithin && spot2.geometry.type === 'GeometryCollection') {
          spot2.geometry.geometries.forEach((geometry2) => {
            if (!boolWithin && Object.keys(VALID_TYPES_FOR_BOOLEAN_WITHIN).includes(geometry1.type)
              && VALID_TYPES_FOR_BOOLEAN_WITHIN[geometry1]?.includes(geometry2)) {
              boolWithin = turf.booleanWithin(geometry1, geometry2);
            }
          });
        }
      });
    }
    else if (spot2.geometry.type === 'GeometryCollection') {
      spot2.geometry.geometries.forEach((geometry2) => {
        if (!boolWithin && Object.keys(VALID_TYPES_FOR_BOOLEAN_WITHIN).includes(spot1.geometry.type)
          && VALID_TYPES_FOR_BOOLEAN_WITHIN[spot1.geometry.type]?.includes(geometry2.type)) {
          boolWithin = turf.booleanWithin(spot1.geometry, geometry2);
        }
      });
    }
  }
  catch (e) {
    console.error('Error with Spot geometry! Spot 1:', spot1, 'Spot 2:', spot2, 'Error:', e);
  }
  return boolWithin;
};
