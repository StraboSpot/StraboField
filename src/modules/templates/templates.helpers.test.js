import {MEASUREMENT_TEMPLATE_KEY, TEMPLATE_NAME_FIELD} from './templates.constants';
import {
  getActiveTemplateList,
  getIsTemplateInUse,
  getTemplateFormValues,
  getTemplateTypeLabel,
  getTemplateList,
  getTemplateSurvey,
  getTemplateValues,
  getTemplatesOfType,
  mergeTemplates,
  validateTemplateName,
} from './templates.helpers';

// Planar and linear measurement templates share one list, so each orientation's picker filters out its own
describe('getTemplatesOfType', () => {
  const planar = {id: 'p', values: {type: 'planar_orientation'}};
  const tabular = {id: 't', values: {type: 'tabular_orientation'}};
  const linear = {id: 'l', values: {type: 'linear_orientation'}};

  it('takes tabular templates in with planar ones, for a planar or a tabular picker', () => {
    expect(getTemplatesOfType([planar, tabular, linear], 'planar_orientation')).toEqual([planar, tabular]);
    expect(getTemplatesOfType([planar, tabular, linear], 'tabular_orientation')).toEqual([planar, tabular]);
  });

  it('takes only linear templates for a linear picker', () => {
    expect(getTemplatesOfType([planar, tabular, linear], 'linear_orientation')).toEqual([linear]);
  });

  it('keeps every template for a type that is not an orientation', () => {
    const quartz = {id: 'q', values: {mineral: 'quartz'}};
    expect(getTemplatesOfType([quartz], 'minerals')).toEqual([quartz]);
  });
});

// The picker's buttons and the modal header name the same kind of template, so they read the same
describe('getTemplateTypeLabel', () => {
  it('names a measurement template by its orientation, tabular as planar', () => {
    expect(getTemplateTypeLabel('tabular_orientation', {})).toBe('Planar');
    expect(getTemplateTypeLabel('linear_orientation', {})).toBe('Linear');
  });

  it('names an igneous rock template by its class', () => {
    expect(getTemplateTypeLabel('plutonic', {}, true)).toBe('Plutonic Rock');
  });

  it('names any other template by its page', () => {
    expect(getTemplateTypeLabel('minerals', {label_singular: 'Mineral'})).toBe('Mineral');
  });
});

// A template's values are copied into every feature made from it, so what would be wrong shared by them all, or
// what the compass supplies, never goes in one
describe('what a template holds', () => {
  it('saves a feature template without its label, name or id', () => {
    expect(getTemplateValues('minerals', {id: 1, label: 'Qz 1', mineral: 'quartz', [TEMPLATE_NAME_FIELD]: 'Quartz'}))
      .toEqual({mineral: 'quartz'});
  });

  it('saves a measurement template without its reading', () => {
    const formValues = {dip: 30, feature_type: 'bedding', label: 'B', strike: 100, type: 'planar_orientation'};
    expect(getTemplateValues(MEASUREMENT_TEMPLATE_KEY, formValues))
      .toEqual({feature_type: 'bedding', type: 'planar_orientation'});
  });

  it('keeps a reading in a feature template, where it isn\'t one', () => {
    expect(getTemplateValues('_3d_structures', {strike: 100})).toEqual({strike: 100});
  });

  it('leaves the label out of a template\'s form', () => {
    expect(getTemplateSurvey([{name: 'label'}, {name: 'mineral'}])).toEqual([{name: 'mineral'}]);
  });
});

// A template's name is edited in the same form as its values, so it goes in beside them and is checked with them
describe('template name in the form', () => {
  it('puts the name beside the values', () => {
    expect(getTemplateFormValues({id: 'a', name: 'Quartz', values: {mineral: 'quartz'}}))
      .toEqual({mineral: 'quartz', [TEMPLATE_NAME_FIELD]: 'Quartz'});
  });

  it('requires a name that is more than spaces', () => {
    expect(validateTemplateName({[TEMPLATE_NAME_FIELD]: '  '})).toEqual({[TEMPLATE_NAME_FIELD]: 'Required'});
    expect(validateTemplateName({})).toEqual({[TEMPLATE_NAME_FIELD]: 'Required'});
    expect(validateTemplateName({[TEMPLATE_NAME_FIELD]: 'Quartz'})).toEqual({});
  });
});

// A template backup carries only the template lists, never which of them are active, so merging one has to
// leave the project's own active lists intact - and refresh them, since an active template is a full copy.
describe('mergeTemplates', () => {
  const quartz = {id: 'a', name: 'Quartz', values: {mineral: 'quartz', shape: 'euhedral'}};
  const quartzWithColor = {id: 'a', name: 'Quartz', values: {color: 'white', mineral: 'quartz', shape: 'anhedral'}};
  const calcite = {id: 'b', name: 'Calcite', values: {mineral: 'calcite'}};
  const bedding = {id: 'c', name: 'Bedding', values: {strike: 100, type: 'planar_orientation'}};
  const beddingWithDip = {id: 'c', name: 'Bedding', values: {dip: 30, strike: 999, type: 'planar_orientation'}};

  it('adds a template the project does not have yet', () => {
    const {mergedTemplates, newCount, mergedCount} = mergeTemplates({}, {minerals: {templates: [quartz]}});
    expect(getTemplateList(mergedTemplates, 'minerals')).toEqual([quartz]);
    expect([newCount, mergedCount]).toEqual([1, 0]);
  });

  // The import fills gaps only, so a value the user already has always wins over the one in the file
  it('merges by id, keeping the values already there and taking only the missing ones', () => {
    const existing = {minerals: {templates: [quartz]}};
    const {mergedTemplates, newCount, mergedCount} = mergeTemplates(existing,
      {minerals: {templates: [quartzWithColor]}});
    expect(getTemplateList(mergedTemplates, 'minerals')[0].values)
      .toEqual({color: 'white', mineral: 'quartz', shape: 'euhedral'});
    expect([newCount, mergedCount]).toEqual([0, 1]);
  });

  it('refreshes the copy of a merged template held in the active list', () => {
    const existing = {minerals: {templates: [quartz], active: [quartz], isInUse: true}};
    const {mergedTemplates} = mergeTemplates(existing, {minerals: {templates: [quartzWithColor]}});
    expect(getActiveTemplateList(mergedTemplates, 'minerals')[0].values.color).toBe('white');
    // The rest of the bucket rides along untouched
    expect(getIsTemplateInUse(mergedTemplates, 'minerals')).toBe(true);
  });

  it('leaves an active template the import did not touch as it was', () => {
    const existing = {minerals: {templates: [quartz, calcite], active: [calcite]}};
    const {mergedTemplates} = mergeTemplates(existing, {minerals: {templates: [quartzWithColor]}});
    expect(getActiveTemplateList(mergedTemplates, 'minerals')).toEqual([calcite]);
  });

  it('takes a project with nothing active', () => {
    const {mergedTemplates} = mergeTemplates({minerals: {templates: [quartz]}}, {minerals: {templates: [calcite]}});
    expect(getActiveTemplateList(mergedTemplates, 'minerals')).toBeUndefined();
  });

  // Measurement templates are stored as a flat array rather than a bucket, both in the project and in a backup
  it('merges measurement templates and refreshes their active list too', () => {
    const existing = {measurementTemplates: [bedding], activeMeasurementTemplates: [bedding]};
    const {mergedTemplates, mergedCount} = mergeTemplates(existing, {measurementTemplates: [beddingWithDip]});
    expect(getTemplateList(mergedTemplates, MEASUREMENT_TEMPLATE_KEY)[0].values.dip).toBe(30);
    expect(getActiveTemplateList(mergedTemplates, MEASUREMENT_TEMPLATE_KEY)[0].values.dip).toBe(30);
    expect(mergedCount).toBe(1);
  });

  it('skips a key whose value is not a list of templates, so a wrong file merges to nothing', () => {
    const {mergedTemplates, newCount, mergedCount} = mergeTemplates({}, {version: 3, minerals: 'not a bucket'});
    expect(mergedTemplates).toEqual({});
    expect([newCount, mergedCount]).toEqual([0, 0]);
  });

  // The result goes to the store while `existing` is still the live state, so a write through the shallow
  // copy must not reach back into it
  it('leaves the project it merged into untouched', () => {
    const existing = {minerals: {templates: [quartz], active: [quartz]}, measurementTemplates: [bedding]};
    const before = JSON.parse(JSON.stringify(existing));
    mergeTemplates(existing, {minerals: {templates: [quartzWithColor]}, measurementTemplates: [beddingWithDip]});
    expect(existing).toEqual(before);
  });
});
