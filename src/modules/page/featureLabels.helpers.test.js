import {getDefaultLabel, getFeatureTitle, resolveLabelOnSave} from './featureLabels.helpers';
import {PAGE_KEYS} from './pageKeys.constants';

// The real dictionary lookups are the forms' business, not this router's: stub them so a case can be read as
// 'this page asks for these fields', and so a survey gaining a choice cannot break these tests
const getLabel = key => (key === undefined || key === null ? '' : 'L(' + key + ')');
const getLabels = keys => (Array.isArray(keys) ? keys : [keys]).map(getLabel).join(', ');

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

  it('gives the page titled by position alone nothing to fill a label in with', () => {
    expect(getDefaultLabel(PAGE_KEYS.INTERPRETATIONS, {id: 1}, getLabel, getLabels)).toBeUndefined();
  });

  // Tab order, whatever order the tabs were filled in
  it('names a structure by the tabs it has data on', () => {
    expect(getDefaultLabel(PAGE_KEYS.STRUCTURES, {paleosol_horizons: ['a']}, getLabel, getLabels)).toBe('Pedogenic');
    const structure = {lag_type: 'x', bedding_plane_features: ['x']};
    expect(getDefaultLabel(PAGE_KEYS.STRUCTURES, structure, getLabel, getLabels)).toBe('Bedding Plane, Physical');
  });

  // Every tab shows the same Notes field, so it cannot say which tab was filled in
  it('does not count a note as data on any tab', () => {
    expect(getDefaultLabel(PAGE_KEYS.STRUCTURES, {notes: 'a note'}, getLabel, getLabels)).toBeUndefined();
  });

  // Any field under a heading counts, not only its first, and the headings keep form order whatever order the
  // fields were filled in
  it('names a diagenesis by the headings of its sections with data', () => {
    const diagenesis = {other_diagenetic_features: ['stylolites'], cement_composition: ['calcite'], vein_width: 2};
    expect(getDefaultLabel(PAGE_KEYS.DIAGENESIS, diagenesis, getLabel, getLabels))
      .toBe('Cement, Veins, Other Diagenetic Features');
    expect(getDefaultLabel(PAGE_KEYS.DIAGENESIS, {notes: 'a note'}, getLabel, getLabels)).toBeUndefined();
  });

  it('names a fully filled in diagenesis by every heading', () => {
    const diagenesis = {cement_composition: ['calcite'], vein_type: 'x', fracture_type: 'x',
      nodules_concretions_size: 'x', replacement_type: 'x', recrystallization_type: 'x',
      other_diagenetic_features: ['x'], fabric_selective: ['x'], carbonate_desicc_and_diss: ['x']};
    expect(getDefaultLabel(PAGE_KEYS.DIAGENESIS, diagenesis, getLabel, getLabels)).toBe('Cement, Veins, Fractures, '
      + 'Nodules/Concretions, Replacement, Recrystallization, Other Diagenetic Features, Porosity Type, '
      + 'Carbonate Desiccation and Dissolution');
  });

  // Only the first field of each part: a second Body field and Descriptive are filled in too, and left out
  it('names a fossil by its first Body field, then its first Trace field', () => {
    const fossil = {invertebrate: ['mollusca'], mollusca: ['bivalve'], diversity: 'low', descriptive: ['burrowed']};
    expect(getDefaultLabel(PAGE_KEYS.FOSSILS, fossil, getLabel, getLabels)).toBe('L(mollusca) (L(low) Diversity)');
  });

  it('names a fossil by Descriptive when it has no Diversity, reading \'other\' as what was typed', () => {
    const fossil = {vertebrate: ['other'], other_vertebrate: 'fish scale', descriptive: ['track', 'trail']};
    expect(getDefaultLabel(PAGE_KEYS.FOSSILS, fossil, getLabel, getLabels)).toBe('Fish Scale (L(track), L(trail))');
  });

  it('names a fossil by whichever part it has', () => {
    expect(getDefaultLabel(PAGE_KEYS.FOSSILS, {chordate: 'fish'}, getLabel, getLabels)).toBe('L(fish)');
    expect(getDefaultLabel(PAGE_KEYS.FOSSILS, {diversity: 'high'}, getLabel, getLabels)).toBe('L(high) Diversity');
    expect(getDefaultLabel(PAGE_KEYS.FOSSILS, {notes: 'a note'}, getLabel, getLabels)).toBeUndefined();
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

  it('labels a feature being created', () => {
    const values = {id: 1, type: 'fault', feature_type: 'thrust'};
    expect(resolve(undefined, values)).toEqual({...values, label: 'Fault - L(THRUST)'});
  });

  it('keeps a label the user typed as it is being created', () => {
    const values = {id: 1, type: 'fault', feature_type: 'thrust', label: 'Big fault'};
    expect(resolve(undefined, values)).toEqual(values);
  });

  it('fills in a label for a feature saved before there were labels', () => {
    const previousFeature = {id: 1, type: 'fault', feature_type: 'thrust'};
    expect(resolve(previousFeature, {...previousFeature})).toEqual({...previousFeature, label: 'Fault - L(THRUST)'});
  });

  // The field's hint promises a default when none is given, so clearing it asks for that default back
  it('gives the default back when the user clears the field', () => {
    const previousFeature = {id: 1, type: 'fault', feature_type: 'thrust', label: 'Big fault'};
    expect(resolve(previousFeature, {...previousFeature, label: ''})).toEqual(
      {...previousFeature, label: 'Fault - L(THRUST)'});
  });

  it('moves a label that was filled in along with the data', () => {
    const previousFeature = {id: 1, type: 'fault', feature_type: 'thrust', label: 'Fault - L(THRUST)'};
    const values = {...previousFeature, feature_type: 'normal'};
    expect(resolve(previousFeature, values)).toEqual({...values, label: 'Fault - L(NORMAL)'});
  });

  // Whether a label was filled in is recomputed from the feature as the form opened it, not remembered, so a
  // label that does not match what the feature read as back then was typed by hand
  it('leaves a label the user typed alone when the data changes', () => {
    const previousFeature = {id: 1, type: 'fault', feature_type: 'thrust', label: 'Big fault by the creek'};
    const values = {...previousFeature, feature_type: 'normal'};
    expect(resolve(previousFeature, values)).toEqual(values);
  });

  it('keeps a label typed into this save, even over a data change', () => {
    const previousFeature = {id: 1, type: 'fault', feature_type: 'thrust', label: 'Fault - L(THRUST)'};
    const values = {...previousFeature, feature_type: 'normal', label: 'Big fault'};
    expect(resolve(previousFeature, values)).toEqual(values);
  });

  describe('on a page whose default can run out', () => {
    const resolveFossil = (previousFeature, values) => resolveLabelOnSave(
      {pageKey: PAGE_KEYS.FOSSILS, previousFeature: previousFeature, values: values, getLabel: getLabel,
        getLabels: getLabels});
    const previousFossil = {id: 1, chordate: 'fish', label: 'L(fish)'};

    // So the list falls back to titling the fossil by its position
    it('clears a label that was filled in once its data is gone', () => {
      expect(resolveFossil(previousFossil, {id: 1, label: 'L(fish)'}).label).toBeUndefined();
    });

    it('leaves a label the user typed', () => {
      const values = {id: 1, label: 'Fish bed'};
      expect(resolveFossil({...previousFossil, label: 'Fish bed'}, values)).toEqual(values);
    });

    it('leaves a fossil with nothing to label it by unlabeled', () => {
      const values = {id: 1, notes: 'a note'};
      expect(resolveFossil({id: 1}, values)).toBe(values);
    });
  });

  it('hands back the values untouched on a page with no label to give', () => {
    const values = {id: 1, text: 'a note'};
    const resolved = resolveLabelOnSave({pageKey: PAGE_KEYS.NOTES, previousFeature: {id: 1}, values: values,
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
    expect(getFeatureTitle(PAGE_KEYS.INTERPRETATIONS, {id: 1}, getLabel, getLabels)).toBeUndefined();
  });
});
