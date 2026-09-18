import {getDefaultLabel, getFeatureTitle, resolveLabelOnSave} from './featureLabels.helpers';
import {PAGE_KEYS} from './pageKeys.constants';
import alert from '../../shared/ui/alert';

jest.mock('../../shared/ui/alert');

// The real dictionary lookups are the forms' business, not this router's: stub them so a case can be read as
// 'this page asks for these fields', and so a survey gaining a choice cannot break these tests
const getLabel = key => (key === undefined || key === null ? '' : 'L(' + key + ')');
const getLabels = keys => (Array.isArray(keys) ? keys : [keys]).map(getLabel).join(', ');

// Answers the label prompt the way a user would, and reports whether it was actually asked
const answerPrompt = (choice) => {
  alert.mockImplementation((title, description, options) => {
    const option = options.find(o => (choice === 'Update' ? o.style !== 'cancel' : o.style === 'cancel'));
    option.onPress();
  });
  return () => alert.mock.calls.length > 0;
};

beforeEach(() => jest.clearAllMocks());

describe('getDefaultLabel', () => {
  // The orientation numbers are deliberately left out: they are added at render time so they keep following
  // the user's measurement convention instead of being frozen by whichever one was set at save time
  it('names a measurement by its feature type, without the orientation numbers', () => {
    const measurement = {type: 'planar_orientation', feature_type: 'bedding', strike: 45, dip: 30};
    const label = getDefaultLabel(PAGE_KEYS.MEASUREMENTS, measurement, getLabel, getLabels);
    expect(label).toBe('L(bedding)');
    expect(label).not.toContain('45');
    expect(label).not.toContain('30');
  });

  it('adds a measurement\'s second-order class to its feature type', () => {
    const measurement = {type: 'planar_orientation', feature_type: 'bedding', bedding_type: 'graded'};
    expect(getDefaultLabel(PAGE_KEYS.MEASUREMENTS, measurement, getLabel, getLabels))
      .toBe('L(bedding) - L(GRADED)');
  });

  it('falls back to a measurement\'s type when it has no feature type', () => {
    expect(getDefaultLabel(PAGE_KEYS.MEASUREMENTS, {type: 'planar_orientation'}, getLabel, getLabels))
      .toBe('L(planar_orientation)');
  });

  it('names a 3D structure by its type and feature type', () => {
    const label = getDefaultLabel(PAGE_KEYS.THREE_D_STRUCTURES, {type: 'fault', feature_type: 'thrust'},
      getLabel, getLabels);
    expect(label).toBe('Fault - L(THRUST)');
  });

  it('names a mineral by its name and abbreviation', () => {
    const mineral = {full_mineral_name: 'Quartz', mineral_abbrev: 'Qz'};
    expect(getDefaultLabel(PAGE_KEYS.MINERALS, mineral, getLabel, getLabels)).toBe('Quartz (Qz)');
  });

  // A tephra label is a short identifier the layer type is shown after, filled in by TephraPage as 'SpotName-N',
  // so labeling one as a title would drop the layer type from every row in the list
  it('leaves a tephra layer to the label convention the Tephra page already has', () => {
    expect(getDefaultLabel(PAGE_KEYS.TEPHRA, {layer_type: 'ash'}, getLabel, getLabels)).toBeUndefined();
  });

  it('gives the pages titled by position alone nothing to fill a label in with', () => {
    [PAGE_KEYS.STRUCTURES, PAGE_KEYS.DIAGENESIS, PAGE_KEYS.FOSSILS, PAGE_KEYS.INTERPRETATIONS].forEach(
      pageKey => expect(getDefaultLabel(pageKey, {id: 1}, getLabel, getLabels)).toBeUndefined());
  });

  it('names a sample by the name the user gave it', () => {
    expect(getDefaultLabel(PAGE_KEYS.SAMPLES, {sample_id_name: 'JG-1'}, getLabel, getLabels)).toBe('JG-1');
  });

  it('gives a page it does not know nothing', () => {
    expect(getDefaultLabel(PAGE_KEYS.NOTES, {text: 'a note'}, getLabel, getLabels)).toBeUndefined();
  });

  it('reads an empty feature as having no label rather than throwing', () => {
    expect(getDefaultLabel(PAGE_KEYS.MEASUREMENTS, {}, getLabel, getLabels)).toBeUndefined();
    expect(getDefaultLabel(PAGE_KEYS.MEASUREMENTS, undefined, getLabel, getLabels)).toBeUndefined();
  });
});

describe('resolveLabelOnSave', () => {
  const resolve = (previousFeature, values) => resolveLabelOnSave(
    {pageKey: PAGE_KEYS.THREE_D_STRUCTURES, previousFeature: previousFeature, values: values,
      getLabel: getLabel, getLabels: getLabels});

  it('labels a feature being created', async () => {
    const wasAsked = answerPrompt('Keep');
    const values = {id: 1, type: 'fault', feature_type: 'thrust'};
    expect(await resolve(undefined, values)).toEqual({...values, label: 'Fault - L(THRUST)'});
    expect(wasAsked()).toBe(false);
  });

  it('keeps a label the user typed as it is being created', async () => {
    const values = {id: 1, type: 'fault', feature_type: 'thrust', label: 'Big fault'};
    expect(await resolve(undefined, values)).toEqual(values);
  });

  it('fills in a label for a feature saved before there were labels', async () => {
    const wasAsked = answerPrompt('Keep');
    const previousFeature = {id: 1, type: 'fault', feature_type: 'thrust'};
    expect(await resolve(previousFeature, {...previousFeature})).toEqual(
      {...previousFeature, label: 'Fault - L(THRUST)'});
    expect(wasAsked()).toBe(false);
  });

  // The field's hint promises a default when none is given, so clearing it asks for that default back
  it('gives the default back when the user clears the field', async () => {
    const previousFeature = {id: 1, type: 'fault', feature_type: 'thrust', label: 'Big fault'};
    expect(await resolve(previousFeature, {...previousFeature, label: ''})).toEqual(
      {...previousFeature, label: 'Fault - L(THRUST)'});
  });

  it('asks before moving a label that was filled in, and keeps it when told to', async () => {
    const previousFeature = {id: 1, type: 'fault', feature_type: 'thrust', label: 'Fault - L(THRUST)'};
    const values = {...previousFeature, feature_type: 'normal'};
    const wasAsked = answerPrompt('Keep');
    expect(await resolve(previousFeature, values)).toEqual(values);
    expect(wasAsked()).toBe(true);
  });

  it('moves a label that was filled in when told to update it', async () => {
    const previousFeature = {id: 1, type: 'fault', feature_type: 'thrust', label: 'Fault - L(THRUST)'};
    const values = {...previousFeature, feature_type: 'normal'};
    answerPrompt('Update');
    expect(await resolve(previousFeature, values)).toEqual({...values, label: 'Fault - L(NORMAL)'});
  });

  // Whether a label was filled in is recomputed from the feature as the form opened it, not remembered, so a
  // label that does not match what the feature read as back then was typed by hand
  it('never asks about a label the user typed, and leaves it alone', async () => {
    const previousFeature = {id: 1, type: 'fault', feature_type: 'thrust', label: 'Big fault by the creek'};
    const values = {...previousFeature, feature_type: 'normal'};
    const wasAsked = answerPrompt('Update');
    expect(await resolve(previousFeature, values)).toEqual(values);
    expect(wasAsked()).toBe(false);
  });

  it('does not ask when an edit leaves the label where it already was', async () => {
    const previousFeature = {id: 1, type: 'fault', feature_type: 'thrust', label: 'Fault - L(THRUST)'};
    const values = {...previousFeature, notes: 'added a note'};
    const wasAsked = answerPrompt('Update');
    expect(await resolve(previousFeature, values)).toEqual(values);
    expect(wasAsked()).toBe(false);
  });

  it('hands back the values untouched on a page with no label to give', async () => {
    const values = {id: 1, text: 'a note'};
    const resolved = await resolveLabelOnSave({pageKey: PAGE_KEYS.NOTES, previousFeature: {id: 1}, values: values,
      getLabel: getLabel, getLabels: getLabels});
    expect(resolved).toBe(values);
  });
});

// Lists sort by this as well as render it, so a label has to win in both or a labeled row sorts by text it
// is not showing
describe('getFeatureTitle', () => {
  it('prefers a label over the default', () => {
    const mineral = {full_mineral_name: 'Quartz', mineral_abbrev: 'Qz', label: 'The big vein'};
    expect(getFeatureTitle(PAGE_KEYS.MINERALS, mineral, getLabel, getLabels)).toBe('The big vein');
  });

  it('falls back to the default when there is no label', () => {
    const mineral = {full_mineral_name: 'Quartz', mineral_abbrev: 'Qz'};
    expect(getFeatureTitle(PAGE_KEYS.MINERALS, mineral, getLabel, getLabels)).toBe('Quartz (Qz)');
  });

  it('gives nothing for a page with neither', () => {
    expect(getFeatureTitle(PAGE_KEYS.FOSSILS, {id: 1}, getLabel, getLabels)).toBeUndefined();
  });
});
