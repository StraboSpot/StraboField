import {MINERAL_GLOSSARY_INFO} from './mineralsGlossary.constants';

export const ABBREVIATIONS_WITH_LABELS = (
  MINERAL_GLOSSARY_INFO.reduce((acc, mineral) => {
    if (mineral.Abbreviation) {
      mineral.Abbreviation.split(', ').forEach((abb) => {
        acc[abb] = mineral.Label;
      });
    }
    return acc;
  }, {})
);
console.log('ABBREVIATIONS_WITH_LABELS', ABBREVIATIONS_WITH_LABELS);

export const ADD_MINERAL_KEYS = {
  firstKeys: ['mineral_abbrev', 'full_mineral_name'],
  igOrMetKey: 'igneous_or_metamorphic',
  igButtonsKeys: ['habit', 'textural_setting_igneous'],
  metButtonsKeys: ['habit_met', 'textural_setting_metamorphic'],
  lastKeys: ['average_grain_size_mm', 'maximum_grain_size_mm', 'modal', 'mineral_notes'],
};

export const LABELS_WITH_ABBREVIATIONS = (
  MINERAL_GLOSSARY_INFO.reduce((acc, mineral) => {
    return mineral.Abbreviation ? {...acc, [mineral.Label]: mineral.Abbreviation} : acc;
  }, {})
);
console.log('LABELS_WITH_ABBREVIATIONS', LABELS_WITH_ABBREVIATIONS);

export const MINERALS_BY_CLASS = (
  MINERAL_GLOSSARY_INFO.reduce((acc, mineral) => {
    if (mineral['Rock Class']) {
      mineral['Rock Class'].split(', ').map((rockClass) => {
        if (!acc[rockClass]) acc[rockClass] = [];
        acc[rockClass].push(mineral);
      });
    }
    return acc;
  }, {})
);
console.log('MINERALS_BY_CLASS', MINERALS_BY_CLASS);

export const TERNARY_MINERALS = {
  q: ['quartz'],                                                                              // Quartz
  a: ['k-feldspar', 'k_feldspar', 'microcline', 'orthoclase', 'sanidine'],       // Alkali feldspar, include albite?
  p: ['plagioclase', 'plagioclase feldspar'],                                                 // Plagioclase
  f: ['leucite', 'nepheline'],                                                                // Feldspathoids
  ol: ['olivine'],                                                                            // Olivine
  opx: ['orthopyroxene'],                                                                     // Orthopyroxene
  cpx: ['clinopyroxene', 'augite', 'diopside', 'cr_diopside', 'cr-diopside', 'cr diopside', 'spodumene', 'na pyroxene', 'na_pyroxene'], // Clinopyroxene
  pyx: ['na pyroxene', 'na_pyroxene', 'clinopyroxene', 'augite', 'diopside', 'cr_diopside', 'cr-diopside', 'cr diopside', 'spodumene', 'orthopyroxene'], // Pyroxene
  hbl: ['hornblende', 'magnesio-hornblende', 'mg_hornblende'],                                 // Hornblende
};
