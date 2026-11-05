import sedInterpretationsArchitecture from '../../assets/forms/sed/interpretations-architecture.json';
import sedInterpretationsEnvironment from '../../assets/forms/sed/interpretations-environment.json';
import sedInterpretationsProcess from '../../assets/forms/sed/interpretations-process.json';
import sedInterpretationsSurfaces from '../../assets/forms/sed/interpretations-surfaces.json';
import sedLithologiesComposition from '../../assets/forms/sed/lithologies-composition.json';
import sedLithologiesLithology from '../../assets/forms/sed/lithologies-lithology.json';
import sedLithologiesStratification from '../../assets/forms/sed/lithologies-stratification.json';
import sedLithologiesTexture from '../../assets/forms/sed/lithologies-texture.json';
import sedStructuresBeddingPlane from '../../assets/forms/sed/structures-bedding-plane.json';
import sedStructuresBioturbation from '../../assets/forms/sed/structures-bioturbation.json';
import sedStructuresPedogenic from '../../assets/forms/sed/structures-pedogenic.json';
import sedStructuresPhysical from '../../assets/forms/sed/structures-physical.json';
import tephraAdditional from '../../assets/forms/tephra/additional.json';
import tephraBasic from '../../assets/forms/tephra/basic.json';

// Every tab of a feature edits the one record, and a save keeps only what the shown tab's survey calls relevant. A
// field on two tabs with different rules is therefore erased by whichever tab hides it - a Volcaniclastic Type
// entered on Composition went on the next Lithology save unless the primary lithology was volcaniclastic.
const TABBED_FORMS = {
  'sed lithologies': [sedLithologiesLithology, sedLithologiesComposition, sedLithologiesTexture,
    sedLithologiesStratification],
  'sed structures': [sedStructuresBeddingPlane, sedStructuresBioturbation, sedStructuresPedogenic,
    sedStructuresPhysical],
  'sed interpretations': [sedInterpretationsArchitecture, sedInterpretationsEnvironment, sedInterpretationsProcess,
    sedInterpretationsSurfaces],
  'tephra': [tephraBasic, tephraAdditional],
};

// Each field defined on more than one tab, with the rule every tab gives it
const getSharedFieldRules = (forms) => {
  const rulesByName = forms.flatMap(form => form.survey)
    .filter(field => field.name && !field.type.includes('group'))
    .reduce((acc, field) => ({...acc, [field.name]: [...(acc[field.name] || []), field.relevant || '']}), {});
  return Object.entries(rulesByName).filter(([, rules]) => rules.length > 1);
};

describe('tabbed forms', () => {
  it.each(Object.entries(TABBED_FORMS))('give a field shared by %s tabs the same rule on every tab', (_, forms) => {
    getSharedFieldRules(forms).forEach(([name, rules]) => {
      expect({name, rules}).toEqual({name, rules: rules.map(() => rules[0])});
    });
  });

  it('show a shared type on Composition only for the primary lithology the Lithology tab shows it for', () => {
    const lithologyTypes = Object.fromEntries(getSharedFieldRules([sedLithologiesLithology, sedLithologiesComposition]));
    expect(lithologyTypes.volcaniclastic_type).toEqual(Array(2).fill('${primary_lithology} = \'volcaniclastic\''));
  });
});
