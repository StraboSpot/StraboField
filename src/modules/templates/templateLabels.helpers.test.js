import {
  getNewTemplateSections,
  getPickerTypeLabel,
  getSavedTemplateSections,
  getTemplateTypeLabel,
} from './templateLabels.helpers';

// Every name comes from the constants that name what the template is of, so the picker, the modal header and the
// main menu all read the same
describe('getTemplateTypeLabel', () => {
  it('names a measurement template by its orientation', () => {
    expect(getTemplateTypeLabel('planar_orientation')).toBe('Planar');
    expect(getTemplateTypeLabel('linear_orientation')).toBe('Linear');
    expect(getTemplateTypeLabel('tabular_orientation')).toBe('Tabular Zone');
  });

  it('names an igneous rock template by its class', () => {
    expect(getTemplateTypeLabel('plutonic')).toBe('Plutonic Rock');
  });

  it('names any other template by its notebook page, in the singular', () => {
    expect(getTemplateTypeLabel('minerals')).toBe('Mineral');
    expect(getTemplateTypeLabel('alteration_or')).toBe('Alteration, Ore Rock');
    expect(getTemplateTypeLabel('notes')).toBe('Note');
    expect(getTemplateTypeLabel('_3d_structures')).toBe('3D Structure');
  });

  // A planar picker lists tabular templates too
  it('names a picker for tabular templates as a planar one', () => {
    expect(getPickerTypeLabel('tabular_orientation')).toBe('Planar');
    expect(getPickerTypeLabel('minerals')).toBe('Mineral');
  });
});

// The main menu lists templates in sections named as their lists are, each a key or, for measurements, a kind
describe('template sections', () => {
  it('gives each kind of measurement a section, tabular with planar, sorted by label and the templates by name', () => {
    const templates = {
      measurementTemplates: [
        {id: 'b', name: 'Bedding', values: {type: 'planar_orientation'}},
        {id: 'l', name: 'Lineation', values: {type: 'linear_orientation'}},
        {id: 'v', name: 'Vein', values: {type: 'tabular_orientation'}},
        {id: 'a', name: 'Axial Plane', values: {type: 'planar_orientation'}},
      ],
      activeMeasurementTemplates: [],
      minerals: {templates: [{id: 'q', name: 'Quartz', values: {}}]},
      notes: {templates: [{id: 'n', name: 'Weather', values: {}}]},
    };
    expect(getSavedTemplateSections(templates).map(s => [s.templateKey, s.label, s.data.map(t => t.name)])).toEqual([
      ['measurementTemplates', 'Linear Measurements', ['Lineation']],
      ['minerals', 'Minerals', ['Quartz']],
      ['notes', 'Notes', ['Weather']],
      ['measurementTemplates', 'Planar Measurements', ['Axial Plane', 'Bedding', 'Vein']],
    ]);
  });

  it('lists the kinds of template that can be made under their page section names, without reaction textures', () => {
    const sections = getNewTemplateSections();
    expect(sections.map(s => [s.groupKey, s.label])).toEqual([
      ['measurement', 'Measurements'],
      ['notes', 'Notes'],
      ['pet', 'Rocks & Minerals'],
    ]);
    const petItems = sections.find(s => s.groupKey === 'pet').data;
    expect(petItems).toContainEqual({id: 'minerals', name: 'Mineral'});
    expect(petItems.map(item => item.id)).not.toContain('reactions');
  });
});
