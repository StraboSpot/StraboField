import {TRACE_SUB_TYPE_FIELDS} from './traceSurfaceFeature.constants';
import {toTitleCase} from '../../shared/helpers';
import {isLineSpot, isPolygonSpot} from '../spots/spots.helpers';

// What the feature is called for this Spot: a trace on a line, a surface feature on a polygon
export const getTraceSurfaceFeatureLabel = spot => (isLineSpot(spot) ? 'Trace Feature' : 'Surface Feature');

// What a line or polygon Spot was mapped as: the type, followed by a trace's subtype, with the user's own text
// standing in for Other. Nothing without a type, since the type is what makes the Spot a trace or surface feature.
// getLabel is passed in because a plain helper cannot call useForm.
export const getTraceSurfaceFeatureText = (spot, getLabel) => {
  if (isLineSpot(spot)) {
    const trace = spot.properties.trace || {};
    if (!trace.trace_type) return undefined;
    const typeText = toTitleCase(getLabel(trace.trace_type, ['general', 'trace']));
    const subTypeField = Object.keys(TRACE_SUB_TYPE_FIELDS).find(field => trace[field]);
    if (!subTypeField) return typeText;
    const otherText = trace[subTypeField] === 'other' && trace[TRACE_SUB_TYPE_FIELDS[subTypeField]];
    return typeText + ' - ' + (otherText || getLabel(trace[subTypeField], ['general', 'trace'])).toUpperCase();
  }
  if (isPolygonSpot(spot)) {
    const {other_surface_feature_type: otherType, surface_feature_type: type} = spot.properties.surface_feature || {};
    if (!type) return undefined;
    return type === 'other' && otherType ? otherType : toTitleCase(getLabel(type, ['general', 'surface_feature']));
  }
  return undefined;
};
