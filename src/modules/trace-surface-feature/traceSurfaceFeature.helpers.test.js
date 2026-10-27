import {getTraceSurfaceFeatureLabel, getTraceSurfaceFeatureText} from './traceSurfaceFeature.helpers';

// Stands in for the form labels, which are mostly the choice name with spaces
const getLabel = key => key.replace(/_/g, ' ');

const lineSpot = trace => ({geometry: {type: 'LineString'}, properties: {trace}});
const polygonSpot = surfaceFeature => ({geometry: {type: 'Polygon'}, properties: {surface_feature: surfaceFeature}});

describe('getTraceSurfaceFeatureLabel', () => {
  it('calls a line\'s feature a trace and a polygon\'s a surface feature', () => {
    expect(getTraceSurfaceFeatureLabel(lineSpot())).toBe('Trace Feature');
    expect(getTraceSurfaceFeatureLabel(polygonSpot())).toBe('Surface Feature');
  });
});

describe('getTraceSurfaceFeatureText', () => {
  it('names a trace by its type', () => {
    expect(getTraceSurfaceFeatureText(lineSpot({trace_type: 'scale_bar'}), getLabel)).toBe('Scale Bar');
  });

  it('adds a trace\'s subtype in capitals', () => {
    const spot = lineSpot({trace_type: 'contact', contact_type: 'depositional'});
    expect(getTraceSurfaceFeatureText(spot, getLabel)).toBe('Contact - DEPOSITIONAL');
  });

  it('uses the user\'s own text for a subtype of Other', () => {
    const spot = lineSpot({trace_type: 'contact', contact_type: 'other', other_contact_type: 'chilled margin'});
    expect(getTraceSurfaceFeatureText(spot, getLabel)).toBe('Contact - CHILLED MARGIN');
  });

  it('falls back to Other when no text was typed for it', () => {
    const spot = lineSpot({trace_type: 'contact', contact_type: 'other'});
    expect(getTraceSurfaceFeatureText(spot, getLabel)).toBe('Contact - OTHER');
  });

  it('names a surface feature by its type', () => {
    expect(getTraceSurfaceFeatureText(polygonSpot({surface_feature_type: 'rock_unit'}), getLabel)).toBe('Rock Unit');
  });

  it('uses the user\'s own text for a surface feature type of Other', () => {
    const spot = polygonSpot({surface_feature_type: 'other', other_surface_feature_type: 'Landslide scar'});
    expect(getTraceSurfaceFeatureText(spot, getLabel)).toBe('Landslide scar');
  });

  it('counts a GeometryCollection as a polygon', () => {
    const spot = {geometry: {type: 'GeometryCollection'}, properties: {surface_feature: {surface_feature_type: 'gradients'}}};
    expect(getTraceSurfaceFeatureText(spot, getLabel)).toBe('Gradients');
  });

  // The type is what makes a Spot a trace or surface feature, so without one there is nothing to name
  it('gives nothing without a type', () => {
    expect(getTraceSurfaceFeatureText(lineSpot(undefined), getLabel)).toBeUndefined();
    expect(getTraceSurfaceFeatureText(lineSpot({trace_feature: true}), getLabel)).toBeUndefined();
    expect(getTraceSurfaceFeatureText(polygonSpot({surface_feature_notes: 'notes'}), getLabel)).toBeUndefined();
  });

  it('gives nothing for a point', () => {
    const spot = {geometry: {type: 'Point'}, properties: {surface_feature: {surface_feature_type: 'rock_unit'}}};
    expect(getTraceSurfaceFeatureText(spot, getLabel)).toBeUndefined();
  });
});
